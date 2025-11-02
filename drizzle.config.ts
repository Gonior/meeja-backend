import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv-flow';
config({ node_env: process.env.NODE_ENV || 'development' });

export default defineConfig({
  schema: 'libs/drizzle/src/schemas/**/*.ts',
  out: 'libs/drizzle/src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DB_URL as string,
  },
  schemaFilter: 'public',
});
