import { AvatarResizeStatus } from '@app/common';
export class UserProfile {
  constructor(
    readonly bio: string | null = '',
    readonly avatarKey?: string | null,
    readonly avatarResizeStatus: AvatarResizeStatus = 'none',
  ) {}

  updateBio(newBio: string): UserProfile {
    return new UserProfile(newBio, this.avatarKey, this.avatarResizeStatus);
  }

  updateAvatar(key: string): UserProfile {
    return new UserProfile(this.bio, key, this.avatarResizeStatus);
  }

  updateAvatarResizeStatus(status: AvatarResizeStatus): UserProfile {
    return new UserProfile(this.bio, this.avatarKey, status);
  }
}
