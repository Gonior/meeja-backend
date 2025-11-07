import argon2 from 'argon2';

export class PasswordUtil {
  static async hash(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  static async verify(hash: string, password: string): Promise<boolean> {
    return await argon2.verify(hash, password);
  }
}
