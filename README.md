# Env Config Validator

[![CI](https://github.com/mustafaautomation/env-config-validator/actions/workflows/ci.yml/badge.svg)](https://github.com/mustafaautomation/env-config-validator/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

Validate `.env` files against JSON schemas before deployment. Catches missing variables, type errors, invalid URLs, wrong ports, and enum mismatches. No more "it works on my machine."

---

## Validation Types

| Type | Validates |
|------|----------|
| `string` | Any string (+ optional regex pattern) |
| `number` | Numeric value (+ optional min/max) |
| `boolean` | true/false/1/0/yes/no |
| `url` | Valid URL (parsed by `new URL()`) |
| `email` | Basic email format |
| `port` | Integer 1-65535 |
| `enum` | One of allowed values |

---

## Quick Start

```bash
# CLI
npx envcheck validate .env schema.json

# Library
import { parseEnvContent, validate } from 'env-config-validator';

const vars = parseEnvContent(fs.readFileSync('.env', 'utf-8'));
const result = validate(vars, schema);
// result.valid, result.errors, result.warnings
```

---

## Schema Format

```json
{
  "DATABASE_URL": { "type": "url", "required": true },
  "PORT": { "type": "port", "default": "3000" },
  "NODE_ENV": { "type": "enum", "enum": ["dev", "staging", "prod"] },
  "API_KEY": { "type": "string", "pattern": "^sk-[a-z0-9]{32}$" },
  "MAX_RETRIES": { "type": "number", "min": 1, "max": 10 }
}
```

---

## CI Integration

```yaml
- name: Validate env config
  run: npx envcheck validate .env.production env-schema.json
```

Exits with code 1 if validation fails — blocks deployment.

---

## Project Structure

```
env-config-validator/
├── src/
│   ├── core/
│   │   ├── types.ts          # Schema, validation result types
│   │   └── parser.ts         # .env file parser
│   ├── validators/
│   │   └── validator.ts      # Type/pattern/range validation
│   ├── cli.ts
│   └── index.ts
├── tests/unit/
│   ├── parser.test.ts        # 8 tests — comments, quotes, edge cases
│   └── validator.test.ts     # 12 tests — all types, ranges, patterns
├── examples/
│   ├── schema.json
│   └── .env.example
└── .github/workflows/ci.yml
```

---

## License

MIT

---

Built by [Quvantic](https://quvantic.com)
