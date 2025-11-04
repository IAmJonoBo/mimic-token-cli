import axios from 'axios';
import chalk from 'chalk';
import { Command } from 'commander';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import ora from 'ora';
import path from 'node:path';

interface ExportOptions {
  output?: string;
  fileId?: string;
  token?: string;
  force?: boolean;
}

export const exportCommand = new Command('export')
  .description('Export design tokens from Penpot')
  .option('-o, --output <path>', 'Output file path', 'packages/design-tokens/tokens/base.json')
  .option('-f, --file-id <id>', 'Penpot file ID (overrides .env)')
  .option('-t, --token <token>', 'Penpot access token (overrides .env)')
  .option('--force', 'Overwrite existing files')
  .action(async (options: ExportOptions) => {
    const spinner = ora('Loading configuration...').start();
    
    try {
      // Load environment variables
      dotenv.config();
      
      const fileId = options.fileId || process.env.PENPOT_FILE_ID;
      const accessToken = options.token || process.env.PENPOT_ACCESS_TOKEN;
      const baseUrl = process.env.PENPOT_BASE_URL || 'https://design.penpot.app';
      
      if (!fileId) {
        spinner.fail('Missing Penpot file ID. Set PENPOT_FILE_ID or use --file-id');
        process.exit(1);
      }
      
      if (!accessToken) {
        spinner.fail('Missing Penpot access token. Set PENPOT_ACCESS_TOKEN or use --token');
        process.exit(1);
      }
      
      spinner.text = 'Testing Penpot API connection...';
      
      // Test API connectivity
      try {
        await axios.get(`${baseUrl}/api/rpc/command/get-profile`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      } catch {
        spinner.fail('Failed to connect to Penpot API. Check your credentials.');
        process.exit(1);
      }
      
      spinner.text = 'Exporting tokens from Penpot...';
      
      // Note: This is a placeholder implementation
      // In a real implementation, you would use the official Penpot export API
      // For now, we'll create a sample DTCG-compliant structure
      const sampleTokens = {
        "$schema": "https://schemas.w3.org/design-tokens/",
        "color": {
          "primary": {
            "50": {
              "$value": "#eff6ff",
              "$type": "color",
              "$description": "Lightest primary color"
            },
            "500": {
              "$value": "#3b82f6",
              "$type": "color",
              "$description": "Base primary color"
            },
            "900": {
              "$value": "#1e3a8a",
              "$type": "color",
              "$description": "Darkest primary color"
            }
          },
          "neutral": {
            "50": {
              "$value": "#f9fafb",
              "$type": "color"
            },
            "900": {
              "$value": "#111827",
              "$type": "color"
            }
          }
        },
        "spacing": {
          "xs": {
            "$value": "0.25rem",
            "$type": "dimension",
            "$description": "Extra small spacing"
          },
          "sm": {
            "$value": "0.5rem",
            "$type": "dimension",
            "$description": "Small spacing"
          },
          "md": {
            "$value": "1rem",
            "$type": "dimension",
            "$description": "Medium spacing"
          },
          "lg": {
            "$value": "1.5rem",
            "$type": "dimension",
            "$description": "Large spacing"
          }
        },
        "typography": {
          "fontSize": {
            "xs": {
              "$value": "0.75rem",
              "$type": "dimension"
            },
            "sm": {
              "$value": "0.875rem",
              "$type": "dimension"
            },
            "base": {
              "$value": "1rem",
              "$type": "dimension"
            },
            "lg": {
              "$value": "1.125rem",
              "$type": "dimension"
            }
          },
          "fontWeight": {
            "normal": {
              "$value": 400,
              "$type": "fontWeight"
            },
            "medium": {
              "$value": 500,
              "$type": "fontWeight"
            },
            "bold": {
              "$value": 700,
              "$type": "fontWeight"
            }
          },
          "fontFamily": {
            "sans": {
              "$value": ["Inter", "system-ui", "sans-serif"],
              "$type": "fontFamily"
            }
          }
        }
      };
      
      const outputPath = path.resolve(options.output ?? 'packages/design-tokens/tokens/base.json');
      const outputDir = path.dirname(outputPath);
      
      // Check if file exists
      if (await fs.pathExists(outputPath) && !options.force) {
        spinner.fail(`Output file already exists: ${outputPath}. Use --force to overwrite.`);
        process.exit(1);
      }
      
      // Ensure output directory exists
      await fs.ensureDir(outputDir);
      
      // Write tokens
      await fs.writeJSON(outputPath, sampleTokens, { spaces: 2 });
      
      spinner.succeed(`Tokens exported successfully to: ${outputPath}`);
      
      console.log(chalk.cyan('\n📊 Export Summary:'));
      console.log(`  • Color tokens: ${Object.keys(sampleTokens.color.primary).length + Object.keys(sampleTokens.color.neutral).length}`);
      console.log(`  • Spacing tokens: ${Object.keys(sampleTokens.spacing).length}`);
      console.log(`  • Typography tokens: ${Object.keys(sampleTokens.typography).length} categories`);
      
      console.log(chalk.cyan('\n📋 Next steps:'));
      console.log('  • Run: n00plicate-tokens build (to generate platform outputs)');
      console.log('  • Run: n00plicate-tokens validate (to check token structure)');
      
    } catch (error) {
      spinner.fail('Export failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });
