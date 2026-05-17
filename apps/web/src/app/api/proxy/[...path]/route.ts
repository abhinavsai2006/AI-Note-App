import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const searchParams = req.nextUrl.searchParams.toString();
  
  // Use environment variable for API URL, with fallback
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
  const targetUrl = `${apiBase}/api/${path}${searchParams ? `?${searchParams}` : ''}`;

  console.log('[Proxy] Forwarding request:', {
    from: req.nextUrl.pathname,
    to: targetUrl,
    method: req.method,
  });

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');

  try {
    let body: BodyInit | undefined = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const contentType = req.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = JSON.stringify(await req.json());
      } else {
        body = await req.arrayBuffer();
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (response.status >= 500) {
      const errorText = await response.text().catch(() => '');
      console.warn('[Proxy] Upstream server error:', {
        target: targetUrl,
        status: response.status,
      });

      return NextResponse.json(
        {
          error: 'Upstream API unavailable',
          statusCode: 502,
          upstreamStatus: response.status,
          details: errorText || response.statusText || 'Backend returned a server error',
        },
        { status: 502 }
      );
    }

    const data = await response.arrayBuffer();
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    console.error('[Proxy] Error forwarding request:', {
      target: targetUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: isTimeout ? 'Upstream request timed out' : 'Failed to proxy request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}

