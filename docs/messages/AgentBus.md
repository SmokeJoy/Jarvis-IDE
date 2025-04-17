# MAS Agent Bus Pattern

## Scopo
Introdurre un pattern agent/pubsub fortemente tipizzato per la messaggistica asincrona all'interno del MAS (Multi-Agent System) tramite un bus centrale condiviso.

## Componenti Principali

- **useAgentBus**: Hook React per la sottoscrizione automatica, con pulizia su dismissione componente. Permette agli agent di ricevere solo eventi del tipo richiesto in modo type-safe.
- **dispatchMASMessage<T>()**: Dispatcher centrale che inoltra agli agenti (subscriber) il messaggio del tipo appropriato.

## Esempio pratico

```ts
import { useAgentBus, dispatchMASMessage } from '@/hooks/useAgentBus';
import type { MasTaskAssigned } from '@shared/types/messages-barrel';

function MyAgentComponent() {
  useAgentBus<MasTaskAssigned>('MAS_TASK_ASSIGNED', (msg) => {
    // Gestisci l'assegnazione task
  });
  // ...
}

// Invio di un messaggio
const newTaskMsg: MasTaskAssigned = { type: 'MAS_TASK_ASSIGNED', taskId: '123', ... };
dispatchMASMessage(newTaskMsg);
```

## Vantaggi
- **Asincronia naturale**: ogni agente ascolta solo i messaggi rilevanti.
- **Type-safety totale**: nessun cast manuale, supporto autocompletamento.
- **Facile estensione**: aggiunta nuovi eventi o agent <100%> decoupled.
- **Pulizia automatica**: nessuna leak di listener/race condition tipica dei bus legacy.

## Notes
- La mappa bus vive in memoria webview, nessuna dipendenza esterna.
- Compatibile out-of-the-box con i tipi definiti in `@shared/types/messages-barrel.ts`.

---

_Per approfondimenti consultare lo snippet e l'implementazione in `src/hooks/useAgentBus.ts`._