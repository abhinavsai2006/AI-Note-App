import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

const wsOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: wsOrigins.length > 0 ? wsOrigins : true,
    credentials: true,
  },
})
export class EventsGateway {
  @SubscribeMessage('message')
  handleMessage(_client: unknown, payload: unknown) {
    return { event: 'message', payload };
  }
}
