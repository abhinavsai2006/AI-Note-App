import type { NextApiRequest, NextApiResponse } from 'next';

// This Next API route proxies all /api/* requests to the Nest serverless handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Import the compiled serverless handler from the API build output
    const mod = await import('../../../../apps/api/dist/serverless');
    const fn = mod.default ?? mod.handler ?? mod;
    if (typeof fn !== 'function') {
      throw new Error('Serverless handler not found');
    }
    // Next.js provides req/res compatible with Node http IncomingMessage/ServerResponse
    return await fn(req, res);
  } catch (err: any) {
    console.error('Error proxying to Nest serverless handler:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
