import { Global, Inject, Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';
import { DBConfig } from '../../core/configs/db.config';
import { CACHE_INVALIDATOR, REDIS_CLIENT } from './constants';
import { RedisCacheService } from './redis-cache.service';
import { CacheService } from './cache.service';
import { RedisCacheInvalidator } from './cache-invalidator';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [DBConfig],
      useFactory: async (dbConfig: DBConfig): Promise<Redis> => {
        const logger = new Logger('RedisConfig');
        const client = new Redis({
          host: dbConfig.redisHost,
          port: dbConfig.redisPort,
          password: dbConfig.redisPassword || undefined,
          lazyConnect: true,
          maxRetriesPerRequest: 3,
        });
        if (!dbConfig.isTesting) {
          await client.connect();
          logger.log(`Redis connected at ${dbConfig.redisHost}:${dbConfig.redisPort}`);
        }
        return client;
      },
    },
    RedisCacheService,
    CacheService,
    { provide: CACHE_INVALIDATOR, useClass: RedisCacheInvalidator },
  ],
  exports: [CacheService, CACHE_INVALIDATOR],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }
}