import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './constants';
import { DBConfig } from '../../core/configs/db.config';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly client: Redis,
    private readonly dbConfig: DBConfig,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (e) {
      this.logger.warn(`Cache get failed for "${key}"`, e);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSec?: number): Promise<void> {
    try {
      const ttl = ttlSec ?? this.dbConfig.redisTtl;
      await this.client.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (e) {
      this.logger.warn(`Cache set failed for "${key}"`, e);
    }
  }

  async del(key: string | string[]): Promise<void> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length) await this.client.del(...keys);
    } catch (e) {
      this.logger.warn(`Cache del failed`, e);
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    try {
      const stream = this.client.scanStream({ match: `${prefix}*`, count: 100 });
      for await (const keys of stream) {
        if ((keys as string[]).length) {
          await this.client.unlink(...(keys as string[]));
        }
      }
    } catch (e) {
      this.logger.warn(`Cache delByPrefix failed for prefix "${prefix}"`, e);
    }
  }

  async wrap<T>(
    key: string,
    ttlSec: number | undefined,
    loader: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const result = await loader();
    if (result !== null && result !== undefined) {
      this.set(key, result, ttlSec).catch(() => {});
    }
    return result;
  }
}