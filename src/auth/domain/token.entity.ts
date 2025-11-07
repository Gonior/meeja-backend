import { UserTokensTable } from '@app/drizzle';

export interface TokenProps {
  userId: number;
  jti: string;
  token: string;
  sessionId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  revokedAt?: Date | null;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Token {
  private readonly _id?: number; // optional id auto increment DB
  public readonly props: TokenProps;
  constructor(props: TokenProps, id?: number) {
    this._id = id;
    this.props = {
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
      revokedAt: props.revokedAt ?? null,
    };
  }

  get id() {
    if (!this._id) throw new Error('Token not persistanced');
    return this._id;
  }

  static create(props: TokenProps, id?: number) {
    if (!props.token) throw new Error('Token must be provided');
    if (!props.expiresAt) throw new Error('Token must have expiry');
    if (!props.jti) throw new Error('JTI must be provide');
    if (!props.sessionId) throw new Error('SessionId must be provide');
    if (!props.userId) throw new Error('UserId must be provided');

    return new Token(props, id);
  }
  revoke() {
    this.props.revokedAt = new Date();
    this.props.updatedAt = new Date();
  }

  isValid() {
    return !this.props.revokedAt && this.props.expiresAt > new Date();
  }

  toPersistance(): typeof UserTokensTable.$inferInsert {
    return {
      userId: this.props.userId,
      jti: this.props.jti,
      token: this.props.token,
      sessionId: this.props.sessionId,
      expiresAt: this.props.expiresAt,
      createdAt: this.props.createdAt ?? new Date(),
      updatedAt: this.props.updatedAt ?? new Date(),
      revokedAt: this.props.revokedAt ?? null,
      userAgent: this.props.userAgent ?? null,
      ipAddress: this.props.ipAddress ?? null,
    };
  }

  static fromPersistance(raw: typeof UserTokensTable.$inferSelect): Token {
    return new Token(
      {
        userId: raw.userId,
        jti: raw.jti,
        token: raw.token,
        sessionId: raw.sessionId,
        expiresAt: raw.expiresAt,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        revokedAt: raw.revokedAt,
        userAgent: raw.userAgent,
        ipAddress: raw.ipAddress,
      },
      raw.id,
    );
  }
}
