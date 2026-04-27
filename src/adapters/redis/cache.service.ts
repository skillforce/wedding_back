import { Injectable } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { CacheKey } from './cache-key';
import { CachePrefix } from './constants';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisCacheService) {}

  // ── reads ─────────────────────────────────────────────────────────

  wrapBudget<T>(userId: number, loader: () => Promise<T>): Promise<T> {
    return this.redis.wrap(CacheKey.userScope(CachePrefix.Budget, userId, 'full'), undefined, loader);
  }

  wrapGuests<T>(userId: number, loader: () => Promise<T>): Promise<T> {
    return this.redis.wrap(CacheKey.userScope(CachePrefix.Guests, userId, 'all'), undefined, loader);
  }

  wrapChecklist<T>(userId: number, loader: () => Promise<T>): Promise<T> {
    return this.redis.wrap(CacheKey.userScope(CachePrefix.Checklist, userId, 'full'), undefined, loader);
  }

  wrapSeatingArrangement<T>(userId: number, loader: () => Promise<T>): Promise<T> {
    return this.redis.wrap(CacheKey.userScope(CachePrefix.SeatingArrangement, userId, 'full'), undefined, loader);
  }

  // ── writes ────────────────────────────────────────────────────────

  evictBudget(userId: number): Promise<void> {
    return this.redis.delByPrefix(CacheKey.userPrefix(CachePrefix.Budget, userId));
  }

  evictGuests(userId: number): Promise<void> {
    return this.redis.delByPrefix(CacheKey.userPrefix(CachePrefix.Guests, userId));
  }

  evictChecklist(userId: number): Promise<void> {
    return this.redis.delByPrefix(CacheKey.userPrefix(CachePrefix.Checklist, userId));
  }

  evictSeatingArrangement(userId: number): Promise<void> {
    return this.redis.delByPrefix(CacheKey.userPrefix(CachePrefix.SeatingArrangement, userId));
  }
}