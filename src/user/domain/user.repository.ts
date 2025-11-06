// modules/user/domain/user.repository.ts
import { User } from './user.entity';

export interface IUserRepository {
  findOneByEmail(email: string): Promise<User | null>;
  findOneByUsename(username: string): Promise<User | null>;
  create(user: User): Promise<User>;
}
