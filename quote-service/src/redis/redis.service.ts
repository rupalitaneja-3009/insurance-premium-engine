import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      socket: {
        host: this.config.get('REDIS_HOST', 'localhost'),
        port: this.config.get<number>('REDIS_PORT', 6381),
      },
    }) as RedisClientType;

    this.client.on('error', (err) => this.logger.error('Redis error:', err));

    await this.client.connect();
    this.logger.log('Redis connected');
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.setEx(key, ttlSeconds, value);
    } catch (err) {
      this.logger.error('Redis set error:', err);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error('Redis del error:', err);
    }
  }
}
