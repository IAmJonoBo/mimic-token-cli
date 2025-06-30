#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { exportCommand } from './commands/export.js';
import { buildCommand } from './commands/build.js';
import { watchCommand } from './commands/watch.js';
import { syncCommand } from './commands/sync.js';
import { validateCommand } from './commands/validate.js';
import { initCommand } from './commands/init.js';
import { diffCommand } from './commands/diff.js';
import { statusCommand } from './commands/status.js';

const program = new Command();

program
  .name('mimic-tokens')
  .description('CLI tool for managing design tokens in the Mimic monorepo')
  .version('1.0.0');

// Banner
console.log(chalk.cyan(`
╭─────────────────────────────────────────╮
│  🎨 Mimic Design Token CLI              │
│     Penpot → Style Dictionary → Apps    │
╰─────────────────────────────────────────╯
`));

// Commands
program
  .addCommand(initCommand)
  .addCommand(exportCommand)
  .addCommand(buildCommand)
  .addCommand(syncCommand)
  .addCommand(watchCommand)
  .addCommand(validateCommand)
  .addCommand(diffCommand)
  .addCommand(statusCommand);

// Global error handling
process.on('unhandledRejection', (err) => {
  console.error(chalk.red('❌ Unhandled error:'), err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 Goodbye!'));
  process.exit(0);
});

program.parse();
