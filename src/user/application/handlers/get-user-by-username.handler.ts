import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetUserByUsernameQuery } from '../queries/get-user-by-username.query';
import { User } from 'src/user/domain';
import { UserRepositoryImpl } from 'src/user/infrastructure/user.repository.impl';

@QueryHandler(GetUserByUsernameQuery)
export class GetUserByUsernameHandler implements IQueryHandler<GetUserByUsernameQuery> {
  constructor(private readonly repo: UserRepositoryImpl) {}
  async execute(query: GetUserByUsernameQuery): Promise<User | null> {
    return await this.repo.findOneByUsename(query.username);
  }
}
