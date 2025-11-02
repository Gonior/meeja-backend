import { text, pgTable, varchar, integer, pgEnum, timestamp } from 'drizzle-orm/pg-core';

export const avatarResizeStatusEnum = pgEnum('avatarResizeStatusEnum', [
  'none',
  'processing',
  'done',
  'failed',
]);

// keterangan
// none : tanpa avatar
// processing : sedang diproses
// done : avatar sudah di-resize
// fail : avatar gagal di resize

const userTable = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().notNull().unique(),
  password: text('password').notNull(),
  avatarKey: text('avatar_key'),
  avatarResizeStatus: avatarResizeStatusEnum('avatar_resize_status').default('none'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export default userTable;
