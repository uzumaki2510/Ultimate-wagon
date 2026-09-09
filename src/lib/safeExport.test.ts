import { describe, it, expect } from 'vitest';
import { csvCell, escapeHtml } from './safeExport';
describe('untrusted export values', () => {
  it('neutralizes formulas including leading whitespace', () => {
    expect(csvCell(' =HYPERLINK("bad")')).toBe('"\' =HYPERLINK(""bad"")"');
    expect(csvCell('@SUM(1)')).toBe('"\'@SUM(1)"');
  });
  it('quotes commas, line breaks and quotes', () => {
    expect(csvCell('a,b\n"c"')).toBe('"a,b\n""c"""');
  });
  it('escapes executable report markup', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });
});
