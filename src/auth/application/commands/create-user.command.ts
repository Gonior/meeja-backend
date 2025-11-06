export class CreateUserCommand {
  constructor(
    public readonly dto: {
      email: string;
      username: string;
      password: string;
      displayName: string;
    },
  ) {}
}
