# Type Safety HUD

[![npm version](https://img.shields.io/npm/v/type-safety-hud.svg)](https://www.npmjs.com/package/type-safety-hud)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful TypeScript type safety monitoring dashboard for tracking refactoring progress in your codebase. Visualize your journey towards type safety with real-time progress tracking, beautiful HTML dashboards, and trend analysis.

![Type Safety HUD Dashboard](docs/dashboard-preview.png)

## 🚀 Features

- 🖥️ **CLI Dashboard**: Real-time monitoring of your TypeScript refactoring progress in your terminal
- 📊 **HTML Reports**: Generate beautiful, interactive HTML dashboards with charts and graphs
- 📈 **Trend Tracking**: Monitor your refactoring progress over time with historical data
- 🔍 **Critical File Detection**: Identify files that need immediate attention
- 🧪 **Customizable**: Configure to match your project's specific needs
- 🔌 **VSCode Integration**: Coming soon - In-editor overlays with inline decorations

## 🔄 What's New in v1.0.0

- Full ESM support
- Improved HTML dashboard with interactive charts
- Better trend visualization
- Enhanced analyzer with more accurate 'any' detection
- Detailed reports with file-specific recommendations
- Scoped commands for easy workflow integration

## 🛠️ Installation

```bash
# Install globally
npm install -g type-safety-hud

# Or use with npx
npx type-safety-hud

# Add to your project
npm install --save-dev type-safety-hud
```

## 📋 Quick Start

1. Navigate to your TypeScript project:

```bash
cd your-typescript-project
```

2. Run the CLI dashboard:

```bash
type-safety-hud
```

3. Generate an HTML report:

```bash
type-safety-hud --html
```

4. Update the trend file to track progress over time:

```bash
type-safety-hud --trend
```

5. Add to your package.json scripts:

```json
"scripts": {
  "type-check": "tsc --noEmit",
  "type-audit": "type-safety-hud",
  "type-report": "type-safety-hud --html"
}
```

## 📚 Usage

### CLI Options

```bash
# Show the dashboard in CLI mode
type-safety-hud

# Generate an HTML dashboard
type-safety-hud --html

# Update the trend tracking file
type-safety-hud --trend

# Output JSON data (for integrations)
type-safety-hud --json

# Set a custom path for your project
type-safety-hud --project /path/to/project

# Specify custom config file
type-safety-hud --config path/to/config.json

# Show specific commands
type-safety-hud --help
```

### Analyze Specific Commands

```bash
# Analyze project and generate a report
type-safety-hud analyze --dir ./src --output ./reports/refactor-map.yaml

# Generate reports from analysis data
type-safety-hud report --input ./reports/refactor-map.yaml --format html

# Display current status
type-safety-hud status --input ./reports/refactor-map.yaml

# Update status of a specific file
type-safety-hud update-status --file src/utils/helpers.ts --status completed

# Batch update statuses based on a pattern
type-safety-hud batch-update --pattern "src/components/**/*.ts" --status in-progress
```

### Configuration

Create a `type-safety-hud.config.js` file in your project root:

```js
module.exports = {
  // Root directory to analyze
  rootDir: './src',
  
  // Files or directories to exclude
  exclude: ['node_modules', 'dist', '**/*.test.ts'],
  
  // Custom priority rules
  priority: {
    high: { anyThreshold: 10, jsImportThreshold: 5 },
    medium: { anyThreshold: 5, jsImportThreshold: 2 },
  },
  
  // Output paths
  output: {
    html: './reports/refactor-dashboard.html',
    trend: './reports/refactor-trend.md',
    map: './reports/refactor-map.yaml',
  },
  
  // Dashboard config
  dashboard: {
    title: 'MyProject Type Safety',
    theme: 'dark', // 'light' or 'dark'
    logo: './path/to/logo.png',
  }
}
```

## 📊 Example Output

### CLI Dashboard

```
╔════════════════════════════════════════════════════════════╗
║                 Type Safety HUD Dashboard                  ║
╚════════════════════════════════════════════════════════════╝

📊 Overall Progress: 65% refactored
[███████████████████░░░░░░░░░░] 78/120 files

📈 Trend (last 5 updates):
2023-11-01 ███ 30%
2023-11-05 █████ 45%
2023-11-10 ███████ 55%
2023-11-15 ████████ 60%
2023-11-20 █████████ 65%

🔥 Top Critical Files:
  1. src/components/DataTable.ts - 24 any, 3 js imports
  2. src/utils/api.ts - 18 any, 5 js imports
  3. src/store/state.ts - 15 any, 0 js imports
  4. src/hooks/useData.ts - 12 any, 2 js imports
  5. src/types/index.ts - 10 any, 0 js imports

📊 Summary by Priority:
  High: 5 files (⚠️ critical)
  Medium: 12 files
  Low: 25 files
  Completed: 78 files
```

## 🧩 API Usage

You can also use Type Safety HUD programmatically in your Node.js applications:

```typescript
import { 
  TypeSafetyDashboard,
  analyzeProject, 
  generateHtmlDashboard, 
  updateTrend 
} from 'type-safety-hud';

// Method 1: Use the high-level API
const report = await analyzeProject('./src');
await generateHtmlDashboard(report, './reports/dashboard.html');
await updateTrend(report, './reports/trend.md');

// Method 2: Use the TypeSafetyDashboard class
const dashboard = new TypeSafetyDashboard({
  srcDir: './src',
  reportFile: './reports/refactor-map.yml',
  trendFile: './reports/trend.md',
  excludePatterns: ['**/node_modules/**', '**/dist/**'],
  includePatterns: ['**/*.ts', '**/*.tsx'],
});

// Run analysis
const reportData = dashboard.runAnalysis();

// Save report and update trend
dashboard.saveReport();
dashboard.updateTrendFile();

// Get critical files
const criticalFiles = dashboard.getCriticalFiles(5);
console.log('Top 5 critical files:', criticalFiles);
```

## 📦 Publishing the Package

To publish the package to npm, use the following commands:

```bash
# Using npm script
npm run release

# On Linux/macOS using the shell script
./publish.sh

# On Windows using PowerShell (requires running PowerShell as Administrator)
powershell -ExecutionPolicy Bypass -File .\publish.ps1
```

### Using GitHub Actions

This package includes a GitHub Actions workflow for automated releases. To release a new version:

1. Go to your repository on GitHub
2. Navigate to the Actions tab
3. Select the "Release Package" workflow
4. Click "Run workflow"
5. Enter the version number or select a release type (patch, minor, major)
6. Click "Run workflow" to start the release process

The workflow will:
- Run tests and build the package
- Publish to npm
- Create a git tag and GitHub release
- Generate release notes automatically

⚠️ **Note**: You need to add an `NPM_TOKEN` secret to your repository settings for the automated publishing to work.

## 🛠️ Integration with CI/CD

Example GitHub Actions workflow for type safety monitoring:

```yaml
name: Type Safety Monitoring

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  check-type-safety:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      - run: npm install -g type-safety-hud
      - run: type-safety-hud --json > type-safety-report.json
      - name: Upload report artifact
        uses: actions/upload-artifact@v3
        with:
          name: type-safety-report
          path: type-safety-report.json
```

## 📝 License

[MIT](LICENSE) © Jarvis AI Team 