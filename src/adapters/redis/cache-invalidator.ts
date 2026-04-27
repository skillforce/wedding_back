import { Injectable } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';

export interface ICacheInvalidator {
  invalidate(prefix: string): Promise<void>;
}

@Injectable()
export class RedisCacheInvalidator implements ICacheInvalidator {
  constructor(private readonly cache: RedisCacheService) {}

  async invalidate(prefix: string): Promise<void> {
    await this.cache.delByPrefix(prefix);
  }
}