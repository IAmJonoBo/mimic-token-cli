import chalk from 'chalk';
import { execSync } from 'child_process';
import { Command } from 'commander';
import ora from 'ora';

interface SyncOptions {
  watch?: boolean;
}

export const syncCommand = new Command('sync')
  .description('Export tokens from Penpot and build all platforms')
  .option('-w, --watch', 'Watch for changes after sync')
  .action(async (options: SyncOptions) => {
    const spinner = ora('Starting token sync...').start();
    
    try {
      spinner.text = 'Exporting tokens from Penpot...';
      
      // Run export using the CLI
      execSync('n00plicate-tokens export --force', { stdio: 'pipe' });
      
      spinner.text = 'Building Style Dictionary outputs...';
      
      // Run build
      if (options.watch) {
        spinner.succeed('Export completed. Starting watch mode...');
        execSync('n00plicate-tokens build --watch', { stdio: 'inherit' });
      } else {
        execSync('n00plicate-tokens build', { stdio: 'pipe' });
        
        spinner.succeed('Token sync completed successfully!');
        
        console.log(chalk.green('\n✅ Sync Summary:'));
        console.log('  • Tokens exported from Penpot');
        console.log('  • Style Dictionary outputs generated');
        console.log('  • All platforms updated');
        
        console.log(chalk.cyan('\n📋 Next steps:'));
        console.log('  • Check generated files in packages/design-tokens/libs/');
        console.log('  • Update your applications to use new tokens');
        console.log('  • Run tests to ensure no breaking changes');
      }
      
    } catch (error) {
      spinner.fail('Sync failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });
