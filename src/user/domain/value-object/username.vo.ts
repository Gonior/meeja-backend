export class Username {
  constructor(private readonly data: string) {
    this.validate(data);
  }

  private validate(value: string) {
    if (!/^(?!.*[_.]{2})(?![.])(?!.*[.]$)[a-zA-Z0-9._]{3,30}$/.test(value))
      throw new Error('Username is not valid');
  }

  get value() {
    return this.data;
  }
}
