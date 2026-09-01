import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface RateLimitRecord {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

@Injectable()
export class InvitationRateLimiterService {
  private readonly attempts = new Map<string, RateLimitRecord>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 60 * 1000; // 1 minute window
  private readonly BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout on violation

  checkRateLimit(key: string): void {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, {
        count: 1,
        resetAt: now + this.WINDOW_MS,
      });
      return;
    }

    // Check if currently blocked
    if (record.blockedUntil && record.blockedUntil > now) {
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Too many failed invitation validation attempts. Please try again in ${remainingSeconds} seconds.`,
          retryAfter: remainingSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Reset window if expired
    if (now > record.resetAt) {
      this.attempts.set(key, {
        count: 1,
        resetAt: now + this.WINDOW_MS,
      });
      return;
    }

    // Increment count
    record.count += 1;

    if (record.count > this.MAX_ATTEMPTS) {
      record.blockedUntil = now + this.BLOCK_DURATION_MS;
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message:
            'Too many failed invitation validation attempts. Account / IP temporarily blocked for 15 minutes.',
          retryAfter: Math.ceil(this.BLOCK_DURATION_MS / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordSuccess(key: string): void {
    this.attempts.delete(key);
  }

  // Periodic cleanup of stale records
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (now > record.resetAt && (!record.blockedUntil || now > record.blockedUntil)) {
        this.attempts.delete(key);
      }
    }
  }
}
