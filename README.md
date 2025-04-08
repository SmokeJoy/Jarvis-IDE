# Jarvis IDE

AI coding assistant powered by Claude 3.5 Sonnet.

IDE intelligente con supporto multi-provider LLM, esportazione YAML, validazione schema e WebView interattiva.

## Features

- Chat with Claude 3.5 Sonnet to get help with coding tasks
- Support for multiple AI providers:
  - OpenAI
  - AWS Bedrock
  - Jarvis IDE
  - OpenRouter
  - Qwen
- Beautiful and modern UI with syntax highlighting
- MCP (Model Context Protocol) support for advanced features
- Telemetry for usage tracking (optional)

## Requirements

- VS Code 1.85.0 or higher
- Node.js 18 or higher

## Installation

1. Download the latest `.vsix` file from the [releases page](https://github.com/jarvis-ide/jarvis-ide/releases)
2. Install it in VS Code:
   - Open VS Code
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
   - Type "Install from VSIX" and select it
   - Choose the downloaded `.vsix` file

## Configuration

1. Get an API key from your preferred provider
2. Open VS Code settings
3. Search for "Jarvis IDE"
4. Configure the following settings:
   - `jarvis-ide.provider`: The AI provider to use
   - `jarvis-ide.apiKey`: Your API key
   - `jarvis-ide.baseUrl`: Base URL for the API (optional)
   - `jarvis-ide.region`: AWS region for Bedrock (optional)
   - `jarvis-ide.telemetryApiKey`: API key for telemetry (optional)
   - `jarvis-ide.telemetrySetting`: Whether to enable telemetry

## Usage

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
2. Type "Start Jarvis IDE" and select it
3. The Jarvis IDE panel will open
4. Type your question or request and press Enter
5. Wait for the AI to respond

## Development

1. Clone the repository
2. Install dependencies:
    ```bash
   npm install
    ```
3. Start the development server:
    ```bash
   npm run dev
   ```
4. Press F5 to start debugging

## Testing

Run the tests:
    ```bash
npm test
    ```

Run tests with coverage:
```bash
npm run coverage
```

## Building

Build the extension:
    ```bash
npm run build
```

Package the extension:
```bash
npm run package
```

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Run the tests
5. Submit a pull request

## License

MIT
