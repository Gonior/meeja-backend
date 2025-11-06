import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { ConflictException, Inject, Logger } from '@nestjs/common';

import { I_USER_REPOSITORY, PasswordUtil } from '@app/common';
import { CreateUserCommand } from '../commands/create-user.command';
import { User, Email, Username, type IUserRepository } from 'src/user/domain';
import { GetUserByUsernameQuery, GetUserByEmailQuery } from 'src/user/application';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  private readonly logger = new Logger(CreateUserHandler.name);
  constructor(
    private readonly queryBus: QueryBus,
    @Inject(I_USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}
  async execute(command: CreateUserCommand): Promise<void> {
    const { email, password, displayName, username } = command.dto;

    const emailExists = await this.queryBus.execute<GetUserByEmailQuery, User | null>(
      new GetUserByEmailQuery(email),
    );
    if (emailExists) throw new ConflictException('Email already exists');

    const usernameExists = await this.queryBus.execute<GetUserByUsernameQuery, User | null>(
      new GetUserByUsernameQuery(username),
    );
    if (usernameExists) throw new ConflictException('Username already exists');

    const hash = await PasswordUtil.hash(password);
    const user = new User({
      displayName,
      passwordHash: hash,
      email: new Email(email),
      username: new Username(username),
    });

    const persintent = await this.userRepo.create(user);
    this.logger.log(`User created (id ${persintent.getId()})`);
  }
}
