import { integer, pgEnum, pgTable, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import userTable from './user.schema';
import workspaceTable from './workspace.schema';

import { sql } from 'drizzle-orm';

export const workspaceRoleEnum = pgEnum('workspace_role', ['owner', 'editor', 'viewer']);
export type WorkspaceRole = (typeof workspaceRoleEnum.enumValues)[number];

const workspaMembersTable = pgTable(
  'workspace_members',
  {
    id: integer('id').primaryKey().notNull().generatedAlwaysAsIdentity(),
    userId: integer('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    role: workspaceRoleEnum('role').notNull().default('viewer'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('workspace_member_unique_idx').on(t.userId, t.workspaceId),
    uniqueIndex('workspace_owner_unique_idx')
      .on(t.workspaceId)
      .where(sql`${t.role} = 'owner`),
  ],
);

export default workspaMembersTable;
