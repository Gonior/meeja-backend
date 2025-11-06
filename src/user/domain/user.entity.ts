import { AvatarResizeStatus } from '@app/common';
import { Email } from './value-object/user-email.vo';
import { Username } from './value-object/username.vo';
import { UsersTable } from '@app/drizzle';
export class User {
  constructor(
    private readonly prop: {
      displayName: string;
      passwordHash: string;
      email: Email;
      username: Username;
      id?: number;
      avatarKey?: string | null;
      avatarResizeStatus?: AvatarResizeStatus;
    },
  ) {}

  getEmail() {
    return this.prop.email.value;
  }

  getUsername() {
    return this.prop.username.value;
  }

  getPasswordHash() {
    return this.prop.passwordHash;
  }

  getAvatarKey() {
    return this.prop.avatarKey;
  }

  getAvatarResizeStatus() {
    return this.prop.avatarResizeStatus;
  }

  getId() {
    if (!this.prop.id) throw new Error('User not persitented');

    return this.prop.id;
  }

  toPersistent(): typeof UsersTable.$inferInsert {
    return {
      displayName: this.prop.displayName,
      email: this.prop.email.value,
      password: this.prop.passwordHash,
      username: this.prop.username.value,
      avatarKey: this.prop.avatarKey,
      avatarResizeStatus: this.prop.avatarResizeStatus ?? 'none',
    };
  }
}
