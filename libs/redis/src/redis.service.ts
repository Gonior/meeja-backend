import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { EnvService } from '@app/common';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private connected = false;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly env: EnvService) {}
  onModuleInit() {
    this.client = createClient({
      url: this.env.redisConfig.url,
      socket: {
        reconnectStrategy: () => {
          // if (retries > 10) {
          //   this.logger.error(`Redis failed after ${retries} retiers, giving up.`);
          //   return false;
          // }
          return 2000;
        },
        connectTimeout: 2000,
      },
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('reconnecting', () => {
      this.logger.debug(`🛠️ Redis reconnecting...`, RedisService.name);
    });
    this.client.on('end', () => {
      this.connected = false;
      // this.logger.warn(`Redis connection closed`, RedisService.name);
    });
    this.client.on('connect', () => {
      this.logger.warn(`✅ Redis connected successfully`, RedisService.name);
    });
    this.client.on('ready', () => {
      this.connected = true;
      this.logger.warn(`Redis is ready`, RedisService.name);
    });
    this.client.connect().catch((error) => {
      this.logger.error(`❌ Redis connection failed: ${error?.message}`);
    });
    this.logger.warn(`Redis connecting in backgroud, continuing app startup...`, RedisService.name);
  }

  getClient() {
    return this.client;
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), ms);
      promise
        .then((res) => {
          clearTimeout(timer);
          try {
            if (typeof res === 'string') {
              resolve(JSON.parse(res));
            } else resolve(res);
          } catch {
            resolve(res);
          }
        })
        .catch((err) => {
          clearTimeout(timer);
          this.logger.warn(`Redis operation failed:${err.message}`, RedisService.name);
          resolve(null);
        });
    });
  }
  async set(key: string, value: any, options?: { EX?: number }) {
    if (!this.client.isReady) {
      this.logger.warn('⚠️ Redis not connected, nothing to set', RedisService.name);
      return null;
    } else {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await this.withTimeout(this.client.set(key, serialized, options), 2000);
    }
  }

  async get(key: string) {
    if (!this.client.isReady) {
      this.logger.warn('⚠️ Redis not connected, nothing to get', RedisService.name);
      return null;
    } else {
      return this.withTimeout(this.client.get(key), 2000);
    }
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async onModuleDestroy() {
    if (!this.client) return;
    try {
      if (this.connected && this.client.isOpen) {
        this.logger.warn('🧹 Closing Redis connection...', RedisService.name);
        await this.client.quit();
        this.logger.debug('Redis connection closed gracefully...', RedisService.name);
      } else {
        this.logger.debug('Redis client not connected, skipping close', RedisService.name);
      }
    } catch (error) {
      this.logger.warn(`Redis shutdown error (ignored): ${error?.message}`, RedisService.name);
    }
  }
}
