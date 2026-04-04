import { describe, it, expect } from 'vitest';
import { validate } from '../../src/validators/validator';
import { EnvSchema } from '../../src/core/types';

const schema: EnvSchema = {
  DB_URL: { type: 'url', required: true },
  PORT: { type: 'port', required: false, default: '3000' },
  ENV: { type: 'enum', enum: ['dev', 'prod'], required: true },
  DEBUG: { type: 'boolean' },
  EMAIL: { type: 'email', required: true },
  RETRIES: { type: 'number', min: 1, max: 10 },
  API_KEY: { type: 'string', pattern: '^sk-' },
};

describe('validate', () => {
  it('should pass with all valid vars', () => {
    const result = validate(
      {
        DB_URL: 'https://db.example.com',
        PORT: '3000',
        ENV: 'prod',
        DEBUG: 'true',
        EMAIL: 'a@b.com',
        RETRIES: '3',
        API_KEY: 'sk-abc',
      },
      schema,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail on missing required vars', () => {
    const result = validate({}, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.variable === 'DB_URL')).toBe(true);
    expect(result.errors.some((e) => e.variable === 'ENV')).toBe(true);
    expect(result.errors.some((e) => e.variable === 'EMAIL')).toBe(true);
  });

  it('should fail on invalid URL', () => {
    const result = validate({ DB_URL: 'not-a-url', ENV: 'prod', EMAIL: 'a@b.com' }, schema);
    expect(result.errors.some((e) => e.variable === 'DB_URL' && e.message.includes('URL'))).toBe(
      true,
    );
  });

  it('should fail on invalid port', () => {
    const result = validate(
      { DB_URL: 'https://x.com', PORT: '99999', ENV: 'prod', EMAIL: 'a@b.com' },
      schema,
    );
    expect(result.errors.some((e) => e.variable === 'PORT')).toBe(true);
  });

  it('should fail on invalid enum value', () => {
    const result = validate({ DB_URL: 'https://x.com', ENV: 'staging', EMAIL: 'a@b.com' }, schema);
    expect(result.errors.some((e) => e.variable === 'ENV' && e.message.includes('one of'))).toBe(
      true,
    );
  });

  it('should fail on invalid boolean', () => {
    const result = validate(
      { DB_URL: 'https://x.com', ENV: 'prod', DEBUG: 'maybe', EMAIL: 'a@b.com' },
      schema,
    );
    expect(result.errors.some((e) => e.variable === 'DEBUG')).toBe(true);
  });

  it('should fail on invalid email', () => {
    const result = validate({ DB_URL: 'https://x.com', ENV: 'prod', EMAIL: 'notanemail' }, schema);
    expect(result.errors.some((e) => e.variable === 'EMAIL')).toBe(true);
  });

  it('should fail on number below min', () => {
    const result = validate(
      { DB_URL: 'https://x.com', ENV: 'prod', EMAIL: 'a@b.com', RETRIES: '0' },
      schema,
    );
    expect(result.errors.some((e) => e.variable === 'RETRIES' && e.message.includes('below'))).toBe(
      true,
    );
  });

  it('should fail on number above max', () => {
    const result = validate(
      { DB_URL: 'https://x.com', ENV: 'prod', EMAIL: 'a@b.com', RETRIES: '99' },
      schema,
    );
    expect(
      result.errors.some((e) => e.variable === 'RETRIES' && e.message.includes('exceeds')),
    ).toBe(true);
  });

  it('should fail on pattern mismatch', () => {
    const result = validate(
      { DB_URL: 'https://x.com', ENV: 'prod', EMAIL: 'a@b.com', API_KEY: 'wrong-prefix' },
      schema,
    );
    expect(
      result.errors.some((e) => e.variable === 'API_KEY' && e.message.includes('pattern')),
    ).toBe(true);
  });

  it('should warn about unknown variables', () => {
    const result = validate(
      { DB_URL: 'https://x.com', ENV: 'prod', EMAIL: 'a@b.com', UNKNOWN: 'val' },
      schema,
    );
    expect(result.warnings.some((w) => w.variable === 'UNKNOWN')).toBe(true);
  });

  it('should report variable counts', () => {
    const result = validate({ DB_URL: 'https://x.com', ENV: 'prod', EMAIL: 'a@b.com' }, schema);
    expect(result.variables.total).toBe(7);
    expect(result.variables.present).toBe(3);
  });
});
