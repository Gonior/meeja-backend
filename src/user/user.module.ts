import { Module } from '@nestjs/common';

import { DrizzleModule } from '@app/drizzle';
import { UserRepositoryImpl } from './infrastructure/user.repository.impl';
import { GetUserByEmailHandler, GetUserByUsernameHandler } from './application';
import { CqrsModule } from '@nestjs/cqrs';
import { I_USER_REPOSITORY } from '@app/common';

@Module({
  imports: [DrizzleModule, CqrsModule],
  providers: [
    UserRepositoryImpl,
    GetUserByEmailHandler,
    GetUserByUsernameHandler,
    { provide: I_USER_REPOSITORY, useClass: UserRepositoryImpl },
  ],
  exports: [I_USER_REPOSITORY, GetUserByEmailHandler, GetUserByUsernameHandler],
})
export class UserModule {}
