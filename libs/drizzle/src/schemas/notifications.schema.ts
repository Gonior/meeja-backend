import {
  pgTable,
  integer,
  text,
  boolean,
  index,
  pgEnum,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import userTable from './user.schema';

export const notificationTypeEnum = pgEnum('notification_type', [
  'INVITE',
  'MESSAGE',
  'COMMENT',
  'MENTION',
  'SYSTEM',
]);

const notificationsTable = pgTable(
  'notifications',
  {
    id: integer('id').primaryKey().notNull().generatedAlwaysAsIdentity(),
    recipientId: integer('recipient_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    actorId: integer('actor_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'set null' }),
    type: notificationTypeEnum('type').notNull(),
    message: text('message').notNull(),
    metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('notifications_receipt_idx').on(t.recipientId),
    index('notifications_read_idx').on(t.isRead),
  ],
);

export default notificationsTable;
