import {
  pgTable,
  integer,
  text,
  uniqueIndex,
  index,
  customType,
  timestamp,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import userTable from './user.schema';

const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  },
});

const workspaceTable = pgTable(
  'workspaces',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    ownerId: integer('owner_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    name: citext('name').notNull(),
    slug: citext('slug').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('unique_name_per_user').on(table.ownerId, table.name),
    uniqueIndex('unique_slug_per_user').on(table.ownerId, table.slug),
    index('idx_workspaces_owner').on(table.ownerId),
    sql`CHECK (length(name) <= 100)`,
    sql`CHECK (length(slug) <= 100)`,
  ],
);

export default workspaceTable;
