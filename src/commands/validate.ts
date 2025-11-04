import Ajv from 'ajv';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import ora from 'ora';
import path from 'node:path';

interface ValidateOptions {
  schema?: string;
  tokens?: string;
}

export const validateCommand = new Command('validate')
  .description('Validate design tokens against W3C DTCG schema')
  .option('-s, --schema <path>', 'Custom schema file', 'schemas/dtcg.schema.json')
  .option('-t, --tokens <path>', 'Tokens directory or file', 'packages/design-tokens/tokens')
  .action(async (options: ValidateOptions) => {
    const spinner = ora('Validating design tokens...').start();
    
    try {
      const tokensRoot = options.tokens ?? 'packages/design-tokens/tokens';
      const tokensPath = path.resolve(tokensRoot);
      
      // Check if tokens exist
      if (!await fs.pathExists(tokensPath)) {
        spinner.fail(`Tokens not found: ${tokensPath}`);
        process.exit(1);
      }
      
      const ajv = new Ajv({ allErrors: true });
      
      // Basic W3C DTCG schema (simplified)
      const dtcgSchema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "patternProperties": {
          "^[a-zA-Z][a-zA-Z0-9_-]*$": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "$value": true,
                  "$type": { "type": "string" },
                  "$description": { "type": "string" }
                },
                "required": ["$value"]
              },
              {
                "type": "object",
                "patternProperties": {
                  "^[a-zA-Z][a-zA-Z0-9_-]*$": true
                }
              }
            ]
          }
        }
      };
      
      const validate = ajv.compile(dtcgSchema);
      
      let tokenFiles: string[] = [];
      
      if ((await fs.stat(tokensPath)).isDirectory()) {
        const files = await fs.readdir(tokensPath);
        tokenFiles = files
          .filter(file => file.endsWith('.json'))
          .map(file => path.join(tokensPath, file));
      } else {
        tokenFiles = [tokensPath];
      }
      
      let validFiles = 0;
      let invalidFiles = 0;
      
      for (const file of tokenFiles) {
        try {
          const tokens = await fs.readJSON(file);
          const isValid = validate(tokens);
          
          if (isValid) {
            validFiles++;
            console.log(chalk.green(`✅ ${path.relative(process.cwd(), file)}`));
          } else {
            invalidFiles++;
            console.log(chalk.red(`❌ ${path.relative(process.cwd(), file)}`));
            
            if (validate.errors) {
              validate.errors.forEach(error => {
                console.log(chalk.red(`   ${error.instancePath}: ${error.message}`));
              });
            }
          }
        } catch {
          invalidFiles++;
          console.log(chalk.red(`❌ ${path.relative(process.cwd(), file)}: Invalid JSON`));
        }
      }
      
      if (invalidFiles === 0) {
        spinner.succeed(`All ${validFiles} token files are valid!`);
        
        console.log(chalk.cyan('\n📊 Validation Summary:'));
        console.log(`  • Total files: ${tokenFiles.length}`);
        console.log(`  • Valid files: ${validFiles}`);
        console.log(`  • Invalid files: ${invalidFiles}`);
        
      } else {
        spinner.fail(`Validation failed: ${invalidFiles} invalid files`);
        process.exit(1);
      }
      
    } catch (error) {
      spinner.fail('Validation failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });
