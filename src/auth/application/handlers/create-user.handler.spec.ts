import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { I_USER_REPOSITORY, PasswordUtil } from '@app/common';
import { GetUserByEmailQuery } from '../../../user/application/queries/get-user-by-email.query';
import { User, Email, Username, IUserRepository } from '../../../user/domain';
import { CreateUserHandler } from './create-user.handler';
import { CreateUserCommand } from '../commands/create-user.command';

import { ConflictException, Logger } from '@nestjs/common';
import { GetUserByUsernameQuery } from 'src/user/application';

jest.mock('@app/common', () => ({
  ...jest.requireActual('@app/common'),
  PasswordUtil: {
    hash: jest.fn().mockResolvedValue('hashed_pw'),
  },
}));
jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let userRepo: jest.Mocked<IUserRepository>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockValue = new User({
    displayName: 'nom',
    passwordHash: 'asdasdasd',
    email: new Email('test@mail.com'),
    username: new Username('nommm'),
    id: 1,
  });
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserHandler,
        {
          provide: I_USER_REPOSITORY,
          useValue: {
            create: jest.fn().mockResolvedValue(
              new User({
                id: 1,
                displayName: 'nom',
                passwordHash: 'password',
                email: new Email('testa@mail.com'),
                username: new Username('nommm'),
              }),
            ),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<CreateUserHandler>(CreateUserHandler);
    queryBus = module.get(QueryBus);
    userRepo = module.get(I_USER_REPOSITORY);
  });

  afterEach(() => jest.clearAllMocks());

  it('should throw email already exists (conflict exception)', async () => {
    queryBus.execute.mockResolvedValueOnce(mockValue).mockResolvedValueOnce(null);
    const dto = {
      email: 'test@mail.com',
      displayName: 'nom',
      password: 'password',
      username: 'nom',
    };

    await expect(handler.execute(new CreateUserCommand(dto))).rejects.toThrow(ConflictException);
    expect(queryBus.execute).toHaveBeenCalledWith(new GetUserByEmailQuery(dto.email));
  });

  it('should throw username already exists (conflict exception)', async () => {
    queryBus.execute.mockResolvedValueOnce(null).mockResolvedValueOnce(mockValue);
    const dto = {
      email: 'testa@mail.com',
      displayName: 'nom',
      password: 'password',
      username: 'nommm',
    };
    await expect(handler.execute(new CreateUserCommand(dto))).rejects.toThrow(ConflictException);

    expect(queryBus.execute).toHaveBeenCalledWith(new GetUserByUsernameQuery(dto.username));
  });

  it('should logged "User created"', async () => {
    queryBus.execute.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    const dto = {
      email: 'testa@mail.com',
      displayName: 'nom',
      password: 'password',
      username: 'nommm',
    };
    await handler.execute(new CreateUserCommand(dto));

    expect(queryBus.execute).toHaveBeenCalledTimes(2);
    expect(queryBus.execute).toHaveBeenCalledWith(new GetUserByEmailQuery(dto.email));
    expect(queryBus.execute).toHaveBeenCalledWith(new GetUserByUsernameQuery(dto.username));

    expect(PasswordUtil.hash).toHaveBeenCalledWith('password');

    expect(userRepo.create).toHaveBeenCalledTimes(1);

    expect(userRepo.create).toHaveBeenCalledWith(
      new User({
        displayName: 'nom',
        passwordHash: 'hashed_pw',
        email: new Email('testa@mail.com'),
        username: new Username('nommm'),
      }),
    );

    expect(Logger.prototype.log).toHaveBeenCalledWith(expect.stringContaining('User created'));
  });
});
