import chalk from 'chalk';
import { execSync } from 'node:child_process';
import { Command } from 'commander';
import fs from 'fs-extra';
import ora from 'ora';
import path from 'node:path';

interface BuildOptions {
  watch?: boolean;
  platform?: string;
  config?: string;
}

export const buildCommand = new Command('build')
  .description('Build design tokens using Style Dictionary')
  .option('-w, --watch', 'Watch for changes and rebuild')
  .option('-p, --platform <platform>', 'Build specific platform only')
  .option('-c, --config <path>', 'Style Dictionary config file', 'packages/design-tokens/style-dictionary.config.js')
  .action(async (options: BuildOptions) => {
    const spinner = ora('Building design tokens...').start();
    
    try {
      const configPath = path.resolve(options.config ?? 'packages/design-tokens/style-dictionary.config.js');
      
      // Check if config exists
      if (!await fs.pathExists(configPath)) {
        spinner.fail(`Style Dictionary config not found: ${configPath}`);
        process.exit(1);
      }
      
      const workingDir = path.dirname(configPath);
      
      if (options.watch) {
        spinner.text = 'Starting watch mode...';
        spinner.succeed('Watch mode started. Press Ctrl+C to stop.');
        
        console.log(chalk.cyan('👀 Watching for token changes...'));
        
        // Run in watch mode
        execSync(`cd "${workingDir}" && style-dictionary build --watch`, {
          stdio: 'inherit',
        });
      } else {
        let buildCommand = `cd "${workingDir}" && style-dictionary build`;
        
        if (options.platform) {
          buildCommand += ` --platform ${options.platform}`;
          spinner.text = `Building ${options.platform} platform...`;
        } else {
          spinner.text = 'Building all platforms...';
        }
        
        execSync(buildCommand, { stdio: 'pipe' });
        
        spinner.succeed('Build completed successfully!');
        
        // Show build summary
        const outputDir = path.join(workingDir, 'libs', 'tokens');
        if (await fs.pathExists(outputDir)) {
          const platforms = await fs.readdir(outputDir);
          console.log(chalk.cyan('\n📦 Generated outputs:'));
          for (const platform of platforms) {
            const platformPath = path.join(outputDir, platform);
            if ((await fs.stat(platformPath)).isDirectory()) {
              const files = await fs.readdir(platformPath);
              console.log(`  • ${platform}: ${files.length} files`);
            }
          }
        }
        
        console.log(chalk.cyan('\n📋 Next steps:'));
        console.log('  • Check generated files in packages/design-tokens/libs/');
        console.log('  • Import tokens in your applications');
        console.log('  • Run: n00plicate-tokens validate (to verify outputs)');
      }
      
    } catch (_error: unknown) {
      spinner.fail('Build failed');
      const err = _error instanceof Error ? _error : new Error(String(_error));
      console.error(chalk.red('Error:'), err);
      process.exit(1);
    }
  });
