import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LogoutCommand } from '../commands/logout.command';
import { TokenService } from 'src/auth/domain/services/token.service';

@CommandHandler(LogoutCommand)
export class LogoutCommandHandler implements ICommandHandler<LogoutCommand> {
  constructor(private readonly tokenService: TokenService) {}
  async execute(command: LogoutCommand): Promise<boolean> {
    const { token } = command.dto;
    let isRevoked = false;
    isRevoked = await this.tokenService.logout(token);
    return isRevoked;
  }
}
