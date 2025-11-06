// modules/user/infrastructure/user.repository.impl.ts
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DrizzleService, UsersTable } from '@app/drizzle';
import { IUserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';
import { Email } from '../domain/value-object/user-email.vo';
import { Username } from '../domain/value-object/username.vo';

@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  constructor(private readonly orm: DrizzleService) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.orm.safeExcute(async (db) => {
      const [user] = await db.select().from(UsersTable).where(eq(UsersTable.email, email)).limit(1);
      if (user) {
        return this.reverseHelper(user);
      }
      return null;
    }, 'UserRepositoryImpl.findOneByEmail');
  }

  async findOneByUsename(username: string): Promise<User | null> {
    return await this.orm.safeExcute(async (db) => {
      const [user] = await db
        .select()
        .from(UsersTable)
        .where(eq(UsersTable.username, username))
        .limit(1);
      if (user) {
        return this.reverseHelper(user);
      }
      return null;
    }, 'UserRepositoryImpl.findOneByUsername');
  }

  async create(user: User): Promise<User> {
    return await this.orm.safeExcute(async (db) => {
      const [row] = await db.insert(UsersTable).values(user.toPersistent()).returning();
      return this.reverseHelper(row);
    }, 'UserRepository.create');
  }

  private reverseHelper(user: typeof UsersTable.$inferSelect): User {
    return new User({
      id: user.id,
      displayName: user.displayName,
      email: new Email(user.email),
      username: new Username(user.username),
      avatarResizeStatus: user.avatarResizeStatus,
      passwordHash: user.password,
      avatarKey: user.avatarKey,
    });
  }
}
