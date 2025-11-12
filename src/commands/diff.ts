import { execSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';

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
      let baseTokens: TokenValue = {};
      let headTokens: TokenValue = {};

      try {
        const baseContent = execSync(`git show ${baseRef}:${tokensPath}`, { encoding: 'utf8' });
        baseTokens = parseTokenValue(baseContent);
      } catch {
        console.log(chalk.yellow(`⚠️ No tokens found in ${baseRef}`));
      }

      try {
        const headContent = execSync(`git show ${headRef}:${tokensPath}`, { encoding: 'utf8' });
        headTokens = parseTokenValue(headContent);
      } catch {
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

type TokenValue = unknown;
type TokenNode = Record<string, TokenValue>;

interface TokenChange {
  path: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: TokenValue;
  newValue?: TokenValue;
}

function parseTokenValue(raw: string): TokenValue {
  try {
    return JSON.parse(raw) as TokenValue;
  } catch {
    return {};
  }
}

function isTokenNode(value: TokenValue): value is TokenNode {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function compareTokens(base: TokenValue, head: TokenValue, path = ''): TokenChange[] {
  const changes: TokenChange[] = [];

  if (isTokenNode(base) && isTokenNode(head)) {
    const allKeys = new Set([...Object.keys(base), ...Object.keys(head)]);
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const baseValue = base[key];
      const headValue = head[key];

      if (!(key in head)) {
        changes.push({ path: currentPath, type: 'removed', oldValue: baseValue });
        continue;
      }
      if (!(key in base)) {
        changes.push({ path: currentPath, type: 'added', newValue: headValue });
        continue;
      }

      changes.push(...compareTokens(baseValue, headValue, currentPath));
    }
    return changes;
  }

  if (base === undefined && head !== undefined) {
    changes.push({ path, type: 'added', newValue: head });
  } else if (head === undefined && base !== undefined) {
    changes.push({ path, type: 'removed', oldValue: base });
  } else if (!isDeepStrictEqual(base, head)) {
    changes.push({ path, type: 'modified', oldValue: base, newValue: head });
  }

  return changes;
}

function generateDiffReport(changes: TokenChange[], baseRef: string, headRef: string): string {
  const lines: string[] = [];
  lines.push('# Design Token Changes', '');
  lines.push(`**Comparing:** \`${baseRef}\` → \`${headRef}\``);
  lines.push(`**Date:** ${new Date().toISOString()}`, '');

  if (changes.length === 0) {
    lines.push('✅ No token changes detected.');
    return lines.join('\n');
  }

  const added = changes.filter((change) => change.type === 'added');
  const removed = changes.filter((change) => change.type === 'removed');
  const modified = changes.filter((change) => change.type === 'modified');

  lines.push('## Summary', '');
  lines.push(`- 🟢 Added: ${added.length}`);
  lines.push(`- 🔴 Removed: ${removed.length}`);
  lines.push(`- 🟡 Modified: ${modified.length}`);
  lines.push(`- **Total Changes:** ${changes.length}`, '');

  if (added.length > 0) {
    lines.push('## 🟢 Added Tokens', '');
    for (const change of added) {
      lines.push(`- \`${change.path}\`: ${JSON.stringify(change.newValue)}`);
    }
    lines.push('');
  }

  if (removed.length > 0) {
    lines.push('## 🔴 Removed Tokens', '');
    for (const change of removed) {
      lines.push(`- \`${change.path}\`: ${JSON.stringify(change.oldValue)}`);
    }
    lines.push('');
  }

  if (modified.length > 0) {
    lines.push('## 🟡 Modified Tokens', '');
    for (const change of modified) {
      lines.push(`- \`${change.path}\`:`);
      lines.push(`  - **Before:** ${JSON.stringify(change.oldValue)}`);
      lines.push(`  - **After:** ${JSON.stringify(change.newValue)}`);
    }
  }

  return lines.join('\n');
}
