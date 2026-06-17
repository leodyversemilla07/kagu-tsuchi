import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  type NestMiddleware,
} from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Defaults: 30 requests per 60-second window per IP.
 * Configure via environment variables:
 *   RATE_LIMIT_MAX   — max requests per window (default 30)
 *   RATE_LIMIT_WINDOW — window size in seconds (default 60)
 */
@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimiterMiddleware.name);
  private readonly hits = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor() {
    this.maxRequests = Number(process.env.RATE_LIMIT_MAX) || 30;
    this.windowMs = (Number(process.env.RATE_LIMIT_WINDOW) || 60) * 1000;

    // Periodic cleanup every 2 minutes to prevent memory leaks
    setInterval(() => this.cleanup(), 120_000).unref();
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const key = this.extractKey(req);
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || now > entry.resetAt) {
      // New window
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      this.setHeaders(res, this.maxRequests - 1, this.windowMs);
      next();
      return;
    }

    if (entry.count >= this.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      this.logger.warn(
        `Rate limit exceeded for ${key} — retry after ${retryAfter}s`
      );
      res.setHeader("Retry-After", retryAfter.toString());
      throw new HttpException(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    entry.count += 1;
    this.setHeaders(res, this.maxRequests - entry.count, entry.resetAt - now);
    next();
  }

  private extractKey(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (typeof forwarded === "string" ? forwarded.split(",")[0] : null) ??
      req.ip ??
      "unknown";
    return ip;
  }

  private setHeaders(res: Response, remaining: number, ttlMs: number): void {
    res.setHeader("X-RateLimit-Limit", this.maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, remaining).toString());
    res.setHeader(
      "X-RateLimit-Reset",
      Math.ceil(Date.now() + ttlMs).toString()
    );
  }

  private cleanup(): void {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.hits) {
      if (now > entry.resetAt) {
        this.hits.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      this.logger.debug(
        `Rate limiter cleanup: removed ${removed} expired entries`
      );
    }
  }
}
