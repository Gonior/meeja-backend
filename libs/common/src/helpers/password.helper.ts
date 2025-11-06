import argon2 from 'argon2';

export class PasswordUtil {
  static async hash(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return await argon2.verify(password, hash);
  }
}
