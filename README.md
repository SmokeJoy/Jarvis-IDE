# Jarvis IDE

Assistente AI per sviluppatori con supporto import/export sessioni.

## Caratteristiche principali

- Assistente di codifica alimentato da intelligenza artificiale
- Supporto per più provider LLM:
  - OpenAI
  - Anthropic (Claude)
  - LM Studio (locale)
  - Ollama (locale)
  - OpenRouter (multi-modello)
- Interfaccia moderna e intuitiva
- Sistema di import/export completo
- Validazione integrata delle sessioni

## Sistema di Import/Export

Jarvis-IDE include un sistema avanzato di importazione ed esportazione che permette di salvare e condividere le sessioni di chat in vari formati.

### Formati supportati

- **JSON**: Formato standard per la memorizzazione dei dati.
- **YAML**: Formato leggibile per configurazioni e dati strutturati.
- **Markdown**: Testo formattato ideale per la documentazione.
- **CSV**: Formato tabellare per l'analisi dei dati.
- **HTML**: Visualizzazione completa con stili CSS integrati.

### Comandi disponibili

- **Jarvis: Importa Sessione di Chat**: Importa una sessione da un file esistente.
- **Jarvis: Esporta Sessione di Chat**: Esporta la sessione corrente in uno dei formati supportati.
- **Jarvis: Valida Sessione di Chat**: Verifica che una sessione rispetti lo schema previsto.
- **Jarvis: Converti Formato Sessione**: Converte una sessione da un formato all'altro.
- **Jarvis: Anteprima Sessione**: Visualizza un'anteprima del contenuto della sessione.

### Utilizzo

1. Avvia il comando desiderato dal menu dei comandi (Ctrl+Shift+P).
2. Seleziona il formato o il file appropriato quando richiesto.
3. Scegli dove salvare o da dove caricare il file.

## Requisiti

- VS Code 1.85.0 o superiore
- Node.js 18 o superiore

## Installazione

1. Scarica l'ultimo file `.vsix` dalla [pagina delle release](https://github.com/jarvis-ide/jarvis-ide/releases)
2. Installa in VS Code:
   - Apri VS Code
   - Premi `Ctrl+Shift+P` (Windows/Linux) o `Cmd+Shift+P` (macOS)
   - Digita "Installa da VSIX" e selezionalo
   - Scegli il file `.vsix` scaricato

## Configurazione

1. Ottieni una chiave API dal tuo provider preferito
2. Apri le impostazioni di VS Code
3. Cerca "Jarvis IDE"
4. Configura le seguenti impostazioni:
   - `jarvis-ide.provider`: Il provider AI da utilizzare
   - `jarvis-ide.apiKey`: La tua chiave API
   - `jarvis-ide.baseUrl`: URL base per l'API (opzionale)
   - `jarvis-ide.use_docs`: Attiva/disattiva l'uso della documentazione
   - `jarvis-ide.coder_mode`: Attiva/disattiva la modalità sviluppatore
   - `jarvis-ide.multi_agent`: Attiva/disattiva il sistema multi-agente

## Utilizzo

1. Premi `Ctrl+Shift+P` (Windows/Linux) o `Cmd+Shift+P` (macOS)
2. Digita "Avvia Jarvis IDE" e selezionalo
3. Il pannello Jarvis IDE si aprirà
4. Digita la tua domanda o richiesta e premi Invio
5. Attendi la risposta dell'AI

## Sviluppo

1. Clona il repository
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```
4. Premi F5 per avviare il debug

## Testing

Esegui i test:
```bash
npm test
```

Esegui i test con coverage:
```bash
npm run coverage
```

## Building

Compila l'estensione:
```bash
npm run build
```

Pacchettizza l'estensione:
```bash
npx vsce package
```

## Contribuire

1. Forka il repository
2. Crea un nuovo branch
3. Effettua le tue modifiche
4. Esegui i test
5. Invia una pull request

## Licenza

MIT
