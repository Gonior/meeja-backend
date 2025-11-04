import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { EnvService } from '@app/common';
import { mapPosgresError } from './helpers';

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private client: Pool;
  private _db: ReturnType<typeof drizzle>;
  private reconnecting = false;
  private reconnectInterval?: NodeJS.Timeout;
  private logger = new Logger(DrizzleService.name);
  constructor(private readonly env: EnvService) {
    this.client = this.createPool();
    this._db = drizzle(this.client);
  }

  private createPool() {
    const pool = new Pool({
      connectionString: this.env.dbConfig.url,
      connectionTimeoutMillis: 3000,
    });
    // terpicu ketika a new client connects
    pool.on('connect', () => {
      this.logger.log('✅ PostgreSQL connected', DrizzleService.name);
      if (this.reconnecting) {
        // kalo semisal sebelumnya dalam mode reconnect, matikan interval
        clearInterval(this.reconnectInterval);
        this.reconnecting = false;
        this.logger.warn('🔄️ Reconnect watcher stopped!', DrizzleService.name);
      }
    });

    // event terpicu ketika pool error (koneksi drop)
    pool.on('error', (err) => {
      this.logger.error(`❌ PosgtreSQL error:${err?.message}`);
      this.handleDisconnect();
    });

    return pool;
  }

  private async ensuredConnected() {
    try {
      await this.client.query(`SELECT 1`);
      this.logger.warn('✅ Database connected Successfully');
    } catch (error) {
      this.logger.error(`❌ Initial Database connection failed, retry`, error);
      void this.handleDisconnect();
    }
  }

  private handleDisconnect() {
    if (this.reconnecting) return; // udah jalan
    this.reconnecting = true;
    this.logger.log('🚨 Database disconnected - starting reconnect watcher...');
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.reconnectInterval = setInterval(async () => {
      this.logger.debug('try database connecting...');
      try {
        const testClient = new Pool({ connectionString: this.env.dbConfig.url });
        await testClient.query(`SELECT 1`);
        this.logger.log('✅ DB is back online! Reinitializing pool...');
        await this.client.end().catch(() => {});
        this.client = this.createPool();
        this._db = drizzle(this.client);
        clearInterval(this.reconnectInterval);
      } catch (err) {
        this.logger.error(err);
      }
    }, 5000);
  }
  async onModuleInit() {
    await this.ensuredConnected();
  }

  get db() {
    return this._db;
  }

  async safeExcute<T>(
    queryFn: (db: ReturnType<typeof drizzle>) => Promise<T>,
    context: string = 'Unkwon query',
  ): Promise<T> {
    try {
      return await queryFn(this._db);
    } catch (error) {
      this.logger.error(`Query failed in ${context}`, error);
      mapPosgresError(error);
    }
  }

  async onModuleDestroy() {
    clearInterval(this.reconnectInterval);
    this.logger.debug('🧹 Closing database connection...');
    await this.client.end();
  }

  async checkHealth() {
    try {
      const start = Date.now();
      await this.client.query(`SELECT 1`);
      const latency = Date.now() - start;
      return {
        status: 'ok',
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
