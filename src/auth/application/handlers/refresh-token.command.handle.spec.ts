import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenCommandHandler } from './refresh-token.command.handler';
import { RefreshTokenCommand } from '../commands/refresh-token.command';
import { TokenService } from 'src/auth/domain/services/token.service';
import { Token } from 'src/auth/domain/token.entity';

jest.mock('src/auth/domain/token.entity'); // mock static class Token

describe('RefreshTokenCommandHandler (Nest TestingModule)', () => {
  let handler: RefreshTokenCommandHandler;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(async () => {
    const tokenServiceMock = {
      refresh: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenCommandHandler,
        { provide: TokenService, useValue: tokenServiceMock },
      ],
    }).compile();

    handler = module.get(RefreshTokenCommandHandler);
    tokenService = module.get(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should refresh and save new token successfully', async () => {
    // Arrange
    const mockCommand = new RefreshTokenCommand({
      token: 'old-refresh-token',
    });

    const mockRefreshResult = {
      userId: 1,
      refreshTokenJti: 'new-jti',
      refreshToken: 'new-refresh-token',
      sessionId: 'session-1',
      accessToken: 'new-access-token',
      accessTokenJti: 'access-jti',
    };

    tokenService.refresh.mockResolvedValue(mockRefreshResult);

    const mockTokenEntity = { id: 1 };
    (Token.create as jest.Mock).mockReturnValue(mockTokenEntity);

    // Act
    const result = await handler.execute(mockCommand);

    // Assert
    // Pastikan refresh dipanggil dengan old-refresh token
    expect(tokenService.refresh).toHaveBeenCalledWith('old-refresh-token');
    // Pastikan Token.create dipanggil
    expect(Token.create).toHaveBeenCalledWith({
      userId: mockRefreshResult.userId,
      jti: mockRefreshResult.refreshTokenJti,
      token: mockRefreshResult.refreshToken,
      ipAddress: mockCommand.dto.ipAddress,
      userAgent: mockCommand.dto.userAgent,
      sessionId: mockRefreshResult.sessionId,
      expiresAt: expect.any(Date),
    });
    // pastikan save() disimpan
    expect(tokenService.save).toHaveBeenCalledWith(
      mockTokenEntity,
      mockRefreshResult.accessTokenJti,
    );

    // pastikan mengembalikan refresh token
    expect(result).toEqual({
      accessToken: mockRefreshResult.accessToken,
      refreshToken: mockRefreshResult.refreshToken,
    });
  });

  it('should throw if tokenService.refresh fails', async () => {
    tokenService.refresh.mockRejectedValue(new Error('Invalid refresh token'));

    const mockCommand = new RefreshTokenCommand({
      token: 'bad-token',
      ipAddress: '127.0.0.1',
      userAgent: 'jest-agent',
    });

    await expect(handler.execute(mockCommand)).rejects.toThrow('Invalid refresh token');
    expect(tokenService.save).not.toHaveBeenCalled();
  });
});
