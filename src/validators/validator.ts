import { EnvSchema, VarSchema, ValidationError, ValidationResult } from '../core/types';

export function validate(vars: Record<string, string>, schema: EnvSchema): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  let present = 0;
  let missing = 0;
  let invalid = 0;

  for (const [key, spec] of Object.entries(schema)) {
    const value = vars[key];

    // Check required
    if (value === undefined || value === '') {
      if (spec.required !== false) {
        errors.push({
          variable: key,
          message: `Required variable "${key}" is missing`,
          severity: 'error',
          expected: spec.type,
        });
        missing++;
      } else if (spec.default === undefined) {
        warnings.push({
          variable: key,
          message: `Optional variable "${key}" is not set and has no default`,
          severity: 'warning',
        });
      }
      continue;
    }

    present++;

    // Type validation
    const typeError = validateType(key, value, spec);
    if (typeError) {
      errors.push(typeError);
      invalid++;
      continue;
    }

    // Pattern validation
    if (spec.pattern) {
      const regex = new RegExp(spec.pattern);
      if (!regex.test(value)) {
        errors.push({
          variable: key,
          message: `"${key}" does not match pattern /${spec.pattern}/`,
          severity: 'error',
          expected: spec.pattern,
          actual: value,
        });
        invalid++;
      }
    }

    // Range validation for numbers
    if (spec.type === 'number' || spec.type === 'port') {
      const num = Number(value);
      if (spec.min !== undefined && num < spec.min) {
        errors.push({
          variable: key,
          message: `"${key}" value ${num} is below minimum ${spec.min}`,
          severity: 'error',
        });
        invalid++;
      }
      if (spec.max !== undefined && num > spec.max) {
        errors.push({
          variable: key,
          message: `"${key}" value ${num} exceeds maximum ${spec.max}`,
          severity: 'error',
        });
        invalid++;
      }
    }
  }

  // Warn about unrecognized variables
  for (const key of Object.keys(vars)) {
    if (!schema[key]) {
      warnings.push({
        variable: key,
        message: `Variable "${key}" is not defined in schema`,
        severity: 'warning',
        actual: vars[key],
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    variables: {
      total: Object.keys(schema).length,
      present,
      missing,
      invalid,
    },
  };
}

function validateType(key: string, value: string, spec: VarSchema): ValidationError | null {
  switch (spec.type) {
    case 'number':
      if (isNaN(Number(value))) {
        return {
          variable: key,
          message: `"${key}" must be a number`,
          severity: 'error',
          expected: 'number',
          actual: value,
        };
      }
      break;
    case 'boolean':
      if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())) {
        return {
          variable: key,
          message: `"${key}" must be a boolean`,
          severity: 'error',
          expected: 'true|false',
          actual: value,
        };
      }
      break;
    case 'url':
      try {
        new URL(value);
      } catch {
        return {
          variable: key,
          message: `"${key}" must be a valid URL`,
          severity: 'error',
          expected: 'URL',
          actual: value,
        };
      }
      break;
    case 'email':
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        return {
          variable: key,
          message: `"${key}" must be a valid email`,
          severity: 'error',
          expected: 'email',
          actual: value,
        };
      }
      break;
    case 'port': {
      const port = Number(value);
      if (isNaN(port) || port < 1 || port > 65535 || !Number.isInteger(port)) {
        return {
          variable: key,
          message: `"${key}" must be a valid port (1-65535)`,
          severity: 'error',
          expected: '1-65535',
          actual: value,
        };
      }
      break;
    }
    case 'enum':
      if (spec.enum && !spec.enum.includes(value)) {
        return {
          variable: key,
          message: `"${key}" must be one of: ${spec.enum.join(', ')}`,
          severity: 'error',
          expected: spec.enum.join('|'),
          actual: value,
        };
      }
      break;
  }
  return null;
}
