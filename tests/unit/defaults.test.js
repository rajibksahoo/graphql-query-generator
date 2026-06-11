import { describe, it, expect } from 'vitest';
import { getDefaultValue, typeDefaults } from '../../src/defaults.js';

describe('getDefaultValue', () => {
  it('returns empty string for String', () => {
    expect(getDefaultValue('String')).toBe('');
  });
  it('returns 0 for Int', () => {
    expect(getDefaultValue('Int')).toBe(0);
  });
  it('returns 0.0 for Float', () => {
    expect(getDefaultValue('Float')).toBe(0.0);
  });
  it('returns false for Boolean', () => {
    expect(getDefaultValue('Boolean')).toBe(false);
  });
  it('returns "1" for ID', () => {
    expect(getDefaultValue('ID')).toBe('1');
  });
  it('returns null for unknown scalar', () => {
    expect(getDefaultValue('DateTime')).toBeNull();
  });
});
