# n00plicate Token CLI

A powerful command-line tool for managing design tokens in the n00plicate ecosystem. Export tokens from
Penpot, transform them with Style Dictionary, and generate platform-specific outputs for web,
mobile, and desktop applications.

## 🚀 Quick Start

```bash
# Install globally
npm install -g n00plicate-token-cli

# Initialize in your project
n00plicate-tokens init

# Export tokens from Penpot
n00plicate-tokens export

# Build platform outputs
n00plicate-tokens build

# Watch for changes
n00plicate-tokens watch
```

## 🎯 Features

- **🎨 Penpot Integration**: Direct export from Penpot design files
- **🔄 Style Dictionary Pipeline**: Transform tokens to multiple formats
- **📱 Multi-Platform**: Generate CSS, TypeScript, React Native, and Android outputs
- **👀 Live Watching**: Auto-rebuild on token changes
- **🔍 Validation**: Ensure token contract compliance
- **📊 Diff & Status**: Track changes and pipeline health
- **⚡ Performance**: Optimized builds with caching

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g n00plicate-token-cli
# or
pnpm add -g n00plicate-token-cli
# or
yarn global add n00plicate-token-cli
```

### Local Installation

```bash
npm install n00plicate-token-cli
# or
pnpm add n00plicate-token-cli
```

## 🏁 Quick Start

### 1. Initialize Configuration

```bash
n00plicate-tokens init
```

This will prompt you for:

- **Penpot File ID** - Found in your Penpot file URL
- **Access Token** - Generated in Penpot Profile → Access Tokens
- **Team ID** - Found in workspace settings (optional)
- **Base URL** - Usually `https://design.penpot.app`

### 2. Check Setup

```bash
n00plicate-tokens status
```

### 3. Sync Tokens

```bash
# Export from Penpot + build all platforms
n00plicate-tokens sync
```

### 4. Development Mode

```bash
# Watch for changes and auto-rebuild
n00plicate-tokens watch
```

## 📋 Commands

### `n00plicate-tokens init`

Interactive setup wizard for Penpot credentials and configuration.

```bash
n00plicate-tokens init [options]

Options:
  -f, --force    Overwrite existing configuration
```

### `n00plicate-tokens export`

Export design tokens from Penpot in W3C DTCG format.

```bash
n00plicate-tokens export [options]

Options:
  -o, --output <path>    Output file path (default: packages/design-tokens/tokens/base.json)
  -f, --file-id <id>     Penpot file ID (overrides .env)
  -t, --token <token>    Penpot access token (overrides .env)
  --force                Overwrite existing files
```

### `n00plicate-tokens build`

Transform tokens using Style Dictionary into platform-specific formats.

```bash
n00plicate-tokens build [options]

Options:
  -p, --platform <name>  Build specific platform (css, ts, react-native, compose)
  -w, --watch           Watch for changes
  -c, --config <path>   Custom Style Dictionary config
```

### `n00plicate-tokens sync`

Combined export and build workflow.

```bash
n00plicate-tokens sync [options]

Options:
  -w, --watch    Watch for changes after sync
```

### `n00plicate-tokens watch`

Watch for token file changes and rebuild automatically.

```bash
n00plicate-tokens watch [options]

Options:
  -d, --debounce <ms>    Debounce delay in milliseconds (default: 500)
```

### `n00plicate-tokens validate`

Validate design tokens against W3C DTCG schema.

```bash
n00plicate-tokens validate [options]

Options:
  -s, --schema <path>    Custom schema file
  -t, --tokens <path>    Tokens directory or file
```

### `n00plicate-tokens diff`

Compare design tokens between branches or commits.

```bash
n00plicate-tokens diff [options]

Options:
  -b, --base <ref>       Base branch or commit (default: main)
  -h, --head <ref>       Head branch or commit (default: HEAD)
  -o, --output <path>    Output file for diff report
```

### `n00plicate-tokens status`

Show status of design token pipeline and health checks.

```bash
n00plicate-tokens status
```

## 🏗️ Project Structure

The CLI expects your project to follow this structure:

```text
your-project/
├── .env                                    # Penpot credentials
├── packages/design-tokens/
│   ├── tokens/
│   │   ├── base.json                      # Exported from Penpot (W3C DTCG)
│   │   ├── semantic.json                  # Semantic token layer
│   │   └── components.json                # Component-specific tokens
│   ├── style-dictionary.config.js        # Transform configuration
│   └── libs/tokens/                       # Generated platform outputs
│       ├── css/tokens.css                 # CSS custom properties
│       ├── ts/tokens.ts                   # TypeScript definitions
│       ├── react-native/theme.ts          # React Native theme
│       ├── compose/Theme.kt               # Android Compose
│       └── dart/tokens.dart               # Flutter
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in your project root:

```bash
# Penpot Configuration
PENPOT_FILE_ID=your-file-uuid-from-penpot-url
PENPOT_ACCESS_TOKEN=your-api-access-token
PENPOT_TEAM_ID=your-team-id
PENPOT_BASE_URL=https://design.penpot.app

# Optional: Override paths
TOKENS_OUTPUT_DIR=packages/design-tokens/tokens
TOKENS_BUILD_DIR=packages/design-tokens/libs
```

### Style Dictionary Configuration

The CLI works with any Style Dictionary configuration. Example `style-dictionary.config.js`:

```javascript
export default {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'libs/tokens/css/',
      files: [{
        destination: 'tokens.css',
        format: 'css/variables'
      }]
    },
    ts: {
      transformGroup: 'js',
      buildPath: 'libs/tokens/ts/',
      files: [{
        destination: 'tokens.ts',
        format: 'javascript/es6'
      }]
    }
  }
};
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Design Token Pipeline

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  sync-tokens:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install CLI
        run: npm install -g n00plicate-token-cli
      
      - name: Export & Build Tokens
        env:
          PENPOT_ACCESS_TOKEN: ${{ secrets.PENPOT_ACCESS_TOKEN }}
          PENPOT_FILE_ID: ${{ secrets.PENPOT_FILE_ID }}
        run: n00plicate-tokens sync
      
      - name: Create Pull Request
        if: success()
        uses: peter-evans/create-pull-request@v5
        with:
          title: 'feat(tokens): sync design tokens from Penpot'
          branch: tokens/sync-${{ github.run_id }}
```

### Pre-commit Hooks

```bash
#!/bin/sh
# .husky/pre-commit

# Prevent manual token edits
if git diff --cached --name-only | grep -q "tokens/base.json"; then
  echo "❌ Manual edits to base.json not allowed. Use Penpot!"
  exit 1
fi

# Validate tokens if changed
if git diff --cached --name-only | grep -q "tokens/"; then
  n00plicate-tokens validate
fi
```

## 🎯 Usage Examples

### Daily Development Workflow

```bash
# Start development with auto-rebuilding
n00plicate-tokens watch

# In another terminal, make changes in Penpot
# CLI automatically detects and rebuilds tokens

# Check what changed
n00plicate-tokens diff
```

### Release Workflow

```bash
# Before release, sync everything
n00plicate-tokens sync

# Validate all tokens
n00plicate-tokens validate

# Generate change report
n00plicate-tokens diff --base v1.0.0 --head HEAD --output CHANGELOG.md
```

### Platform-Specific Development

```bash
# Work only with CSS tokens
n00plicate-tokens build --platform css --watch

# Build for React Native
n00plicate-tokens build --platform react-native

# Custom config for special builds
n00plicate-tokens build --config custom-config.js
```

## 🔧 Platform Integration

### Web (React, Qwik, Vue)

```typescript
import '@your-org/design-tokens/css';
// or
import { tokens } from '@your-org/design-tokens';

const Button = () => (
  <button style={{ 
    backgroundColor: tokens.color.primary[500],
    padding: tokens.spacing.md 
  }}>
    Click me
  </button>
);
```

### React Native

```tsx
import { theme } from '@your-org/design-tokens/react-native';

const Button = () => (
  <TouchableOpacity style={{
    backgroundColor: theme.color.primary[500],
    padding: theme.spacing.md
  }}>
    <Text>Click me</Text>
  </TouchableOpacity>
);
```

### Android Compose

```kotlin
import com.yourorg.tokens.DesignTokens

@Composable
fun Button() {
    Button(
        colors = ButtonDefaults.buttonColors(
            backgroundColor = DesignTokens.ColorPrimary500
        )
    ) {
        Text("Click me")
    }
}
```

## 🐛 Troubleshooting

### Common Issues

**Export fails with authentication error:**

```bash
n00plicate-tokens status  # Check credentials
```

**Build errors:**

```bash
rm -rf libs/
n00plicate-tokens build  # Clean rebuild
```

**Watch mode not working:**

```bash
CHOKIDAR_USEPOLLING=true n00plicate-tokens watch  # For network drives
```

### Debug Mode

Set `DEBUG=n00plicate-tokens:*` for verbose logging:

```bash
DEBUG=n00plicate-tokens:* n00plicate-tokens sync
```

## 📚 Documentation

- [Penpot Token Setup Guide](https://docs.penpot.app/user-guide/tokens/)
- [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/)
- [W3C Design Tokens Specification](https://design-tokens.github.io/community-group/format/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/IAmJonoBo/n00plicate-token-cli/issues)
- **Discussions**: [Community help and ideas](https://github.com/IAmJonoBo/n00plicate-token-cli/discussions)

---

Built with ❤️ for design system teams who want automation without complexity.
