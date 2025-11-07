import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RefreshTokenCommand } from '../commands/refresh-token.command';
import { TokenResponse, TTL } from '@app/common';
import { TokenService } from 'src/auth/domain/services/token.service';
import { Token } from 'src/auth/domain/token.entity';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(private readonly tokenService: TokenService) {}
  async execute(command: RefreshTokenCommand): Promise<TokenResponse> {
    const { ipAddress, token, userAgent } = command.dto;
    const { userId, refreshTokenJti, refreshToken, sessionId, accessToken, accessTokenJti } =
      await this.tokenService.refresh(token);
    const newToken = Token.create({
      userId,
      jti: refreshTokenJti,
      token: refreshToken,
      ipAddress,
      userAgent,
      sessionId,
      expiresAt: new Date(Date.now() + TTL.MSSCD_REFRESH_TOKEN),
    });
    await this.tokenService.save(newToken, accessTokenJti);
    return { accessToken, refreshToken };
  }
}
