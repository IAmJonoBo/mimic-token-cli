import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

export const statusCommand = new Command('status')
  .description('Show status of design token pipeline')
  .action(async () => {
    console.log(chalk.cyan('📊 Mimic Design Token Pipeline Status\n'));
    
    // Load environment
    dotenv.config();
    
    // Check configuration
    console.log(chalk.blue('🔧 Configuration:'));
    const fileId = process.env.PENPOT_FILE_ID;
    const accessToken = process.env.PENPOT_ACCESS_TOKEN;
    const baseUrl = process.env.PENPOT_BASE_URL || 'https://design.penpot.app';
    
    console.log(`  • Penpot URL: ${baseUrl}`);
    console.log(`  • File ID: ${fileId ? chalk.green('✓ Set') : chalk.red('✗ Missing')}`);
    console.log(`  • Access Token: ${accessToken ? chalk.green('✓ Set') : chalk.red('✗ Missing')}`);
    
    // Test Penpot connectivity
    if (fileId && accessToken) {
      const spinner = ora('Testing Penpot connection...').start();
      
      try {
        await axios.get(`${baseUrl}/api/rpc/command/get-profile`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          timeout: 5000,
        });
        spinner.succeed('Penpot connection: OK');
      } catch (error) {
        spinner.fail('Penpot connection: Failed');
        console.log(chalk.red(`    Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    } else {
      console.log(chalk.yellow('  ⚠️ Cannot test connection - missing credentials'));
    }
    
    console.log();
    
    // Check file structure
    console.log(chalk.blue('📁 File Structure:'));
    
    const checkPath = async (filePath: string, label: string) => {
      const exists = await fs.pathExists(filePath);
      console.log(`  • ${label}: ${exists ? chalk.green('✓ Found') : chalk.red('✗ Missing')}`);
      return exists;
    };
    
    await checkPath('packages/design-tokens', 'Design Tokens Package');
    await checkPath('packages/design-tokens/tokens', 'Token Source Files');
    await checkPath('packages/design-tokens/style-dictionary.config.js', 'Style Dictionary Config');
    const libsExist = await checkPath('packages/design-tokens/libs', 'Generated Outputs');
    
    if (libsExist) {
      const platforms = await fs.readdir('packages/design-tokens/libs/tokens').catch(() => []);
      console.log(`    Platforms: ${platforms.join(', ')}`);
    }
    
    console.log();
    
    // Check recent changes
    console.log(chalk.blue('📅 Recent Activity:'));
    
    try {
      const tokensDir = 'packages/design-tokens/tokens';
      if (await fs.pathExists(tokensDir)) {
        const files = await fs.readdir(tokensDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        for (const file of jsonFiles.slice(0, 3)) {
          const filePath = path.join(tokensDir, file);
          const stats = await fs.stat(filePath);
          const timeAgo = getTimeAgo(stats.mtime);
          console.log(`  • ${file}: ${chalk.gray(timeAgo)}`);
        }
      }
    } catch (error) {
      console.log(chalk.red('  Error reading token files'));
    }
    
    console.log();
    
    // Show next steps
    console.log(chalk.blue('📋 Quick Actions:'));
    console.log('  • mimic-tokens init    - Setup configuration');
    console.log('  • mimic-tokens export  - Export from Penpot');
    console.log('  • mimic-tokens build   - Generate outputs');
    console.log('  • mimic-tokens sync    - Export + build');
    console.log('  • mimic-tokens watch   - Watch for changes');
  });

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
