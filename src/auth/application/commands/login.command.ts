export class LoginCommand {
  constructor(
    public readonly dto: {
      identifier: string;
      password: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ) {}
}
