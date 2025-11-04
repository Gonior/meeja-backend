// 👇 Mock redis module
const mClient = {
  connect: jest.fn().mockResolvedValue('connected'),
  quit: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue('"mockValue"'),
  del: jest.fn().mockResolvedValue(1),
  isReady: true,
  isOpen: true,
};
jest.mock('redis', () => {
  return {
    createClient: jest.fn(() => mClient),
  };
});
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { EnvService } from '@app/common';
import { createClient } from 'redis';

describe('RedisService', () => {
  let service: RedisService;

  const mockEnvService = {
    redisConfig: { url: 'redis://localhost:6379' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService, { provide: EnvService, useValue: mockEnvService }],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should connect on init', () => {
    service.onModuleInit();
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url: mockEnvService.redisConfig.url,
      }),
    );

    expect(mClient.connect).toHaveBeenCalled();
  });

  it('should set value json value', async () => {
    service.onModuleInit();

    await service.set('key', { test: 'ok' });
    expect(mClient.set).toHaveBeenCalledWith('key', JSON.stringify({ test: 'ok' }), undefined);
  });

  it('should set value plain text', async () => {
    service.onModuleInit();

    await service.set('key', 'looooongstring');
    expect(mClient.set).toHaveBeenCalledWith('key', 'looooongstring', undefined);
  });

  it('should get and parse JSON', async () => {
    service.onModuleInit();
    const result = await service.get('key');

    expect(mClient.get).toHaveBeenCalledWith('key');
    expect(result).toBe('mockValue'); // hasil dari JSON.parse('"mockValue"')
  });

  it('should get plain string', async () => {
    mClient.get = jest.fn().mockResolvedValue('just-a-string');
    service.onModuleInit();
    const result = await service.get('key');

    expect(mClient.get).toHaveBeenCalledWith('key');
    expect(result).toBe('just-a-string'); // hasil dari JSON.parse('"mockValue"')
  });

  it('should get plain string (")', async () => {
    mClient.get = jest.fn().mockResolvedValue('"just-a-string');
    service.onModuleInit();
    const result = await service.get('key');

    expect(mClient.get).toHaveBeenCalledWith('key');
    expect(result).toBe('"just-a-string'); // hasil dari JSON.parse('"mockValue"')
  });

  it('should delete a key', async () => {
    service.onModuleInit();
    await service.del('key');
    expect(mClient.del).toHaveBeenCalledWith('key');
  });

  it('should quit gracefully on destroy', async () => {
    service.onModuleInit();
    (service as any).connected = true;
    await service.onModuleDestroy();
    expect(mClient.quit).toHaveBeenCalled();
  });
});
