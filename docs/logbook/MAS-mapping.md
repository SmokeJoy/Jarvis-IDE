# 📊 Mappatura Componenti con Messaging WebView

## 🧩 Task #1 - Milestone #M5 (11/04/2025)

Questa mappatura identifica tutti i componenti frontend che utilizzano meccanismi di comunicazione con l'estensione, categorizzati per livello di type-safety.

### ✅ Componenti Completamente Type-Safe

Questi componenti utilizzano correttamente il pattern Union Dispatcher Type-Safe con `useExtensionMessage()` e type guards appropriati:

| Nome File | Note sul refactoring |
|-----------|----------------------|
| `AgentPanel.tsx` | Già refactorizzato, implementa correttamente `useExtensionMessage()` e `postMessage<AgentMessageUnion>()` |
| `PromptEditor.tsx` | Già refactorizzato, implementa correttamente `useExtensionMessage()` e type guard `isInfoMessage()` |
| `CoderAgentPrompt.tsx` | Utilizza `useExtensionMessage()` e `postMessage<AgentMessageUnion>()` |
| `WebSocketBridge.ts` | Implementa completamente il pattern, con type guards specifici e dispatcher type-safe |
| `SettingsPanel.tsx` | Utilizza `useExtensionMessage()` e `postMessage<SettingsMessageUnion>()` |

### 🟡 Componenti Parzialmente Type-Safe

Questi componenti mostrano un'implementazione parziale di pattern type-safe, ma richiedono miglioramenti:

| Nome File | Note sul refactoring |
|-----------|----------------------|
| `TaskQueueView.tsx` | Utilizza direttamente `vscode.postMessage()` con oggetti strutturati ma senza validazione di tipo |
| `McpView.tsx` | Ha numerose chiamate `postMessage` con tipi definiti ma senza validazione |
| `ChatView.tsx` | Utilizza molte chiamate `postMessage` non sicure, potrebbe beneficiare significativamente di type guards |

### 🔴 Componenti Da Refactorizzare

Componenti che utilizzano comunicazione con l'estensione in modo non type-safe:

| Nome File | Note sul refactoring |
|-----------|----------------------|
| `settingsProvider.tsx` | Usa `vscode.postMessage()` diretto senza tipi di messaggio definiti |
| `FirebaseAuthContext.tsx` | Usa `vscode.postMessage()` con oggetti costruiti inline |
| `BrowserSettingsMenu.tsx` | Implementazione non type-safe di comunicazione verso l'estensione |
| `WelcomeView.tsx` | Usa `window.postMessage()` invece dell'API VS Code |
| `ModelSelector.tsx` | Comunica con l'estensione per la selezione del modello senza type safety |
| `BenchmarkView.tsx` | Comunica con l'estensione tramite `vscodeApi.postMessage()` non sicuro |
| `LogViewer.tsx` | Utilizzo basilare di `vscode.postMessage()` senza validazione di tipo |

## ⚠️ Considerazioni tecniche

### Priorità di refactoring

1. **Alta priorità:**
   - `SettingsPanel.tsx`: Componente cruciale per la configurazione dell'IDE, comunica attivamente con l'estensione
   - `WebSocketBridge.ts`: Già implementa un pattern type-safe ma potrebbe essere ulteriormente migliorato
   - `ChatView.tsx`: Elevato utilizzo di comunicazione con l'estensione, beneficerebbe significativamente di type safety

2. **Media priorità:**
   - `TaskQueueView.tsx`: Componente importante per l'interfaccia MAS
   - `ModelSelector.tsx`: Rilevante per la selezione del modello LLM

3. **Bassa priorità:**
   - Componenti minori con comunicazione limitata (es. `WelcomeView.tsx`)

### Pattern comuni identificati

1. **Invio messaggi diretti:**
   ```typescript
   vscode.postMessage({ type: "tipoMessaggio", payload: { ... } });
   ```

2. **Ascolto messaggi senza discriminazione di tipo:**
   ```typescript
   const handleMessage = (event: MessageEvent) => {
     const message = event.data;
     if (message.type === "tipoRisposta") {
       // Gestione risposta
     }
   };
   ```

3. **Utilizzo di `any` per i tipi di messaggio:**
   ```typescript
   function updateSetting(key: string, value: any) {
     vscode.postMessage({
       type: 'updateSetting',
       key,
       value
     });
   }
   ```

## 🎯 Raccomandazioni per il refactoring

1. Creare interfacce di messaggio estese da `WebviewMessageUnion` per ogni componente
2. Implementare type guards specifici per ogni tipo di messaggio
3. Utilizzare il hook `useExtensionMessage()` per sfruttare `postMessage<T extends WebviewMessageUnion>()`
4. Convertire i controlli di tipo string-based in discriminated unions con type guards
5. Standardizzare la gestione degli errori tramite il pattern di dispatching

## 📌 Conclusioni

`SettingsPanel.tsx` appare come un candidato ideale per il primo refactoring (Task #2), poiché:
1. Ha una comunicazione significativa con l'estensione
2. Non utilizza ancora il pattern Union Dispatcher Type-Safe
3. Ha una struttura ben definita che faciliterebbe l'applicazione del pattern
4. È un componente critico per la configurazione dell'IDE 

![MAS Type-Safe Verified](../badges/mas-type-safe-verified.svg) 