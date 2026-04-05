import { describe, it, expect } from 'vitest';
import { validate } from '../../src/validators/validator';
import { EnvSchema } from '../../src/core/types';

describe('validate — all 7 type validations', () => {
  describe('string type', () => {
    const schema: EnvSchema = { APP_NAME: { type: 'string' } };

    it('should accept any non-empty string', () => {
      const result = validate({ APP_NAME: 'my-app' }, schema);
      expect(result.valid).toBe(true);
    });

    it('should fail when required string is missing', () => {
      const result = validate({}, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].variable).toBe('APP_NAME');
    });
  });

  describe('number type', () => {
    const schema: EnvSchema = { TIMEOUT: { type: 'number' } };

    it('should accept valid integers', () => {
      expect(validate({ TIMEOUT: '30' }, schema).valid).toBe(true);
    });

    it('should accept valid floats', () => {
      expect(validate({ TIMEOUT: '3.14' }, schema).valid).toBe(true);
    });

    it('should accept negative numbers', () => {
      expect(validate({ TIMEOUT: '-1' }, schema).valid).toBe(true);
    });

    it('should reject non-numeric strings', () => {
      const result = validate({ TIMEOUT: 'abc' }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('number');
    });
  });

  describe('boolean type', () => {
    const schema: EnvSchema = { DEBUG: { type: 'boolean' } };

    it.each(['true', 'false', '1', '0', 'yes', 'no', 'TRUE', 'FALSE', 'Yes', 'No'])(
      'should accept "%s"',
      (value) => {
        expect(validate({ DEBUG: value }, schema).valid).toBe(true);
      },
    );

    it('should reject non-boolean strings', () => {
      expect(validate({ DEBUG: 'maybe' }, schema).valid).toBe(false);
    });
  });

  describe('url type', () => {
    const schema: EnvSchema = { API_URL: { type: 'url' } };

    it('should accept valid HTTP URL', () => {
      expect(validate({ API_URL: 'https://api.example.com' }, schema).valid).toBe(true);
    });

    it('should accept URL with path and query', () => {
      expect(validate({ API_URL: 'https://api.example.com/v2?key=abc' }, schema).valid).toBe(true);
    });

    it('should accept localhost URL', () => {
      expect(validate({ API_URL: 'http://localhost:3000' }, schema).valid).toBe(true);
    });

    it('should reject invalid URL', () => {
      expect(validate({ API_URL: 'not-a-url' }, schema).valid).toBe(false);
    });
  });

  describe('email type', () => {
    const schema: EnvSchema = { ADMIN_EMAIL: { type: 'email' } };

    it('should accept valid email', () => {
      expect(validate({ ADMIN_EMAIL: 'admin@example.com' }, schema).valid).toBe(true);
    });

    it('should accept email with subdomain', () => {
      expect(validate({ ADMIN_EMAIL: 'user@mail.company.co.uk' }, schema).valid).toBe(true);
    });

    it('should reject email without @', () => {
      expect(validate({ ADMIN_EMAIL: 'invalid-email' }, schema).valid).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(validate({ ADMIN_EMAIL: 'user@' }, schema).valid).toBe(false);
    });
  });

  describe('port type', () => {
    const schema: EnvSchema = { PORT: { type: 'port' } };

    it('should accept valid port 3000', () => {
      expect(validate({ PORT: '3000' }, schema).valid).toBe(true);
    });

    it('should accept port 1 (minimum)', () => {
      expect(validate({ PORT: '1' }, schema).valid).toBe(true);
    });

    it('should accept port 65535 (maximum)', () => {
      expect(validate({ PORT: '65535' }, schema).valid).toBe(true);
    });

    it('should reject port 0', () => {
      expect(validate({ PORT: '0' }, schema).valid).toBe(false);
    });

    it('should reject port above 65535', () => {
      expect(validate({ PORT: '99999' }, schema).valid).toBe(false);
    });

    it('should reject non-integer port', () => {
      expect(validate({ PORT: '3000.5' }, schema).valid).toBe(false);
    });
  });

  describe('enum type', () => {
    const schema: EnvSchema = {
      NODE_ENV: { type: 'enum', enum: ['development', 'staging', 'production'] },
    };

    it('should accept valid enum value', () => {
      expect(validate({ NODE_ENV: 'production' }, schema).valid).toBe(true);
    });

    it('should reject invalid enum value', () => {
      const result = validate({ NODE_ENV: 'test' }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('one of');
    });
  });
});

describe('validate — range validation', () => {
  it('should enforce min for numbers', () => {
    const schema: EnvSchema = { WORKERS: { type: 'number', min: 1 } };
    expect(validate({ WORKERS: '0' }, schema).valid).toBe(false);
    expect(validate({ WORKERS: '1' }, schema).valid).toBe(true);
  });

  it('should enforce max for numbers', () => {
    const schema: EnvSchema = { WORKERS: { type: 'number', max: 16 } };
    expect(validate({ WORKERS: '20' }, schema).valid).toBe(false);
    expect(validate({ WORKERS: '16' }, schema).valid).toBe(true);
  });

  it('should enforce min and max for ports', () => {
    const schema: EnvSchema = { PORT: { type: 'port', min: 3000, max: 9000 } };
    expect(validate({ PORT: '2999' }, schema).valid).toBe(false);
    expect(validate({ PORT: '3000' }, schema).valid).toBe(true);
    expect(validate({ PORT: '9001' }, schema).valid).toBe(false);
  });
});

describe('validate — pattern validation', () => {
  it('should enforce regex pattern', () => {
    const schema: EnvSchema = {
      API_KEY: { type: 'string', pattern: '^[A-Za-z0-9]{32}$' },
    };
    expect(validate({ API_KEY: 'abcdef1234567890abcdef1234567890' }, schema).valid).toBe(true);
    expect(validate({ API_KEY: 'short' }, schema).valid).toBe(false);
  });
});

describe('validate — optional and defaults', () => {
  it('should not error on optional missing variable', () => {
    const schema: EnvSchema = {
      LOG_LEVEL: { type: 'string', required: false, default: 'info' },
    };
    const result = validate({}, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should warn on optional missing without default', () => {
    const schema: EnvSchema = {
      FEATURE_FLAG: { type: 'boolean', required: false },
    };
    const result = validate({}, schema);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(1);
  });
});

describe('validate — unrecognized variables', () => {
  it('should warn about variables not in schema', () => {
    const schema: EnvSchema = { APP_NAME: { type: 'string' } };
    const result = validate({ APP_NAME: 'app', UNKNOWN_VAR: 'x' }, schema);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.variable === 'UNKNOWN_VAR')).toBe(true);
  });
});

describe('validate — real-world schema', () => {
  const productionSchema: EnvSchema = {
    NODE_ENV: { type: 'enum', enum: ['development', 'staging', 'production'] },
    PORT: { type: 'port', min: 1024, max: 65535 },
    DATABASE_URL: { type: 'url' },
    REDIS_URL: { type: 'url', required: false },
    JWT_SECRET: { type: 'string', pattern: '^.{32,}$' },
    ADMIN_EMAIL: { type: 'email' },
    LOG_LEVEL: {
      type: 'enum',
      enum: ['error', 'warn', 'info', 'debug'],
      required: false,
      default: 'info',
    },
    MAX_WORKERS: { type: 'number', min: 1, max: 16 },
    DEBUG: { type: 'boolean', required: false, default: 'false' },
  };

  it('should pass with valid production config', () => {
    const vars = {
      NODE_ENV: 'production',
      PORT: '8080',
      DATABASE_URL: 'postgresql://localhost:5432/mydb',
      JWT_SECRET: 'a-very-long-secret-that-is-at-least-32-chars',
      ADMIN_EMAIL: 'admin@company.com',
      MAX_WORKERS: '4',
    };
    const result = validate(vars, productionSchema);
    expect(result.valid).toBe(true);
    expect(result.variables.present).toBe(6);
  });

  it('should fail with multiple issues', () => {
    const vars = {
      NODE_ENV: 'test', // invalid enum
      PORT: '80', // below min
      DATABASE_URL: 'not-a-url', // invalid URL
      JWT_SECRET: 'short', // too short for pattern
      ADMIN_EMAIL: 'bad-email', // invalid email
      MAX_WORKERS: 'abc', // not a number
    };
    const result = validate(vars, productionSchema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(5);
  });

  it('should report correct variable counts', () => {
    const result = validate({}, productionSchema);
    expect(result.variables.total).toBe(9);
    expect(result.variables.missing).toBe(6); // 6 required vars missing
  });
});
