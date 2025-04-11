# Struttura dei Moduli di Jarvis IDE

Questo documento descrive la struttura e l'organizzazione dei principali moduli dell'estensione Jarvis IDE.

## Panoramica dell'Architettura

Jarvis IDE è organizzato in moduli funzionali che gestiscono diversi aspetti dell'estensione. Ogni modulo ha responsabilità specifiche e interagisce con altri moduli attraverso interfacce ben definite.

## Moduli Principali

### 🧩 Modulo: `src/integrations/checkpoints`

Questo modulo gestisce l'integrazione con i sistemi di versionamento (es. Git) per il tracciamento dei checkpoint di sviluppo IA.

#### File principali:
- `CheckpointTracker.ts`: logica per la gestione dello stato corrente dei checkpoint tramite Git
- `CheckpointGitOperations.ts`: operazioni di basso livello Git
- `CheckpointExclusions.ts`: logica per la gestione di file/directory esclusi
- `CheckpointMigration.ts`: supporto per migrazione dati da versioni precedenti
- `CheckpointUtils.ts`: utilità condivise per le operazioni sui checkpoint

#### Funzionalità principali:
- Creazione e gestione di repository Git "shadow" per tracciare i checkpoint
- Esclusione intelligente di file non necessari (build artifacts, media, etc.)
- Migrazione da versioni precedenti del sistema di checkpoint
- Integrazione con il sistema di storage globale dell'estensione

#### Refactoring recente:
- ✅ Correzione manuale delle importazioni SimpleGit (`import { simpleGit, SimpleGit }`)
- ✅ Rimozione `.js.js` da tutte le importazioni
- ✅ Allineamento con standard `ESM` per Node 18+

#### Interazioni con altri moduli:
- Utilizza `src/utils/fs.js` per operazioni sul filesystem
- Integrazione con `src/services/telemetry/TelemetryService.js` per tracciamento eventi
- Dipendenze esterne: simple-git, globby

#### Pattern architetturali:
- Shadow Git Repository: repository Git isolato per tracciare i checkpoint senza interferire con il repository principale dell'utente
- File Filtering: sistema di esclusione di file basato su pattern per evitare di tracciare file non necessari
- Checkpoint Operations: operazioni di creazione, confronto e ripristino dei checkpoint