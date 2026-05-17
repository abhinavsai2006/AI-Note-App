import serverless from 'serverless-http';
import type { IncomingMessage, ServerResponse } from 'http';
import { createServer } from './main';

let handler: any = null;

export default async function nestHandler(req: IncomingMessage, res: ServerResponse) {
  if (!handler) {
    const app = await createServer();
    handler = serverless(app as any);
  }

  return handler(req as any, res as any);
}
