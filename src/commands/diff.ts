import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

interface DiffOptions {
  base?: string;
  head?: string;
  output?: string;
}

export const diffCommand = new Command('diff')
  .description('Compare design tokens between branches or commits')
  .option('-b, --base <ref>', 'Base branch or commit', 'main')
  .option('-h, --head <ref>', 'Head branch or commit', 'HEAD')
  .option('-o, --output <path>', 'Output file for diff report')
  .action(async (options: DiffOptions) => {
    try {
      const baseRef = options.base || 'main';
      const headRef = options.head || 'HEAD';
      const tokensPath = 'packages/design-tokens/tokens/base.json';
      
      console.log(chalk.cyan(`🔍 Comparing tokens: ${baseRef}...${headRef}`));
      
      // Get token files from both refs
      let baseTokens: any = {};
      let headTokens: any = {};
      
      try {
        const baseContent = execSync(`git show ${baseRef}:${tokensPath}`, { encoding: 'utf8' });
        baseTokens = JSON.parse(baseContent);
      } catch (error) {
        console.log(chalk.yellow(`⚠️ No tokens found in ${baseRef}`));
      }
      
      try {
        const headContent = execSync(`git show ${headRef}:${tokensPath}`, { encoding: 'utf8' });
        headTokens = JSON.parse(headContent);
      } catch (error) {
        console.log(chalk.yellow(`⚠️ No tokens found in ${headRef}`));
      }
      
      // Compare tokens
      const changes = compareTokens(baseTokens, headTokens);
      
      // Generate report
      const report = generateDiffReport(changes, baseRef, headRef);
      
      if (options.output) {
        await fs.writeFile(options.output, report);
        console.log(chalk.green(`📄 Diff report saved to: ${options.output}`));
      } else {
        console.log(report);
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Diff failed:'), error);
      process.exit(1);
    }
  });

interface TokenChange {
  path: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: any;
  newValue?: any;
}

function compareTokens(base: any, head: any, path = ''): TokenChange[] {
  const changes: TokenChange[] = [];
  
  // Get all unique keys
  const allKeys = new Set([
    ...Object.keys(base || {}),
    ...Object.keys(head || {})
  ]);
  
  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const baseValue = base?.[key];
    const headValue = head?.[key];
    
    if (baseValue === undefined) {
      // Added
      changes.push({
        path: currentPath,
        type: 'added',
        newValue: headValue
      });
    } else if (headValue === undefined) {
      // Removed
      changes.push({
        path: currentPath,
        type: 'removed',
        oldValue: baseValue
      });
    } else if (typeof baseValue === 'object' && typeof headValue === 'object') {
      // Recursively compare objects
      if (!baseValue.$value && !headValue.$value) {
        changes.push(...compareTokens(baseValue, headValue, currentPath));
      } else {
        // Token with $value
        if (JSON.stringify(baseValue) !== JSON.stringify(headValue)) {
          changes.push({
            path: currentPath,
            type: 'modified',
            oldValue: baseValue,
            newValue: headValue
          });
        }
      }
    } else if (baseValue !== headValue) {
      // Modified
      changes.push({
        path: currentPath,
        type: 'modified',
        oldValue: baseValue,
        newValue: headValue
      });
    }
  }
  
  return changes;
}

function generateDiffReport(changes: TokenChange[], baseRef: string, headRef: string): string {
  let report = `# Design Token Changes\n\n`;
  report += `**Comparing:** \`${baseRef}\` → \`${headRef}\`\n`;
  report += `**Date:** ${new Date().toISOString()}\n\n`;
  
  if (changes.length === 0) {
    report += `✅ No token changes detected.\n`;
    return report;
  }
  
  const added = changes.filter(c => c.type === 'added');
  const removed = changes.filter(c => c.type === 'removed');
  const modified = changes.filter(c => c.type === 'modified');
  
  report += `## Summary\n\n`;
  report += `- 🟢 Added: ${added.length}\n`;
  report += `- 🔴 Removed: ${removed.length}\n`;
  report += `- 🟡 Modified: ${modified.length}\n`;
  report += `- **Total Changes:** ${changes.length}\n\n`;
  
  if (added.length > 0) {
    report += `## 🟢 Added Tokens\n\n`;
    for (const change of added) {
      report += `- \`${change.path}\`: ${JSON.stringify(change.newValue)}\n`;
    }
    report += `\n`;
  }
  
  if (removed.length > 0) {
    report += `## 🔴 Removed Tokens\n\n`;
    for (const change of removed) {
      report += `- \`${change.path}\`: ${JSON.stringify(change.oldValue)}\n`;
    }
    report += `\n`;
  }
  
  if (modified.length > 0) {
    report += `## 🟡 Modified Tokens\n\n`;
    for (const change of modified) {
      report += `- \`${change.path}\`:\n`;
      report += `  - **Before:** ${JSON.stringify(change.oldValue)}\n`;
      report += `  - **After:** ${JSON.stringify(change.newValue)}\n`;
    }
  }
  
  return report;
}
