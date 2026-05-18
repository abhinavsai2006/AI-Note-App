import type { IncomingMessage, ServerResponse } from 'http';
import { createServer } from './main';

let handler: any = null;

export default async function nestHandler(req: IncomingMessage, res: ServerResponse) {
  if (!handler) {
    handler = await createServer();
  }

  return handler(req, res);
}

