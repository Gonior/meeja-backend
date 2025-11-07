import argon2 from 'argon2';
import { PasswordUtil } from './password.helper';

jest.mock('argon2');

describe('PasswordUtil', () => {
  it('should call argon2.verify with correct args', async () => {
    const mockVerify = jest.fn().mockResolvedValue(true);
    (argon2.verify as jest.Mock) = mockVerify;

    const hash = 'hashed_pass';
    const password = 'plain_pass';

    const result = await PasswordUtil.verify(hash, password);

    expect(mockVerify).toHaveBeenCalledWith(hash, password);
    expect(result).toBe(true);
  });
});
