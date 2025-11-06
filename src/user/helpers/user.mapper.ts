import { User, Username, Email, UserProfile } from '../domain';
import { UsersTable } from '@app/drizzle';

export class UserMapper {
  static fromPersistence(raw: typeof UsersTable.$inferSelect): User {
    return new User({
      id: raw.id,
      displayName: raw.displayName,
      username: new Username(raw.username),
      email: new Email(raw.email),
      passwordHash: raw.password,
      profile: new UserProfile(raw.bio ?? '', raw.avatarKey, raw.avatarResizeStatus),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(user: User): typeof UsersTable.$inferInsert {
    const primitive = user.toPrimitives();
    return {
      displayName: primitive.displayName,
      email: primitive.email,
      password: primitive.password,
      bio: primitive.bio,
      avatarKey: primitive.avatarKey,
      createdAt: primitive.createdAt,
      updatedAt: primitive.updatedAt,
      username: primitive.username,
    };
  }
}
