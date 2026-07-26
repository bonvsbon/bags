import { describe, it, expect } from 'vitest';
import { baht } from '../src/live/screens.jsx';

describe('baht() formatter', () => {
  it('prefixes ฿ and groups thousands', () => {
    expect(baht(12800)).toBe('฿12,800');
    expect(baht(50000)).toBe('฿50,000');
  });

  it('treats 0 and null/undefined as ฿0', () => {
    expect(baht(0)).toBe('฿0');
    expect(baht(null)).toBe('฿0');
    expect(baht(undefined)).toBe('฿0');
  });

  it('rounds to whole baht', () => {
    expect(baht(12800.4)).toBe('฿12,800');
    expect(baht(853.33)).toBe('฿853');
  });

  it('handles negative amounts', () => {
    expect(baht(-4000)).toBe('฿-4,000');
  });
});
