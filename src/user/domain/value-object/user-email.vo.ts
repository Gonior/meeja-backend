export class Email {
  constructor(private readonly data: string) {
    this.validate(this.data);
  }

  private validate(value: string) {
    if (!/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(value)) throw new Error('email is not valid');
  }

  get value() {
    return this.data;
  }
}
