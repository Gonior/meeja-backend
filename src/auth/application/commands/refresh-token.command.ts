export class RefreshTokenCommand {
  constructor(
    public readonly dto: {
      token: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ) {}
}
