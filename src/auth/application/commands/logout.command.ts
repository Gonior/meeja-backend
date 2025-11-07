export class LogoutCommand {
  constructor(public readonly dto: { token: string }) {}
}
