import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';

// Counts all attempts, including concurrent requests, before password hashing.
@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private readonly attempts = new Map<string, { count: number; expires: number }>();
  private readonly windowMs = 15 * 60 * 1000;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const now = Date.now();
    for (const [key, entry] of this.attempts) {
      if (entry.expires <= now) this.attempts.delete(key);
    }
    const email = typeof request.body?.email === 'string'
      ? request.body.email.trim().toLowerCase() : '';
    const account = createHash('sha256').update(email).digest('hex');
    const keys = [
      { key: `ip:${request.ip ?? request.socket.remoteAddress}`, limit: 30 },
      { key: `account:${account}`, limit: 5 },
    ];
    // Increment both dimensions even when one is already blocked.
    let retryAfter = 0;
    for (const { key, limit } of keys) {
      const entry = this.attempts.get(key) ?? { count: 0, expires: now + this.windowMs };
      entry.count++;
      this.attempts.set(key, entry);
      if (entry.count > limit) retryAfter = Math.max(retryAfter, Math.ceil((entry.expires - now) / 1000));
    }
    if (retryAfter) {
      response.setHeader('Retry-After', retryAfter);
      throw new HttpException('Muitas tentativas de login. Tente novamente mais tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
