import { CACHE_VERSION, CachePrefix } from './constants';

export class CacheKey {
  static userScope(prefix: CachePrefix, userId: number, ...parts: string[]): string {
    return [CACHE_VERSION, prefix, 'user', userId, ...parts].join(':');
  }

  static userPrefix(prefix: CachePrefix, userId: number): string {
    return `${CACHE_VERSION}:${prefix}:user:${userId}`;
  }
}