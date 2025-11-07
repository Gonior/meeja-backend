// modules/user/infrastructure/user.repository.impl.ts
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DrizzleService, UsersTable } from '@app/drizzle';
import { IUserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';


@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  constructor(private readonly orm: DrizzleService) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.orm.safeExcute(async (db) => {
      const [user] = await db.select().from(UsersTable).where(eq(UsersTable.email, email)).limit(1);
      if (user) {
        return User.fromPersistence(user);
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
        return User.fromPersistence(user);
      }
      return null;
    }, 'UserRepositoryImpl.findOneByUsername');
  }

  async create(user: User): Promise<User> {
    return await this.orm.safeExcute(async (db) => {
      const [row] = await db.insert(UsersTable).values(user.toPersistence()).returning();
      return User.fromPersistence(row);
    }, 'UserRepository.create');
  }
}
