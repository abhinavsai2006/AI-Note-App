import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : path;
  
  const searchParams = new URLSearchParams(req.query as Record<string, string>);
  searchParams.delete('path');
  
  const targetUrl = `https://api-snowy-rho-50.vercel.app/api/${pathString}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  try {
    const headers = { ...req.headers } as Record<string, string>;
    delete headers.host;
    delete headers.connection;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : undefined,
    });

    const data = await response.arrayBuffer();
    
    // Copy headers from target response
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.status(response.status).send(Buffer.from(data));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy request' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
