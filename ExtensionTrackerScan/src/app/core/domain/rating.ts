export class InvalidRating extends Error {
  constructor(value: number) {
    super(`A rating is an integer from 1 to 10, got ${value}`);
  }
}

export class Rating {
  private constructor(readonly value: number) {}

  static of(value: number): Rating {
    if (!Number.isInteger(value) || value < 1 || value > 10) {
      throw new InvalidRating(value);
    }
    return new Rating(value);
  }
}
