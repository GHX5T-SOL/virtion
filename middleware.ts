// Vercel Edge Middleware: serves the LiveKit voice token path directly and
// proxies /agent/* plus other backend paths with a shared-secret header.

export const config = {
  matcher: ['/agent/:path*', '/voice/:path*', '/health'],
};

const BACKEND_URL = process.env.VIRTION_BACKEND_URL || process.env.BACKEND_URL || '';

function env(name: string): string {
  return process.env[name] || '';
}

function livekitUrl(): string {
  return env('LIVEKIT_URL').replace(/\/+$/, '');
}

function livekitHttpUrl(): string {
  return livekitUrl().replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
}

function hasLiveKitConfig(): boolean {
  return Boolean(livekitUrl() && env('LIVEKIT_API_KEY') && env('LIVEKIT_API_SECRET'));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function textToBase64Url(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
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

function randomToken(bytes = 8): string {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return bytesToBase64Url(data);
}

function safeCaseId(value: unknown): string {
  return String(value || 'case').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'case';
}

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

function voiceHealthPatch(body: Record<string, any> = {}): Record<string, any> {
  return {
    ...body,
    ok: body.ok ?? true,
    edge_proxy: {
      ...(body.edge_proxy || {}),
      voice_token: 'livekit-edge',
      backend_proxy_configured: Boolean(BACKEND_URL),
    },
    voice: {
      ...(body.voice || {}),
      transport: 'livekit',
      livekit_configured: hasLiveKitConfig(),
      deepgram_configured: Boolean(env('DEEPGRAM_API_KEY')),
      cartesia_configured: Boolean(env('CARTESIA_API_KEY')),
      elevenlabs_configured: Boolean(env('ELEVEN_API_KEY') || env('ELEVENLABS_API_KEY')),
      openai_voice_configured: Boolean(env('OPENAI_API_KEY')),
      fallback_order: {
        stt: ['deepgram', 'openai', 'text_fallback'],
        llm: ['anthropic', 'openai', 'text_fallback'],
        tts: ['cartesia', 'elevenlabs', 'openai', 'text_fallback'],
      },
    },
  };
}

async function createLiveKitRoom(roomName: string, metadata: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const adminToken = await signJwt(
    {
      iss: env('LIVEKIT_API_KEY'),
      sub: 'virtion-edge-room-admin',
      nbf: now - 10,
      exp: now + 600,
      video: {
        roomCreate: true,
        roomAdmin: true,
        room: roomName,
      },
    },
    env('LIVEKIT_API_SECRET')
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
  if (create.ok) return;

  const errorText = await create.text().catch(() => '');
  if (/already|exist/i.test(errorText)) return;

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

async function handleVoiceToken(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ detail: 'method not allowed' }, 405);
  }
  if (!hasLiveKitConfig()) {
    return jsonResponse({ detail: 'LIVEKIT_URL/LIVEKIT_API_KEY/LIVEKIT_API_SECRET not configured' }, 503);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ detail: 'invalid JSON body' }, 400);
  }

  const roomName = `vr-${safeCaseId(body.caseId)}-${randomToken(8)}`;
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
  } catch (error: any) {
    return jsonResponse({ detail: error?.message || 'LiveKit room create failed' }, 502);
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await signJwt(
    {
      iss: env('LIVEKIT_API_KEY'),
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
    env('LIVEKIT_API_SECRET')
  );

  return jsonResponse({ token, url: livekitUrl(), roomName });
}

export default async function middleware(request: Request): Promise<Response> {
  const incoming = new URL(request.url);

  if (incoming.pathname === '/voice/token') {
    return handleVoiceToken(request);
  }

  if (!BACKEND_URL) {
    if (incoming.pathname === '/health') {
      return jsonResponse(voiceHealthPatch());
    }
    return Response.json(
      { detail: 'backend proxy is not configured', degraded: true },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }

  const target = BACKEND_URL + incoming.pathname + incoming.search;

  const headers = new Headers(request.headers);
  const secret = process.env.BACKEND_SHARED_SECRET;
  if (secret) {
    headers.set('x-virtion-auth', secret);
  }
  // host must match the target, not the Vercel edge.
  headers.delete('host');

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  // Buffer the request body — Vercel Edge runtime can't pass through a
  // streaming ReadableBody to fetch reliably. POST payloads are small
  // (JSON), so the cost is negligible. SSE responses still stream back.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    if (incoming.pathname === '/health') {
      return jsonResponse(voiceHealthPatch({ degraded: true, backend_error: 'unreachable' }));
    }
    return jsonResponse({ detail: 'backend proxy unreachable', degraded: true }, 502);
  }
  if (incoming.pathname === '/health') {
    try {
      return jsonResponse(voiceHealthPatch(await upstream.clone().json()), upstream.status);
    } catch {
      return jsonResponse(voiceHealthPatch());
    }
  }

  return upstream;
}
