import serverless from 'serverless-http';
import type { IncomingMessage, ServerResponse } from 'http';
let handler: any = null;

export default async function nestHandler(req: IncomingMessage, res: ServerResponse) {
  if (!handler) {
    // Dynamically import to ensure compiled files are used
    const mod = await import('./main.js');
    const createServer = mod.createServer ?? mod.default?.createServer ?? mod.default;
    const app = await createServer();
    handler = serverless(app as any);
  }

  return handler(req as any, res as any);
}
