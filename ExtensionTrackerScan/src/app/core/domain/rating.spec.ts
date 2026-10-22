import { InvalidRating, Rating } from './rating';

describe('Rating', () => {
  it.each([1, 10])(
    'should accept %d when it is a bound of the scale',
    (value) => {
      expect(Rating.of(value).value).toBe(value);
    },
  );

  it.each([0, 11, 7.5])(
    'should refuse %d when it is not an integer from 1 to 10',
    (value) => {
      expect(() => Rating.of(value)).toThrow(InvalidRating);
    },
  );
});
