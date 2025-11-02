export interface IEnv {
  APP_NAME: string;
  NODE_ENV: 'development' | 'production' | 'test';

  HOST: string;
  PORT: number;

  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;

  DB_URL: string;
  REDIS_URL: string;

  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_TOKEN_VALUE: string;
  R2_ENDPOINT: string;
  R2_PUBLIC_URL: string;
  LOG_LEVELS: 'debug' | 'info' | 'warn' | 'error';
}
