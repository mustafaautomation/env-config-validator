## Real-World Use Cases

### 1. Pre-Deploy Validation
```bash
npx envcheck validate .env.production env-schema.json
# Exit 1 if missing or invalid vars — blocks deploy
```

### 2. CI Pipeline Gate
```yaml
- name: Validate environment
  run: npx envcheck validate .env.staging schema.json
```

### 3. Schema Definition
```json
{
  "DATABASE_URL": { "type": "url", "required": true },
  "PORT": { "type": "port", "default": "3000" },
  "NODE_ENV": { "type": "enum", "enum": ["dev", "staging", "prod"] }
}
```
