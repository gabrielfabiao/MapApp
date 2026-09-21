// Proxies /api/plantnet/* to https://my-api.plantnet.org/*
//
// The frontend can't call Pl@ntNet directly from the browser (their API
// treats it as a non-server request based on Origin/Referer). This runs
// server-side, so those headers are never sent in the first place — no
// stripping needed, unlike the old dev-only Vite proxy this replaces.

export const runtime = 'nodejs';

async function handler(request) {
  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/^\/api\/plantnet\//, '');
  const targetUrl = `https://my-api.plantnet.org/${targetPath}${url.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  const isBodyless = request.method === 'GET' || request.method === 'HEAD';

  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: isBodyless ? undefined : request.body,
    duplex: isBodyless ? undefined : 'half',
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  responseHeaders.set('access-control-allow-origin', '*');

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
