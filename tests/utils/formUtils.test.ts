
import { formatUrl, cleanFormData } from '@/utils/formUtils';

describe('formUtils', () => {
  test('formatUrl should add https protocol if missing', () => {
    expect(formatUrl('example.com')).toBe('https://example.com');
    expect(formatUrl('http://example.com')).toBe('http://example.com');
    expect(formatUrl('https://example.com')).toBe('https://example.com');
  });

  test('formatUrl should return null for null or undefined input', () => {
    expect(formatUrl(null)).toBeNull();
    expect(formatUrl(undefined)).toBeNull();
  });

  test('formatUrl should trim whitespace', () => {
    expect(formatUrl('  example.com  ')).toBe('https://example.com');
  });

  test('formatUrl should return null for empty string', () => {
    expect(formatUrl('')).toBeNull();
    expect(formatUrl('   ')).toBeNull();
  });

  test('cleanFormData should convert empty strings to null', () => {
    const input = { a: 'test', b: '', c: '  ', d: null, e: undefined };
    const expected = { a: 'test', b: null, c: null, d: null, e: undefined };
    expect(cleanFormData(input)).toEqual(expected);
  });

  test('cleanFormData should not modify non-empty strings or other data types', () => {
    const input = { a: 'test', b: 123, c: true, d: { nested: 'value' } };
    expect(cleanFormData(input)).toEqual(input);
  });

  test('cleanFormData should handle an object with no string values', () => {
    const input = { a: 123, b: true, c: null, d: undefined };
    expect(cleanFormData(input)).toEqual(input);
  });

  test('cleanFormData should handle an empty object', () => {
    expect(cleanFormData({})).toEqual({});
  });
});
