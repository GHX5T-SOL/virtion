const HOP_BY_HOP_HEADERS = [
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
];

function readEnv(name) {
  try {
    const netlifyValue = globalThis.Netlify?.env?.get?.(name);
    if (netlifyValue) return netlifyValue;
  } catch {
    // Local Node smoke tests do not provide Netlify.env.
  }
  try {
    if (typeof process !== 'undefined' && process.env?.[name]) return process.env[name];
  } catch {
    // Deno edge runtime does not provide process.
  }
  try {
    if (typeof Deno !== 'undefined') return Deno.env.get(name);
  } catch {
    // Deno env access can be unavailable in local tooling.
  }
  return '';
}

function backendBaseUrl() {
  const configured =
    readEnv('VIRTION_BACKEND_URL') ||
    readEnv('BACKEND_URL') ||
    readEnv('NETLIFY_BACKEND_URL');
  return configured.replace(/\/+$/, '');
}

function livekitUrl() {
  return readEnv('LIVEKIT_URL').replace(/\/+$/, '');
}

function livekitHttpUrl() {
  return livekitUrl().replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
}

function hasLiveKitConfig() {
  return Boolean(livekitUrl() && readEnv('LIVEKIT_API_KEY') && readEnv('LIVEKIT_API_SECRET'));
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function textToBase64Url(text) {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

async function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const signingInput = `${textToBase64Url(JSON.stringify(header))}.${textToBase64Url(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

function randomToken(bytes = 8) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return bytesToBase64Url(data);
}

function safeCaseId(value) {
  return String(value || 'case').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'case';
}

function normalizeProvider(name) {
  const normalized = String(name || '').trim().toLowerCase().replace(/\s+/g, '-');
  const aliases = {
    eleven: 'elevenlabs',
    eleven_labs: 'elevenlabs',
    vercel: 'vercel-ai-gateway',
    vercel_ai_gateway: 'vercel-ai-gateway',
    'vercel-gateway': 'vercel-ai-gateway',
  };
  return aliases[normalized] || normalized;
}

function providerOrder(envName, defaultOrder) {
  const requested = readEnv(envName).split(',').map(normalizeProvider).filter(Boolean);
  const ordered = [];
  for (const name of [...requested, ...defaultOrder]) {
    if (name && !ordered.includes(name)) ordered.push(name);
  }
  return ordered;
}

function jsonResponse(body, status = 200, request) {
  const headers = new Headers({
    'content-type': 'application/json',
    'cache-control': 'no-store',
  });
  if (request) appendCors(headers, request);
  return new Response(JSON.stringify(body), { status, headers });
}

function voiceHealthPatch(body = {}) {
  return {
    ...body,
    ok: body.ok ?? true,
    edge_proxy: {
      ...(body.edge_proxy || {}),
      voice_token: 'livekit-edge',
      backend_proxy_configured: Boolean(backendBaseUrl()),
    },
    voice: {
      ...(body.voice || {}),
      transport: 'livekit',
      livekit_configured: hasLiveKitConfig(),
      deepgram_configured: Boolean(readEnv('DEEPGRAM_API_KEY')),
      cartesia_configured: Boolean(readEnv('CARTESIA_API_KEY')),
      elevenlabs_configured: Boolean(readEnv('ELEVEN_API_KEY') || readEnv('ELEVENLABS_API_KEY')),
      openai_voice_configured: Boolean(readEnv('OPENAI_API_KEY')),
      fallback_order: {
        stt: providerOrder('VOICE_STT_ORDER', ['deepgram', 'openai', 'text_fallback']),
        llm: providerOrder('VOICE_LLM_ORDER', ['openai', 'openrouter', 'gemini', 'vercel-ai-gateway', 'cerebras', 'anthropic', 'text_fallback']),
        tts: providerOrder('VOICE_TTS_ORDER', ['openai', 'elevenlabs', 'cartesia', 'text_fallback']),
      },
    },
  };
}

async function createLiveKitRoom(roomName, metadata) {
  const apiKey = readEnv('LIVEKIT_API_KEY');
  const apiSecret = readEnv('LIVEKIT_API_SECRET');
  const now = Math.floor(Date.now() / 1000);
  const adminToken = await signJwt(
    {
      iss: apiKey,
      sub: 'virtion-edge-room-admin',
      nbf: now - 10,
      exp: now + 600,
      video: {
        roomCreate: true,
        roomAdmin: true,
        room: roomName,
      },
    },
    apiSecret
  );
  const headers = {
    authorization: `Bearer ${adminToken}`,
    'content-type': 'application/json',
  };
  const createUrl = `${livekitHttpUrl()}/twirp/livekit.RoomService/CreateRoom`;
  const createPayload = {
    name: roomName,
    metadata,
    empty_timeout: 120,
    agents: [{ agent_name: 'virtion-voice' }],
  };
  const create = await fetch(createUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(createPayload),
  });
  if (create.ok) {
    await updateLiveKitRoomMetadata(roomName, metadata, headers);
    return;
  }

  const errorText = await create.text().catch(() => '');
  if (/already|exist/i.test(errorText)) {
    await updateLiveKitRoomMetadata(roomName, metadata, headers);
    return;
  }

  const fallbackCreate = await fetch(createUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: roomName, metadata, empty_timeout: 120 }),
  });
  if (!fallbackCreate.ok) {
    const fallbackText = await fallbackCreate.text().catch(() => '');
    if (!/already|exist/i.test(fallbackText)) {
      throw new Error(`LiveKit room create failed: ${fallbackText || errorText || fallbackCreate.status}`);
    }
  }

  await updateLiveKitRoomMetadata(roomName, metadata, headers);

  const dispatch = await fetch(`${livekitHttpUrl()}/twirp/livekit.AgentDispatchService/CreateDispatch`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ room: roomName, agent_name: 'virtion-voice' }),
  });
  if (!dispatch.ok) {
    const dispatchText = await dispatch.text().catch(() => '');
    throw new Error(`LiveKit agent dispatch failed: ${dispatchText || dispatch.status}`);
  }
}

async function updateLiveKitRoomMetadata(roomName, metadata, headers) {
  const update = await fetch(`${livekitHttpUrl()}/twirp/livekit.RoomService/UpdateRoomMetadata`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ room: roomName, metadata }),
  });
  if (!update.ok) {
    const updateText = await update.text().catch(() => '');
    throw new Error(`LiveKit room metadata update failed: ${updateText || update.status}`);
  }
}

async function handleVoiceToken(request) {
  if (request.method !== 'POST') {
    return jsonResponse({ detail: 'method not allowed' }, 405, request);
  }
  if (!hasLiveKitConfig()) {
    return jsonResponse({ detail: 'LIVEKIT_URL/LIVEKIT_API_KEY/LIVEKIT_API_SECRET not configured' }, 503, request);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ detail: 'invalid JSON body' }, 400, request);
  }

  const nonce = randomToken(8);
  const roomName = `vr-${safeCaseId(body.caseId)}-${nonce}`;
  const identity = body.identity || `doctor-${randomToken(4)}`;
  const metadata = JSON.stringify({
    caseId: body.caseId,
    systemPrompt: body.systemPrompt,
    initialLine: body.initialLine,
    voiceGender: body.gender,
    voiceId: body.voiceId,
  });

  try {
    await createLiveKitRoom(roomName, metadata);
  } catch (error) {
    return jsonResponse({ detail: error?.message || 'LiveKit room create failed' }, 502, request);
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await signJwt(
    {
      iss: readEnv('LIVEKIT_API_KEY'),
      sub: identity,
      name: identity,
      nbf: now - 10,
      exp: now + 60 * 60,
      video: {
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      },
    },
    readEnv('LIVEKIT_API_SECRET')
  );

  return jsonResponse({ token, url: livekitUrl(), roomName }, 200, request);
}

function appendCors(headers, request) {
  const origin = request.headers.get('origin');
  if (!origin) return headers;
  headers.set('access-control-allow-origin', origin);
  headers.set('access-control-allow-credentials', 'true');
  headers.set('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  headers.set(
    'access-control-allow-headers',
    request.headers.get('access-control-request-headers') ||
      'authorization,content-type,x-virtion-auth'
  );
  const vary = headers.get('vary');
  headers.set('vary', vary ? `${vary}, Origin, Access-Control-Request-Headers` : 'Origin, Access-Control-Request-Headers');
  return headers;
}

function isBodyless(method) {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

function createTimeout(ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: appendCors(new Headers({ 'cache-control': 'no-store' }), request),
    });
  }

  const incoming = new URL(request.url);
  if (incoming.pathname === '/voice/token') {
    return handleVoiceToken(request);
  }

  if (!backendBaseUrl()) {
    if (incoming.pathname === '/health') {
      return jsonResponse(voiceHealthPatch(), 200, request);
    }
    return new Response(JSON.stringify({ detail: 'backend proxy is not configured', degraded: true }), {
      status: 503,
      headers: appendCors(new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' }), request),
    });
  }

  const target = new URL(`${incoming.pathname}${incoming.search}`, `${backendBaseUrl()}/`);
  const headers = new Headers(request.headers);

  for (const header of HOP_BY_HOP_HEADERS) headers.delete(header);
  headers.set('x-forwarded-host', incoming.host);
  headers.set('x-forwarded-proto', incoming.protocol.replace(':', ''));
  headers.set('x-virtion-proxy', 'netlify-edge');

  const secret = readEnv('BACKEND_SHARED_SECRET');
  if (secret) headers.set('x-virtion-auth', secret);

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };
  if (!isBodyless(request.method)) {
    init.body = await request.arrayBuffer();
  }

  let upstream;
  const timeout = createTimeout(8000);
  try {
    upstream = await fetch(target, { ...init, signal: timeout.signal });
  } catch (error) {
    if (incoming.pathname === '/health') {
      return jsonResponse(voiceHealthPatch({ degraded: true, backend_error: 'unreachable' }), 200, request);
    }
    return jsonResponse({ detail: 'backend proxy unreachable', degraded: true }, 502, request);
  } finally {
    timeout.clear();
  }
  if (incoming.pathname === '/health') {
    try {
      const body = await upstream.clone().json();
      return jsonResponse(voiceHealthPatch(body), upstream.status, request);
    } catch {
      return jsonResponse(voiceHealthPatch(), 200, request);
    }
  }

  const responseHeaders = new Headers(upstream.headers);
  for (const header of HOP_BY_HOP_HEADERS) responseHeaders.delete(header);
  responseHeaders.delete('content-length');
  responseHeaders.set('cache-control', 'no-store');
  appendCors(responseHeaders, request);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export { readEnv, backendBaseUrl };
