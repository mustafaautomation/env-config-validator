#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import { parseEnvContent } from './core/parser';
import { validate } from './validators/validator';
import { EnvSchema } from './core/types';

const R = '\x1b[0m',
  B = '\x1b[1m',
  RED = '\x1b[31m',
  GRN = '\x1b[32m',
  YEL = '\x1b[33m',
  CYN = '\x1b[36m';

const program = new Command();
program.name('envcheck').description('Validate .env files against schemas').version('1.0.0');

program
  .command('validate')
  .description('Validate an .env file against a schema')
  .argument('<envFile>', '.env file to validate')
  .argument('<schemaFile>', 'JSON schema file')
  .option('--json', 'Output as JSON')
  .action((envFile: string, schemaFile: string, options) => {
    if (!fs.existsSync(envFile)) {
      console.error(`File not found: ${envFile}`);
      process.exit(1);
    }
    if (!fs.existsSync(schemaFile)) {
      console.error(`Schema not found: ${schemaFile}`);
      process.exit(1);
    }

    const envContent = fs.readFileSync(envFile, 'utf-8');
    const schema: EnvSchema = JSON.parse(fs.readFileSync(schemaFile, 'utf-8'));
    const vars = parseEnvContent(envContent);
    const result = validate(vars, schema);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log();
      console.log(`${B}${CYN}Environment Config Validation${R}`);
      console.log();
      const icon = result.valid ? `${GRN}PASSED` : `${RED}FAILED`;
      console.log(`  ${B}Status:${R} ${icon}${R}`);
      console.log(
        `  Variables: ${result.variables.present}/${result.variables.total} present, ${result.variables.missing} missing, ${result.variables.invalid} invalid`,
      );
      console.log();

      for (const err of result.errors) {
        console.log(`  ${RED}✗ ${err.variable}:${R} ${err.message}`);
      }
      for (const warn of result.warnings) {
        console.log(`  ${YEL}⚠ ${warn.variable}:${R} ${warn.message}`);
      }
      console.log();
    }

    if (!result.valid) process.exit(1);
  });

program.parse();
