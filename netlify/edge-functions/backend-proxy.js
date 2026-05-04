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

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: appendCors(new Headers({ 'cache-control': 'no-store' }), request),
    });
  }

  if (!backendBaseUrl()) {
    return new Response(JSON.stringify({ detail: 'backend proxy is not configured', degraded: true }), {
      status: 503,
      headers: appendCors(new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' }), request),
    });
  }

  const incoming = new URL(request.url);
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

  const upstream = await fetch(target, init);
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
