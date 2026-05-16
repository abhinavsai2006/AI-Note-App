import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth) throw new UnauthorizedException('Missing Authorization header');
    const token = auth.replace(/^Bearer\s+/i, '');
    try {
      const payload = this.jwtService.verify(token);
      // attach payload to request.user for downstream handlers
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      req.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
