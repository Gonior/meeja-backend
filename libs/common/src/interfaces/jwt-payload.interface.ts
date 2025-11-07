export interface IJwtPayload {
  sub: number;
  email: string;
  jti: string;
  sessionId: string;
}
