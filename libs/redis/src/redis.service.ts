import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { EnvService } from '@app/common';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private connected = false;
  private reconnecting = false;
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
      this.reconnecting = true;
      this.logger.debug(`🛠️ Redis reconnecting...`);
    });
    this.client.on('end', () => {
      this.connected = false;
      // this.logger.warn(`Redis connection closed`);
    });
    this.client.on('connect', () => {
      this.reconnecting = false;
      this.logger.warn(`✅ Redis connected successfully`);
    });
    this.client.on('ready', () => {
      this.reconnecting = false;
      this.connected = true;
      this.logger.warn(`Redis is ready`);
    });
    this.client.connect().catch((error) => {
      this.logger.error(`❌ Redis connection failed: ${error?.message}`);
    });
    this.logger.warn(`Redis connecting in backgroud, continuing app startup...`);
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
          this.logger.warn(`Redis operation failed:${err.message}`);
          resolve(null);
        });
    });
  }
  async set(key: string, value: any, options?: { EX?: number }) {
    if (!this.client.isReady) {
      this.logger.warn('⚠️ Redis not connected, nothing to set');
      return null;
    } else {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await this.withTimeout(this.client.set(key, serialized, options), 2000);
    }
  }

  async get(key: string) {
    if (!this.client.isReady) {
      this.logger.warn('⚠️ Redis not connected, nothing to get');
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
        this.logger.warn('🧹 Closing Redis connection...');
        await this.client.quit();
        this.logger.debug('Redis connection closed gracefully...');
      } else {
        this.logger.debug('Redis client not connected, skipping close');
      }
    } catch (error) {
      this.logger.warn(`Redis shutdown error (ignored): ${error?.message}`);
    }
  }

  async checkHealth() {
    try {
      const start = Date.now();
      const response = await this.client.ping();
      const latency = Date.now() - start;
      return {
        status: response === 'PONG' ? 'ok' : 'error',
        latency: `${latency}ms`,
        reconnecting: this.reconnecting,
      };
    } catch (error) {
      let message = '';
      if (error instanceof Error) message = error.message;
      else message = String(error);
      return {
        status: 'error',
        message: message,
        reconnectiong: this.reconnecting,
      };
    }
  }
}
