import { describe, it, expect } from 'vitest';
import { parseEnvContent } from '../../src/core/parser';

describe('parseEnvContent', () => {
  it('should parse simple key=value pairs', () => {
    const vars = parseEnvContent('KEY=value\nFOO=bar');
    expect(vars.KEY).toBe('value');
    expect(vars.FOO).toBe('bar');
  });

  it('should skip comments', () => {
    const vars = parseEnvContent('# comment\nKEY=value\n# another');
    expect(Object.keys(vars)).toHaveLength(1);
  });

  it('should skip empty lines', () => {
    const vars = parseEnvContent('\nKEY=value\n\n');
    expect(vars.KEY).toBe('value');
  });

  it('should handle quoted values', () => {
    const vars = parseEnvContent('A="hello world"\nB=\'single quoted\'');
    expect(vars.A).toBe('hello world');
    expect(vars.B).toBe('single quoted');
  });

  it('should strip inline comments for unquoted values', () => {
    const vars = parseEnvContent('KEY=value # comment');
    expect(vars.KEY).toBe('value');
  });

  it('should handle values with equals signs', () => {
    const vars = parseEnvContent('URL=postgres://user:pass@host:5432/db?ssl=true');
    expect(vars.URL).toBe('postgres://user:pass@host:5432/db?ssl=true');
  });

  it('should handle empty values', () => {
    const vars = parseEnvContent('EMPTY=');
    expect(vars.EMPTY).toBe('');
  });

  it('should handle empty content', () => {
    const vars = parseEnvContent('');
    expect(Object.keys(vars)).toHaveLength(0);
  });
});
