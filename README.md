![SafeMessage Status](reports/badges/safe-message-status.svg)

# Jarvis IDE

The first autonomous open source IDE controlled by an AI team, capable of working with any LLM model, both local (Ollama, LM Studio, LMDeploy, GGML) and API-based (OpenAI, Anthropic, Gemini, Groq, etc.).

## Features

- 🧠 **Universal LLM Support**: Works with any local or cloud-based LLM
- 🤖 **Multi-Agent System**: Team of specialized AI agents working together
- 🔄 **Remote Control**: Control via Telegram Bot or WebSocket (coming soon)
- 🎨 **Modern UI**: Beautiful and intuitive interface with dark/light themes
- 🛠️ **Extensible**: Modular architecture for easy customization
- 📚 **Documentation**: Extensive documentation and development guidelines

## Requirements

- VS Code 1.85.0 or higher
- Node.js 18.0.0 or higher
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/jarvis-ide/jarvis-ide.git
cd jarvis-ide
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Install the extension in VS Code:
- Press F5 to start debugging
- Or package the extension: `npm run package`
- Install the .vsix file: Code → Extensions → ... → Install from VSIX

## Configuration

1. Open VS Code settings
2. Search for "Jarvis IDE"
3. Configure your preferred AI provider and API key

## Development

- `npm run watch` - Watch for changes and rebuild
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code

## Documentation

- [Architecture](docs/architecture/README.md)
- [Development Guide](docs/development-guide.md)
- [API Reference](docs/api-reference.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT - see [LICENSE](LICENSE) for details.

## Support

- [GitHub Issues](https://github.com/jarvis-ide/jarvis-ide/issues)
- [Discussions](https://github.com/jarvis-ide/jarvis-ide/discussions)

## Acknowledgments

Special thanks to:
- The VS Code team for the amazing editor
- All LLM providers for their powerful models
- The open source community

---

Made with ❤️ by the Jarvis IDE AI Team

# Strumenti di Refactoring per la Sicurezza dei Messaggi

Il progetto include un set completo di strumenti per garantire la sicurezza tipizzata dei messaggi di chat. Questi strumenti aiutano a:

- ✅ Convertire oggetti message raw in chiamate `createSafeMessage`
- ✅ Correggere chiamate nidificate a `createSafeMessage`
- ✅ Aggiungere gli import mancanti per `createSafeMessage`
- ✅ Verificare la correttezza di tutte le chiamate

## Script Disponibili

```bash
# Verifica lo stato attuale della sicurezza dei messaggi
pnpm refactor:check-safety

# Correggi le chiamate nidificate a createSafeMessage
pnpm ts-node scripts/refactor/fix-nested-safe-message.ts

# Aggiungi gli import mancanti per createSafeMessage
pnpm ts-node scripts/refactor/add-missing-imports.ts

# Esegui tutte le correzioni in sequenza (fix + check)
pnpm refactor:fix-all

# Genera il badge di stato per il README
pnpm refactor:badge
```

## Report di Sicurezza

I report di sicurezza vengono generati automaticamente nella cartella `reports/`:
- Report JSON completo con dettagli di tutti i problemi
- Report CSV per facile importazione in fogli di calcolo

## Integrazione CI

Il progetto include un workflow GitHub Actions che verifica automaticamente la sicurezza dei messaggi:
- Esegue i controlli di sicurezza ad ogni push/PR
- Genera e aggiorna il badge di stato
- Carica il report come artefatto
- Fa fallire il workflow se sono presenti problemi di sicurezza
