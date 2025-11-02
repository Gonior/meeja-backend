import { DrizzleService, UsersTable } from '@app/drizzle';
import { Injectable } from '@nestjs/common';
import { InferInsertModel } from 'drizzle-orm';

@Injectable()
export class AppService {
  constructor(private readonly orm: DrizzleService) {}
  getHello(): string {
    return 'Hello World!';
  }

  async getUsers() {
    return await this.orm.safeExcute(async (db) => {
      return await db.select().from(UsersTable);
    });
  }

  async create(data: InferInsertModel<typeof UsersTable>) {
    return await this.orm.safeExcute(async (db) => {
      const [user] = await db.insert(UsersTable).values(data).returning();
      return user;
    });
  }
}
