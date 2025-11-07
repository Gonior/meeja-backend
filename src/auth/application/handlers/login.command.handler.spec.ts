import { Test, TestingModule } from '@nestjs/testing';
import { LoginCommandHandler } from './login.command.handler';
import { QueryBus } from '@nestjs/cqrs';
import { TokenService } from 'src/auth/domain/services/token.service';
import { LoginCommand } from '../commands/login.command';
import { Email, User, Username, UserProfile } from 'src/user/domain';
import { UnauthorizedException } from '@nestjs/common';
import { GetUserByEmailQuery, GetUserByUsernameQuery } from 'src/user/application';
import { PasswordUtil } from '@app/common';
import { Token } from 'src/auth/domain/token.entity';
import { TokenJwtService } from 'src/auth/domain/services/token-jwt.service';
jest.mock('@app/common', () => ({
  ...jest.requireActual('@app/common'),
  PasswordUtil: {
    verify: jest.fn((hash: string, password: string) => {
      if (hash === 'hashed-password' && password === 'correct') return Promise.resolve(true);
      return Promise.resolve(false);
    }),
  },
}));
describe('LoginHandler', () => {
  let handler: LoginCommandHandler;
  let queryBus: jest.Mocked<QueryBus>;
  let cts: jest.Mocked<TokenJwtService>;
  let tokenService: jest.Mocked<TokenService>;

  const mockValue = new User({
    displayName: '',
    username: new Username('rek.nom'),
    email: new Email('test@mail.com'),
    passwordHash: 'hashed-password',
    id: 1,
    createdAt: new Date(),
    profile: new UserProfile(),
    updatedAt: new Date(),
  });
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginCommandHandler,
        { provide: QueryBus, useValue: { execute: jest.fn() } },
        { provide: TokenJwtService, useValue: { createToken: jest.fn() } },
        { provide: TokenService, useValue: { save: jest.fn() } },
      ],
    }).compile();

    handler = module.get(LoginCommandHandler);
    queryBus = module.get(QueryBus);
    cts = module.get(TokenJwtService);
    tokenService = module.get(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should thrown invalid credential [using email]', async () => {
    queryBus.execute.mockResolvedValueOnce(null);
    const dto = {
      identifier: 'aaaa@.',
      password: 'password',
    };

    await expect(handler.execute(new LoginCommand(dto))).rejects.toThrow(UnauthorizedException);
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    expect(queryBus.execute).toHaveBeenCalledWith(new GetUserByEmailQuery(dto.identifier));
  });
  it('should thrown invalid credential [using username]', async () => {
    queryBus.execute.mockResolvedValueOnce(null);
    const dto = {
      identifier: 'aaaaaa',
      password: 'password',
    };

    await expect(handler.execute(new LoginCommand(dto))).rejects.toThrow(UnauthorizedException);
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    expect(queryBus.execute).toHaveBeenCalledWith(new GetUserByUsernameQuery(dto.identifier));
  });

  it('should thrown invalid credential [false password]', async () => {
    queryBus.execute.mockResolvedValueOnce(mockValue);
    const dto = {
      identifier: 'aaaaaa',
      password: 'password',
    };

    await expect(handler.execute(new LoginCommand(dto))).rejects.toThrow(UnauthorizedException);
    expect(PasswordUtil.verify).toHaveBeenCalledWith(mockValue.passwordHash, dto.password);
  });

  it('should create token with correct username', async () => {
    queryBus.execute.mockResolvedValueOnce(mockValue);

    cts.createToken.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      sessionId: 'sessionId',
      accessTokenJti: 'acc-jti',
      refreshTokenJti: 'ref-jti',
    });
    const dto = {
      identifier: 'aaaaaa',
      password: 'correct',
    };
    const result = await handler.execute(new LoginCommand(dto));

    // pastikan manggil query username
    expect(queryBus.execute).toHaveBeenCalledWith(new GetUserByUsernameQuery(dto.identifier));
    // pastikan password utils di panggil
    expect(PasswordUtil.verify).toHaveBeenCalledWith(mockValue.passwordHash, dto.password);
    // pastikan create token dipanggil
    expect(cts.createToken).toHaveBeenCalledWith(mockValue.id, mockValue.email);
    // pastikan save token service dipanggil
    expect(tokenService.save).toHaveBeenCalledWith(expect.any(Token), 'acc-jti');
    // pastikan mengembalikan token
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
  it('should create token with correct email', async () => {
    queryBus.execute.mockResolvedValueOnce(mockValue);

    cts.createToken.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      sessionId: 'sessionId',
      accessTokenJti: 'acc-jti',
      refreshTokenJti: 'ref-jti',
    });
    const dto = {
      identifier: 'test@mail.com',
      password: 'correct',
    };
    const result = await handler.execute(new LoginCommand(dto));

    // pastikan manggil query email
    expect(queryBus.execute).toHaveBeenCalledWith(new GetUserByEmailQuery(dto.identifier));
    // pastikan password utils di panggil
    expect(PasswordUtil.verify).toHaveBeenCalledWith(mockValue.passwordHash, dto.password);
    // pastikan create token dipanggil
    expect(cts.createToken).toHaveBeenCalledWith(mockValue.id, mockValue.email);
    // pastikan save token service dipanggil
    expect(tokenService.save).toHaveBeenCalledWith(expect.any(Token), 'acc-jti');
    // pastikan mengembalikan token
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
});
