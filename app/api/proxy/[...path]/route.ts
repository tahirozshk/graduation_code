import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.path);
}

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.path);
}

async function handleProxy(request: Request, pathArray: string[]) {
  const path = pathArray.join('/');
  const targetUrl = `https://backend.profdux.com/api/${path}`;
  const { searchParams } = new URL(request.url);
  const finalUrl = `${targetUrl}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

  console.log(`[PROXY REQUEST] ${request.method} -> ${finalUrl}`);

  const headers = new Headers(request.headers);
  // Ensure the host is set correctly for the backend
  headers.set('Host', 'backend.profdux.com');
  // Specifically log if the Authorization header is present
  const auth = headers.get('Authorization');
  console.log(`[PROXY AUTH] Token Present: ${auth ? 'YES (' + auth.substring(0, 20) + '...)' : 'NO'}`);
  
  try {
    const options: RequestInit = {
      method: request.method,
      headers: headers,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      options.body = await request.blob();
    }

    const response = await fetch(finalUrl, options);
    const buffer = await response.arrayBuffer();
    
    const responseHeaders = new Headers();
    response.headers.forEach((v, k) => {
      const key = k.toLowerCase();
      if (key !== 'content-encoding' && key !== 'content-length' && key !== 'transfer-encoding') {
        responseHeaders.set(k, v);
      }
    });

    return new NextResponse(buffer, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[PROXY CRITICAL ERROR]', error);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}
