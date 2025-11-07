import { Token } from '../domain/token.entity';
export interface IUserTokensRepository {
  findUserActiveToken(user: number): Promise<Token[]>;
  findOneJtiActiveToken(jti: string): Promise<Token | null>;
  saveToken(token: Token): Promise<Token>;
  revokeToken(token: Token): Promise<boolean>;
}
