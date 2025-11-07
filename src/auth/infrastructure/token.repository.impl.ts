import { Injectable } from '@nestjs/common';
import { eq, and, gt, isNull } from 'drizzle-orm';

import { DrizzleService, UserTokensTable } from '@app/drizzle';
import { Token } from '../domain/token.entity';
import { IUserTokensRepository } from '../domain/user.repository';

@Injectable()
export class UserTokensRepositoryImpl implements IUserTokensRepository {
  constructor(private readonly orm: DrizzleService) {}

  // async findAll() {
  //   return this.orm.safeExcute(async (db) => {
  //     return await db.select().from(UserTokensTable);
  //   }, 'UserRepository.findAll');
  // }

  async findUserActiveToken(userId: number): Promise<Token[]> {
    const now = new Date();
    return this.orm.safeExcute(async (db) => {
      const rows = await db
        .select()
        .from(UserTokensTable)
        .where(
          and(
            eq(UserTokensTable.userId, userId),
            isNull(UserTokensTable.revokedAt),
            gt(UserTokensTable.expiresAt, now),
          ),
        );

      if (rows.length > 0) {
        const tokens: Token[] = [];

        for (const row of rows) {
          tokens.push(Token.fromPersistance(row));
        }
        return tokens;
      } else return [];
    }, 'UserTokenRepository.findUserJtiActiveToken');
  }

  async findOneJtiActiveToken(jti: string): Promise<Token | null> {
    const now = new Date();
    return this.orm.safeExcute(async (db) => {
      const [row] = await db
        .select()
        .from(UserTokensTable)
        .where(
          and(
            eq(UserTokensTable.jti, jti),
            isNull(UserTokensTable.revokedAt),
            gt(UserTokensTable.expiresAt, now),
          ),
        );
      if (row) return Token.fromPersistance(row);
      return null;
    }, 'UserTokenRepository.findOneJtiActiveToken');
  }

  async saveToken(token: Token): Promise<Token> {
    return await this.orm.safeExcute(async (db) => {
      const [row] = await db.insert(UserTokensTable).values(token.toPersistance()).returning();

      return Token.fromPersistance(row);
    }, 'UserTokenRepository.SaveToken');
  }

  async revokeToken(token: Token): Promise<boolean> {
    return this.orm.safeExcute(async (db) => {
      const rows = await db
        .update(UserTokensTable)
        .set({ revokedAt: token.props.revokedAt })
        .where(eq(UserTokensTable.jti, token.props.jti))
        .returning();

      return rows.length > 0;
    }, 'UserRepository.revokeToken');
  }
}
