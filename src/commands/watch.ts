import chalk from 'chalk';
import { execSync } from 'child_process';
import chokidar from 'chokidar';
import { Command } from 'commander';
import path from 'path';

interface WatchOptions {
  debounce?: string;
}

export const watchCommand = new Command('watch')
  .description('Watch for token file changes and rebuild automatically')
  .option('-d, --debounce <ms>', 'Debounce delay in milliseconds', '500')
  .action(async (options: WatchOptions) => {
    const debounceMs = parseInt(options.debounce || '500');
    
    console.log(chalk.cyan('👀 Starting token watch mode...'));
    console.log(chalk.gray(`Debounce delay: ${debounceMs}ms`));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));
    
    const tokensPath = path.resolve('packages/design-tokens/tokens');
    
    let timeout: NodeJS.Timeout | null = null;
    
    const rebuild = () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        console.log(chalk.yellow('🔄 Rebuilding tokens...'));
        
        try {
          execSync('n00plicate-tokens build', { stdio: 'pipe' });
          console.log(chalk.green('✅ Rebuild completed successfully'));
        } catch (_error: unknown) {
          const err = _error instanceof Error ? _error : new Error(String(_error));
          console.error(chalk.red('❌ Rebuild failed:'), err);
        }
      }, debounceMs);
    };
    
    // Watch for changes
    const watcher = chokidar.watch(`${tokensPath}/**/*.json`, {
      ignoreInitial: true,
      persistent: true,
    });
    
    watcher
      .on('change', (filePath) => {
        console.log(chalk.blue(`📝 Changed: ${path.relative(process.cwd(), filePath)}`));
        rebuild();
      })
      .on('add', (filePath) => {
        console.log(chalk.green(`➕ Added: ${path.relative(process.cwd(), filePath)}`));
        rebuild();
      })
      .on('unlink', (filePath) => {
        console.log(chalk.red(`🗑️  Removed: ${path.relative(process.cwd(), filePath)}`));
        rebuild();
      })
      .on('error', (error) => {
        console.error(chalk.red('❌ Watch error:'), error);
      });
    
    // Initial build
    console.log(chalk.yellow('🔄 Initial build...'));
    try {
      execSync('n00plicate-tokens build', { stdio: 'pipe' });
      console.log(chalk.green('✅ Initial build completed'));
    } catch (_error: unknown) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      console.error(chalk.red('❌ Initial build failed:'), err);
    }
    
    console.log(chalk.cyan(`\n👀 Watching ${tokensPath} for changes...`));
    
    // Keep the process alive
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Stopping watch mode...'));
      void watcher.close();
      process.exit(0);
    });
  });
