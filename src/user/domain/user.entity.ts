import { Email } from './value-object/user-email.vo';
import { UserProfile } from './value-object/user-profile.vo';
import { Username } from './value-object/username.vo';
import { UsersTable } from '@app/drizzle';
export class User {
  constructor(
    private readonly props: {
      displayName: string;
      passwordHash: string;
      email: Email;
      username: Username;
      id?: number;
      profile: UserProfile;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {}

  get email() {
    return this.props.email.value;
  }

  get username() {
    return this.props.username.value;
  }

  get passwordHash() {
    return this.props.passwordHash;
  }

  get profile() {
    return this.props.profile;
  }

  get id() {
    if (!this.props.id) throw new Error('User not persitenced');
    return this.props.id;
  }

  updateProfile(profile: UserProfile): User {
    return new User({
      ...this.props,
      profile,
      updatedAt: new Date(),
    });
  }

  toPrimitives(): typeof UsersTable.$inferInsert {
    return {
      displayName: this.props.displayName,
      email: this.props.email.value,
      password: this.props.passwordHash,
      username: this.props.username.value,
      avatarKey: this.props.profile.avatarKey,
      avatarResizeStatus: this.props.profile.avatarResizeStatus ?? 'none',
      bio: this.props.profile.bio,
    };
  }

  static create(displayName: string, username: string, email: string, passwordHash: string): User {
    const now = new Date();
    return new User({
      displayName: displayName,
      email: new Email(email),
      username: new Username(username),
      profile: new UserProfile(),
      passwordHash: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  }
}
