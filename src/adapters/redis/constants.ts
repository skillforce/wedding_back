export const CACHE_VERSION = 'v1';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const CACHE_INVALIDATOR = Symbol('CACHE_INVALIDATOR');

export enum CachePrefix {
  Budget = 'budget',
  Guests = 'guests',
}