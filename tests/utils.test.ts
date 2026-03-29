import { describe, it, expect } from 'vitest';
import { parseTimeStr } from '../shared/utils/time';

describe('parseTimeStr', () => {
  it('should handle null correctly', () => {
    expect(parseTimeStr(null)).toBe(24);
  });

  it('should handle empty string', () => {
    expect(parseTimeStr('')).toBe(24);
  });

  it('should parse AM times correctly', () => {
    expect(parseTimeStr('8 AM')).toBe(8);
    expect(parseTimeStr('11 AM')).toBe(11);
    expect(parseTimeStr('1 AM')).toBe(1);
  });

  it('should parse PM times correctly', () => {
    expect(parseTimeStr('1 PM')).toBe(13);
    expect(parseTimeStr('11 PM')).toBe(23);
    expect(parseTimeStr('5 PM')).toBe(17);
  });

  it('should handle 12 AM as midnight (0)', () => {
    expect(parseTimeStr('12 AM')).toBe(0);
  });

  it('should handle 12 PM as noon (12)', () => {
    expect(parseTimeStr('12 PM')).toBe(12);
  });

  it('should cover all hours', () => {
    // AM: 12=0, 1=1, 2=2, ..., 11=11
    expect(parseTimeStr('12 AM')).toBe(0);
    for (let i = 1; i <= 11; i++) {
      expect(parseTimeStr(`${i} AM`)).toBe(i);
    }
    // PM: 12=12, 1=13, 2=14, ..., 11=23
    expect(parseTimeStr('12 PM')).toBe(12);
    for (let i = 1; i <= 11; i++) {
      expect(parseTimeStr(`${i} PM`)).toBe(i + 12);
    }
  });
});
