import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';

import { PasswordUtil, TokenResponse, TTL } from '@app/common';
import { LoginCommand } from '../commands/login.command';
import { User } from 'src/user/domain';
import { GetUserByEmailQuery, GetUserByUsernameQuery } from 'src/user/application';
import { TokenService } from 'src/auth/domain/services/token.service';
import { Token } from 'src/auth/domain/token.entity';
import { TokenJwtService } from 'src/auth/domain/services/token-jwt.service';

@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly jwt: TokenJwtService,
    private readonly tokenService: TokenService,
  ) {}
  async execute(command: LoginCommand): Promise<TokenResponse> {
    const { identifier, password, userAgent, ipAddress } = command.dto;
    let user: User | null = null;
    if (identifier.includes('@')) {
      user = await this.queryBus.execute<GetUserByEmailQuery, User | null>(
        new GetUserByEmailQuery(identifier),
      );
    } else {
      user = await this.queryBus.execute<GetUserByUsernameQuery, User | null>(
        new GetUserByUsernameQuery(identifier),
      );
    }

    if (!user) throw new UnauthorizedException('Invalid credential');

    const isVerified = await PasswordUtil.verify(user.passwordHash, password);

    if (!isVerified) throw new UnauthorizedException('Invalid credential');
    const { accessToken, accessTokenJti, refreshToken, refreshTokenJti, sessionId } =
      await this.jwt.createToken(user.id, user.email);

    const token = Token.create({
      userId: user.id,
      jti: refreshTokenJti,
      token: refreshToken,
      ipAddress,
      userAgent,
      sessionId: sessionId,
      expiresAt: new Date(Date.now() + TTL.MSSCD_REFRESH_TOKEN),
    });
    await this.tokenService.save(token, accessTokenJti);
    return { accessToken, refreshToken };
  }
}
