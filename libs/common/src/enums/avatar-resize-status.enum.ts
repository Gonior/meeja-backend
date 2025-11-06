import { avatarResizeStatusEnum } from '@app/drizzle/schemas/user.schema';

export type AvatarResizeStatus = (typeof avatarResizeStatusEnum.enumValues)[number];
