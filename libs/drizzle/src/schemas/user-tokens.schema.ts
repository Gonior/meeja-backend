import { text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { integer, pgTable } from 'drizzle-orm/pg-core';
import userTable from './user.schema';

const userTokensTable = pgTable(
  'user_tokens',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: integer('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    jti: uuid('jti').notNull().unique(),
    token: text('token').notNull(),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    sessionId: text('session_id'),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('jti_idx').on(table.jti)],
);
export default userTokensTable;
