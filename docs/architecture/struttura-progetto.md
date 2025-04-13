Linee guida di sviluppo
1. Comprensione dei requisiti
Chiedo chiarimenti prima di scrivere codice.

Cerco di capire il contesto di business/funzionale dietro la feature.

2. Best practices
Codice leggibile, commentato solo se necessario.

Evito l'uso di any a meno che non sia strettamente necessario.

Nomi descrittivi per variabili, funzioni, componenti.

3. TypeScript
Uso forte della tipizzazione: interface, type, enum, Record, Partial, ecc.

Funzioni e componenti sempre tipizzati.

4. React
Uso solo function components con hook (useState, useEffect, useContext, ecc.)

Stato globale gestito con context o librerie come Zustand / Redux se richiesto.

Rendo i componenti riutilizzabili e modulari.

5. Ottimizzazione
Uso React.memo, useMemo, useCallback dove servono.

Implemento lazy loading con React.lazy e Suspense.

6. Testing
Scrivo test con Jest + React Testing Library.

Preparo mock per API e dipendenze esterne.

7. Accessibilità & Responsive Design
Uso semantic HTML, ARIA roles, e supporto per tastiera.

App responsive con Flexbox, Grid, media queries o librerie tipo Tailwind / Chakra UI.

8. Gestione errori
Uso try/catch per codice asincrono e gestione errori in UI.

Validazione input lato client con Zod o Yup.

9. Struttura del codice
Esempio di struttura consigliata:


src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       ├── Button.styles.ts
│       └── Button.types.ts
├── hooks/
│   └── useFetch.ts
├── context/
│   └── AuthContext.tsx
├── pages/
│   └── Home.tsx
├── types/
│   └── api.ts
├── utils/
│   └── formatDate.ts
└── App.tsx
10. Versionamento
Uso Git con commit chiari e semantici.

Uso branching strategy tipo feature/bugfix/hotfix.

Esempio di stile di codice
// components/Button/Button.tsx
import React from 'react';
import { StyledButton } from './Button.styles';
import { ButtonProps } from './Button.types';

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
}) => {
  return (
    <StyledButton onClick={onClick} disabled={disabled} variant={variant}>
      {children}
    </StyledButton>
  );
};

## Tool di sviluppo

### Jarvis Refactor Tool

Jarvis Refactor Tool è uno strumento interno per il monitoraggio e l'analisi del processo di refactoring, in particolare focalizzato sul miglioramento della type safety.

- **Path:** `tools/jarvis-refactor.ts`
- **Scopo:** Analizza il codice TypeScript, individua l'uso di `any` e import `.js`, e genera report.
- **Comandi:**
  - `pnpm refactor:report` - Genera report testuale degli `any` e `.js` imports
  - `pnpm refactor:map` - Genera un file YAML con la mappa dei file da refactorizzare
  - `pnpm refactor:js-imports` - Elenca gli import `.js` nel codebase
  - `pnpm refactor:rename-js` - Aiuta a rinominare gli import `.js` in `.ts`
  - `pnpm type:audit` - Esegue un'analisi completa dei tipi

### Jarvis Dashboard

Jarvis Dashboard è la dashboard di monitoraggio del processo di refactoring che visualizza i progressi e aiuta a prioritizzare i file da sistemare.

- **Path:** `tools/jarvis-dashboard.ts`
- **Scopo:** Visualizza i dati di refactoring in formato CLI o HTML, traccia i trend nel tempo.
- **Comandi:**
  - `pnpm dashboard` - Mostra la dashboard in CLI
  - `pnpm dashboard:html` - Genera una dashboard HTML in `/out/refactor-dashboard.html`
  - `pnpm dashboard:trend` - Aggiorna il file di trend storico

## Output dei tool

I tool di refactoring generano diversi output:

- **refactor-map.yaml**: La mappa dei file da refactorizzare, con informazioni su:
  - Conteggio totale di `any` e import `.js`
  - Lista dei file con `any` e import `.js`, ordinati per priorità
  - Stato di avanzamento (pending, in-progress, completed)

- **refactor-trend.md**: Storico dell'andamento del refactoring, con dati per data.

- **out/refactor-dashboard.html**: Dashboard visiva che mostra i progressi del refactoring in formato HTML.

### Flusso di lavoro consigliato per il refactoring

1. Esegui `pnpm refactor:map` per analizzare il codebase
2. Visualizza la dashboard con `pnpm dashboard` o `pnpm dashboard:html`
3. Scegli file ad alta priorità da refactorizzare
4. Esegui `pnpm dashboard:trend` per registrare i progressi nel tempo
5. Ripeti regolarmente per monitorare l'avanzamento

## Refactoring Tools

### Jarvis Refactor Dashboard

Il progetto include strumenti avanzati per il monitoraggio e la gestione del refactoring:

#### 1. CLI Tool per l'analisi (`tools/jarvis-refactor.ts`)

Questo strumento permette di:
- Identificare tutti gli usage di `any` nella codebase
- Trovare tutti gli import `.js` (da convertire in `.ts`)
- Rinominare file `.js` in `.ts` automaticamente
- Generare una mappa completa del refactoring (`refactor-map.yaml`)

#### 2. Dashboard di monitoraggio (`tools/jarvis-dashboard.ts`)

Fornisce una dashboard per il monitoraggio del refactoring:
- Modalità CLI con statistiche in tempo reale
- Grafico dei trend ASCII
- Generazione di dashboard HTML interattive
- Tracking storico via `refactor-trend.md`

Comandi disponibili:
- `pnpm dashboard` - Visualizza la dashboard in CLI
- `pnpm dashboard:html` - Genera una dashboard HTML interattiva
- `pnpm dashboard:trend` - Aggiorna i dati storici di trend

#### 3. VSCode Overlay per il Refactoring

Per una migliore integrazione nel flusso di lavoro dei developer, è stato implementato un overlay VSCode che offre:

- **Pannello nella activity bar** - Accesso diretto alle funzionalità di refactoring
- **Visualizzazione progresso** - Barra di avanzamento e statistiche in tempo reale
- **Lista file prioritari** - Visualizzazione dei file che necessitano maggiormente di refactoring
- **Azioni rapide** - Esecuzione audit, aggiornamento trend e accesso alla dashboard completa
- **Decorazioni editor** - Evidenziazione visiva degli utilizzi di `any` e import `.js` direttamente nell'editor

Funzionalità principali dell'overlay:
- Monitoraggio in tempo reale del progresso
- Segnalazione immediata dei problemi attraverso decorazioni dell'editor
- Navigazione rapida ai file critici
- Aggiornamento on-demand dei dati di refactoring
- Integrazione completa con i tool CLI esistenti

L'overlay è implementato in:
- `src/integrations/refactor/RefactorOverlayProvider.ts` - Provider principale
- `media/refactor-overlay.css` - Stili dell'interfaccia

Per utilizzare l'overlay:
1. Accedere all'icona "Jarvis Refactor" nella activity bar
2. Visualizzare il pannello "Refactor Tracker"
3. Utilizzare i pulsanti rapidi per eseguire operazioni comuni
4. Cliccare sui file critici per aprirli direttamente nell'editor

### Workflow di Refactoring

Per un refactoring efficace, seguire questo workflow:

1. Eseguire un audit iniziale: `pnpm type:audit`
2. Monitorare i progressi con la dashboard: `pnpm dashboard`
3. Utilizzare l'overlay VSCode per identificare rapidamente i file da refactorizzare
4. Dopo ogni refactoring, aggiornare i dati: `pnpm refactor:map && pnpm dashboard:trend`
5. Verificare il progresso nella dashboard HTML: `pnpm dashboard:html`

Per ogni file refactorizzato:
- Aggiornare la documentazione
- Aggiungere un'entry nel logbook
- Creare un commit con il tag appropriato

```bash
git commit -m "chore(refactor): removed X any from src/path/file.ts [REFACTOR-XX]"
```
