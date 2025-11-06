import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetUserByEmailQuery } from '../queries/get-user-by-email.query';
import { User } from 'src/user/domain';
import { UserRepositoryImpl } from 'src/user/infrastructure/user.repository.impl';

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery> {
  constructor(private readonly repo: UserRepositoryImpl) {}
  async execute(query: GetUserByEmailQuery): Promise<User | null> {
    return await this.repo.findOneByEmail(query.email);
  }
}
