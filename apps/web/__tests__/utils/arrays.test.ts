import { isUnique } from '@/utils/arrays';

// test isUniuqe function
describe('isUnique', () => {
  it('should return true if array is unique', () => {
    expect(isUnique(['1', '2', '3'])).toBe(true);
  });

  it('should return false if array is not unique', () => {
    expect(isUnique(['1', '2', '3', '1'])).toBe(false);
  });
});