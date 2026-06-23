const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(private readonly value: string) {}

  static fromString(value: string): Email {
    const trimmed = value.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmed)) {
      throw new Error(`Invalid email address: ${value}`);
    }
    return new Email(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
