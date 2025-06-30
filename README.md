# Penpot Design Token Export Automation

Automated, headless export of W3C DTCG compliant design tokens from Penpot design files,
integrated with the Mimic monorepo development workflow.

## 📋 Overview

This tool provides automated export of design tokens from Penpot design files using the official
`penpot-export` CLI. It runs in a dev-container environment and integrates seamlessly with the
Style Dictionary build pipeline to enable real-time design-to-code workflows.

## 🏗️ Architecture

```text
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐
│   Penpot    │    │  penpot-export  │    │ Style Dictionary│    │  Generated   │
│Design Files │───▶│   (Container)   │───▶│   Transform     │───▶│   Outputs    │
│ (Token Panel)│    │                 │    │    Pipeline     │    │ (Multi-Platform)│
└─────────────┘    └─────────────────┘    └─────────────────┘    └──────────────┘
       │                     │                      │                     │
       ▼                     ▼                      ▼                     ▼
  Design Changes         base.json             Build Process       CSS/TS/Dart/JSON
    (Real-time)         (W3C DTCG)            (Watch Mode)       (Type-Safe APIs)
```

## 🛠️ Setup & Configuration

### Prerequisites

- **Penpot Instance**: Self-hosted or cloud (design.penpot.app)
- **Penpot File**: With design tokens defined in the token panel
- **Docker**: For dev-container execution
- **Access Token**: Penpot API access for headless export

### Environment Configuration

Create a `.env` file in the workspace root:

```bash
# Penpot Export Configuration
PENPOT_FILE_ID=your-file-uuid-from-penpot-url
PENPOT_ACCESS_TOKEN=your-api-access-token
PENPOT_TEAM_ID=your-team-id
```

### Getting Penpot Credentials

1. **File ID**: Found in Penpot file URL: `https://design.penpot.app/#/workspace/.../project/.../file/{FILE_ID}`
2. **Access Token**: Generate in Penpot Profile → Access Tokens
3. **Team ID**: Found in workspace settings or team URL

## 🚀 Usage

### Development Workflow

```bash
# 1. Export tokens from Penpot and build
pnpm nx run design-tokens:tokens:sync

# 2. Watch for changes and rebuild automatically
pnpm nx run design-tokens:watch

# 3. Manual export only (without Style Dictionary build)
pnpm nx run design-tokens:tokens:export
```

### Manual Export (Dev Container)

```bash
# Run the export service
docker-compose --profile penpot-sync up penpot-export

# Or with specific environment
PENPOT_FILE_ID=abc123 docker-compose --profile penpot-sync up penpot-export
```

```bash
# Export tokens from Penpot
pnpm run tokens:export

# Build Style Dictionary outputs
pnpm run build:tokens

# Watch for changes during development
pnpm run tokens:watch
```

### Automated Export

```bash
# Via dev-container
docker-compose -f .devcontainer/docker-compose.yml up penpot-export

# Via CI/CD (scheduled)
# Runs nightly to sync latest design changes
```

### Integration with Style Dictionary

The exported `tokens.json` automatically triggers Style Dictionary rebuild:

```bash
# Workflow
Penpot Design → penpot-export → tokens.json → Style Dictionary → Platform Outputs
```

## Token Structure

Exported tokens follow W3C DTCG format:

```json
{
  "color": {
    "primary": {
      "500": {
        "$value": "#3b82f6",
        "$type": "color",
        "$description": "Primary brand color"
      }
    }
  },
  "spacing": {
    "md": {
      "$value": "1rem",
      "$type": "dimension",
      "$description": "Medium spacing unit"
    }
  }
}
```

## Validation

Tokens are automatically validated for:

- W3C DTCG compliance
- Required properties (`$value`, `$type`)
- Consistent naming conventions
- Valid CSS values

```bash
# Validate exported tokens
pnpm test

# Check token structure
pnpm run tokens:validate
```

## Troubleshooting

### Common Issues

#### Export Fails

```bash
# Check Penpot connectivity
curl -H "Authorization: Bearer $PENPOT_ACCESS_TOKEN" \
  "$PENPOT_BASE_URL/api/teams"

# Verify file ID
echo "File ID: $PENPOT_FILE_ID"
```

#### Token Format Issues

```bash
# Validate JSON structure
pnpm exec jsonlint tokens/exported-tokens.json

# Check W3C DTCG compliance
pnpm run tokens:validate
```

#### Style Dictionary Build Fails

```bash
# Clean and rebuild
pnpm run clean
pnpm run build:tokens --verbose
```

## Development Workflow

1. **Design Phase**: Create tokens in Penpot design file
2. **Export Phase**: Run `pnpm run tokens:export`
3. **Transform Phase**: Style Dictionary generates platform outputs
4. **Integration Phase**: Import tokens in applications
5. **Testing Phase**: Validate visual consistency

## Future Enhancements

- **Live Sync**: Real-time token updates during design
- **Conflict Resolution**: Handle token name collisions
- **Version Control**: Track token changes over time
- **Team Notifications**: Alert developers of token updates

For detailed usage examples, see the [Design Tokens Guide](../../docs/DESIGN_TOKENS.md).
