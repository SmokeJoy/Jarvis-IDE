# Struttura del Progetto MAS - Jarvis IDE

## Panoramica

Questo documento descrive la struttura del progetto per il sistema Multi-Agent (MAS) di Jarvis IDE. Il sistema MAS è stato progettato per fornire un'architettura modulare e flessibile per l'interazione tra diversi agenti specializzati.

## Struttura delle Directory

```
jarvis-ide/
│
├── src/
│   ├── core/
│   │   ├── command-center.ts         # Centralina di comando per tutto il sistema MAS
│   │   └── mas/
│   │       ├── agents/               # Implementazioni degli agenti
│   │       │   ├── ExecutorAgent.ts  # Agente per eseguire azioni sul workspace
│   │       │   ├── AnalystAgent.ts   # Agente per analizzare codice e pattern
│   │       │   ├── CoordinatorAgent.ts  # Agente per coordinare task e workflow
│   │       │   └── index.ts          # Punto di ingresso per tutti gli agenti
│   │       ├── models/               # Modelli dati per il sistema MAS
│   │       └── utils/                # Utility per il sistema MAS
│   │
│   ├── extension.ts                  # Punto di ingresso principale dell'estensione VS Code
│   └── ...                           # Altri file dell'estensione
│
├── docs/
│   ├── diaries/                      # Diari di sviluppo
│   │   └── dev-ai1.md                # Diario dello sviluppatore AI1
│   ├── architecture/                 # Documentazione dell'architettura
│   │   └── struttura-progetto.md     # Questo documento
│   └── notebooklm/                   # Notebook per LLM
│       ├── mas-architecture.md       # Descrizione dell'architettura MAS
│       └── orchestrators.md          # Dettagli sugli orchestratori
│
├── scripts/
│   ├── cleanup-jest.ts               # Script per rimuovere i file Jest legacy
│   └── finalize-vsix.ts              # Script per compilare il pacchetto VSIX
│
└── ... (altri file e directory)
```

## Componenti Principali

### Command Center

Il Command Center (`src/core/command-center.ts`) è il nucleo del sistema MAS. È responsabile per:

- Registrazione e gestione degli agenti
- Instradamento dei comandi tra gli agenti
- Monitoraggio dello stato di salute degli agenti tramite heartbeat
- Gestione degli eventi di sistema

Il Command Center implementa il pattern Singleton per garantire un'unica istanza in tutta l'applicazione.

### Agenti

Gli agenti (`src/core/mas/agents/`) sono componenti specializzati che eseguono compiti specifici. I principali agenti sono:

1. **ExecutorAgent**: Esegue azioni concrete sul workspace e il file system
   - Manipolazione di file
   - Esecuzione di comandi nel terminale
   - Operazioni sul workspace

2. **AnalystAgent**: Analizza il codice e identifica pattern
   - Analisi statica del codice
   - Rilevamento di problemi potenziali
   - Suggerimenti di ottimizzazione

3. **CoordinatorAgent**: Coordina le attività tra gli agenti
   - Gestione dei task
   - Assegnazione di subtask agli agenti appropriati
   - Monitoraggio dell'avanzamento dei task

### Integrazione con VS Code

L'integrazione con VS Code è gestita nel file `src/extension.ts`, che:

- Inizializza il sistema MAS durante l'attivazione dell'estensione
- Registra i comandi VS Code per interagire con il MAS
- Termina correttamente il sistema MAS durante la disattivazione

## Flusso di Comunicazione

```
[VS Code Extension] <---> [Command Center] <---> [Agents]
```

1. L'estensione VS Code invia comandi al Command Center
2. Il Command Center inoltra i comandi agli agenti appropriati
3. Gli agenti eseguono le azioni e inviano i risultati al Command Center
4. Il Command Center notifica l'estensione VS Code o altri agenti dei risultati

## Documentazione

La documentazione del sistema MAS è organizzata in diverse categorie:

- **Diari di sviluppo**: Registro delle attività svolte durante lo sviluppo
- **Architettura**: Descrizione della struttura e dei componenti
- **Notebook LLM**: Documentazione dettagliata per modelli linguistici

## Script Utili

- **cleanup-jest.ts**: Rimuove i file di test Jest legacy e aggiorna le dipendenze
- **finalize-vsix.ts**: Prepara e compila il pacchetto VSIX finale

## Note per gli Sviluppatori

- Gli agenti sono progettati per essere autonomi e comunicare solo attraverso il Command Center
- Il sistema è estensibile: nuovi agenti possono essere aggiunti facilmente
- Eventi e comandi seguono un formato standardizzato per la comunicazione
- Il protocollo heartbeat garantisce che gli agenti non operativi vengano rilevati

## Test con Vitest

### Struttura dei test

La suite di test del progetto è stata migrata da Jest a Vitest. I test sono organizzati nelle seguenti directory:

- `src/__tests__/`: Test unitari per il core dell'estensione VSCode
- `webview-ui/src/__tests__/`: Test per i componenti React della UI
- `src/__tests__/stable/`: Test convertiti con successo e funzionanti
- `src/__tests__/problematic/`: Test che richiedono ulteriore attenzione

### Configurazione Vitest

La configurazione principale di Vitest si trova in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/stable/**/*.test.ts'],
    exclude: ['src/__tests__/problematic/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/test/**',
        'src/**/*.d.ts',
        'src/index.ts',
      ],
      all: true,
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      }
    },
    setupFiles: ['src/test/setup-vitest.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    deps: {
      external: ['vscode'],
      interopDefault: true
    }
  },
  resolve: {
    alias: {
      'vscode': path.resolve(__dirname, 'src/test/__mocks__/vscode.ts'),
      '@': path.resolve(__dirname, './src'),
    },
    conditions: ['node']
  },
});
```

Per la webview UI, esiste una configurazione separata in `webview-ui/vitest.config.ts` che utilizza l'ambiente `jsdom`.

### Mock e ambiente di test

#### Mock del modulo `vscode`

Il modulo `vscode` viene mockato in `src/test/__mocks__/vscode.ts`:

```typescript
import { vi } from 'vitest';

export const window = {
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  createWebviewPanel: vi.fn(() => ({
    webview: {
      html: '',
      onDidReceiveMessage: vi.fn(),
      postMessage: vi.fn(),
    },
    reveal: vi.fn(),
    onDidDispose: vi.fn(),
    dispose: vi.fn(),
  })),
};
// altre esportazioni...
```

#### Ambiente DOM per test React

Per i test React, utilizziamo `jsdom` con configurazioni aggiuntive in `webview-ui/src/tests/setup-vitest.ts`, inclusi:

- Mock per `window.navigator.language`
- Override di `window.matchMedia`
- Cleanup automatico dopo ogni test
- Configurazione dei componenti virtualized

#### Importazioni di moduli

I moduli vengono importati esplicitamente nei file di test. In caso di moduli con esportazioni default, è importante importarli correttamente:

```typescript
// Esempio di import corretto
import { vi, describe, it, expect } from 'vitest';
import { functionToTest } from '../path/to/module';
```

#### Migrazione da Jest a Vitest

Le principali differenze nella sintassi:

| Jest | Vitest |
|------|--------|
| `jest.fn()` | `vi.fn()` |
| `jest.mock(...)` | `vi.mock(...)` |
| `jest.requireMock(...)` | `vi.importMock(...)` |
| `jest.MockedFunction<T>` | `ReturnType<typeof vi.fn<T>>` |
| `@testing-library/jest-dom` | `@testing-library/jest-dom/vitest` |

### [2025-04-10] Test E2E & Profiling MASOrchestrator

- Misurazione tempo di esecuzione per ogni agente
- Validazione footprint di memoria per sessione
- Simulazione multi-sessione: isolamento verificato

> Strumenti: process.memoryUsage, performance.now, orchestrator.run()

I test di profiling includono:

1. **Profiling delle prestazioni degli agenti**:
   - Misurazione del tempo di esecuzione individuale per ogni agente
   - Registrazione delle metriche di performance nel contesto dell'agente
   - Verifica che le performance siano tracciabili e diagnosticabili

2. **Monitoraggio del footprint di memoria**:
   - Rilevamento dell'utilizzo della memoria durante l'esecuzione di più turni
   - Verifica che la crescita della memoria sia controllata e prevedibile
   - Imposizione di limiti ragionevoli per la crescita della memoria

3. **Test di isolamento tra sessioni**:
   - Esecuzione parallela di più sessioni con dati diversi
   - Verifica che le sessioni mantengano i propri contesti isolati
   - Conferma che i dati di una sessione non influenzino altre sessioni

Questi test garantiscono che il sistema MAS rimanga performante e scalabile anche con carichi di lavoro elevati e utilizzo prolungato.

---

*Documento creato da: AI1 | Jarvis MAS v1.0.0 Init*