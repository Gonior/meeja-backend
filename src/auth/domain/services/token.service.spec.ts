import { Test, TestingModule } from '@nestjs/testing';

import { Token } from '../token.entity';
import { TokenService } from './token.service';
import { RedisService } from '@app/redis';
import { TokenJwtService } from './token-jwt.service';
import { UserTokensRepositoryImpl } from 'src/auth/infrastructure/token.repository.impl';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('../token.entity');

describe('TokenService', () => {
  let service: TokenService;
  let redis: jest.Mocked<RedisService>;
  let jwt: jest.Mocked<TokenJwtService>;
  let repo: jest.Mocked<UserTokensRepositoryImpl>;

  beforeEach(async () => {
    const redisServiceMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const jwtServiceMock = {
      createToken: jest.fn(),
      verify: jest.fn(),
    };

    const repoMock = {
      revokeToken: jest.fn(),
      findOneJtiActiveToken: jest.fn(),
      saveToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: RedisService, useValue: redisServiceMock },
        { provide: TokenJwtService, useValue: jwtServiceMock },
        { provide: UserTokensRepositoryImpl, useValue: repoMock },
      ],
    }).compile();

    service = module.get(TokenService);
    redis = module.get(RedisService);
    jwt = module.get(TokenJwtService);
    repo = module.get(UserTokensRepositoryImpl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should refresh token successfully', async () => {
    // Arrange
    const oldToken = 'old-refresh-token';
    jwt.verify.mockResolvedValue({
      sub: 123,
      jti: 'old-jti',
      email: 'user@test.com',
      sessionId: 'sess-1',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    redis.get.mockResolvedValue('old-jti'); // found in redis
    jwt.createToken.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      refreshTokenJti: 'new-jti',
      sessionId: 'sess-1',
      accessTokenJti: 'access-jti',
    });

    repo.revokeToken.mockResolvedValue(true);

    const mockToken = { revoke: jest.fn(), props: { sessionId: 'sess-1' } };
    (Token.create as jest.Mock).mockReturnValue(mockToken);

    // Act
    const result = await service.refresh(oldToken);

    // Assert
    expect(jwt.verify).toHaveBeenCalledWith(oldToken);
    expect(redis.get).toHaveBeenCalledWith('session:sess-1:refresh');
    expect(mockToken.revoke).toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalledWith('session:sess-1:access');
    expect(redis.del).toHaveBeenCalledWith('session:sess-1:refresh');
    expect(repo.revokeToken).toHaveBeenCalled();
    expect(jwt.createToken).toHaveBeenCalledWith(123, 'user@test.com');
    expect(result).toEqual(
      expect.objectContaining({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        userId: 123,
      }),
    );
  });

  it('should throw UnauthorizedException if redis and db return null', async () => {
    jwt.verify.mockResolvedValue({
      sub: 123,
      jti: 'old-jti',
      sessionId: 'sess-1',
      email: 'user@test.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    redis.get.mockResolvedValue(null);
    repo.findOneJtiActiveToken.mockResolvedValue(null);

    await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    expect(repo.findOneJtiActiveToken).toHaveBeenCalledWith('old-jti');
  });

  it('should logout and revoke session successfully', async () => {
    const fakeJwt = {
      sub: 123,
      jti: 'logout-jti',
      email: 'test@example.com',
      sessionId: 'sess-logout',
      exp: Math.floor(Date.now() / 1000) + 1000,
    };
    jwt.verify.mockResolvedValue(fakeJwt);

    const mockToken = { revoke: jest.fn(), props: { sessionId: 'sess-logout' } };
    (Token.create as jest.Mock).mockReturnValue(mockToken);

    redis.del.mockResolvedValue();
    repo.revokeToken.mockResolvedValue(true);

    const result = await service.logout('fake-token');
    expect(result).toBe(true);
    expect(mockToken.revoke).toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalledTimes(2);
  });

  it('should return false if jwt.verify throws', async () => {
    jwt.verify.mockRejectedValue(new Error('Invalid token'));

    const result = await service.logout('bad-token');
    expect(result).toBe(false);
  });
});
