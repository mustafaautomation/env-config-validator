export type VarType = 'string' | 'number' | 'boolean' | 'url' | 'email' | 'port' | 'enum';

export interface VarSchema {
  type: VarType;
  required?: boolean;
  default?: string;
  description?: string;
  enum?: string[];
  pattern?: string;
  min?: number;
  max?: number;
}

export interface EnvSchema {
  [key: string]: VarSchema;
}

export interface ValidationError {
  variable: string;
  message: string;
  severity: 'error' | 'warning';
  expected?: string;
  actual?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  variables: {
    total: number;
    present: number;
    missing: number;
    invalid: number;
  };
}
