import { describe, it, expect } from 'vitest';
import { css } from '../src/lib/css.js';

describe('css() declaration parser', () => {
  it('returns undefined for empty/null input', () => {
    expect(css('')).toBeUndefined();
    expect(css(null)).toBeUndefined();
  });

  it('passes objects through unchanged', () => {
    const o = { color: 'red' };
    expect(css(o)).toBe(o);
  });

  it('parses simple declarations', () => {
    expect(css('color:red;font-size:14px')).toEqual({ color: 'red', fontSize: '14px' });
  });

  it('camelCases hyphenated properties', () => {
    expect(css('border-radius:8px')).toEqual({ borderRadius: '8px' });
  });

  it('keeps CSS custom properties verbatim', () => {
    expect(css('--bg:#fff')).toEqual({ '--bg': '#fff' });
  });

  it('handles the -webkit- prefix', () => {
    expect(css('-webkit-box-shadow:none')).toEqual({ WebkitBoxShadow: 'none' });
  });

  it('preserves values that contain colons', () => {
    expect(css('background:url(a:b)').background).toBe('url(a:b)');
  });

  it('ignores empty and malformed segments', () => {
    expect(css('color:red;;bad;')).toEqual({ color: 'red' });
  });

  it('returns the same cached object for identical strings', () => {
    expect(css('x:y')).toBe(css('x:y'));
  });
});
