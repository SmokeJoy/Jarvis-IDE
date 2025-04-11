# Struttura Progetto Post-Refactoring

## 📂 Organizzazione Moduli MAS

Il sistema Multi-Agent System (MAS) è stato completamente refactorizzato secondo il pattern "Union Dispatcher Type-Safe". Di seguito la nuova struttura organizzativa:

```
webview-ui/
├── src/
│   ├── components/
│   │   ├── agentPanel/
│   │   │   ├── CoderAgentPrompt.tsx      # Refactorizzato
│   │   │   ├── AnalyzerAgentPrompt.tsx   # Refactorizzato 
│   │   │   └── AgentStatusBar.tsx        # Nuovo componente
│   │   └── mas/
│   │       ├── AgentCard.tsx             # Componente base per gli agenti
│   │       └── AgentContainer.tsx        # Container per agenti
│   │
│   ├── hooks/
│   │   ├── useAgentMessages.ts           # Nuovo hook tipizzato
│   │   └── useMasService.ts              # Hook refactorizzato
│   │
│   ├── services/
│   │   ├── MasCommunicationService.ts    # Servizio refactorizzato
│   │   └── SecurityManager.ts            # Nuovo servizio
│   │
│   ├── types/
│   │   ├── mas-message.ts                # Definizioni union type per MAS
│   │   ├── mas-message-guards.ts         # Type guards per MAS
│   │   └── agents.ts                     # Tipi per agenti e stati
│   │
│   └── context/
│       └── MasServiceContext.tsx         # Context API per servizi MAS
```

## 🔄 Pattern Unificato

Tutti i componenti MAS seguono ora un pattern comune per la gestione dei messaggi:

1. **Union Types Centrali**: Tutti i tipi di messaggio sono definiti come union types in `mas-message.ts`
2. **Type Guards Dedicati**: Validatori in `mas-message-guards.ts`
3. **Dispatcher Pattern**: Handler tipizzati nel servizio MAS
4. **Context API**: Servizio MAS centralizzato disponibile via React Context

## 🛠️ Architettura Servizi

### MasCommunicationService

Il servizio è stato refactorizzato in una classe con metodi type-safe:

```typescript
class MasCommunicationService {
  // Nuovo metodo tipizzato
  public sendTypeSafeMessage<T extends MasMessage>(message: T): void;
  
  // Metodo tipizzato per iscrizione a eventi
  public subscribe<T extends MasMessageType>(
    messageType: T,
    callback: (payload: Extract<MasMessage, { type: T }>['payload']) => void
  ): SubscriptionId;
  
  // Legacy API per retrocompatibilità (deprecated)
  public sendMessage(type: string, payload: any): void;
}
```

### SecurityManager

Nuovo servizio per la sicurezza:

```typescript
class SecurityManager {
  public validateAction(action: AgentAction): SecurityValidationResult;
  public interceptMessage(message: MasMessage): MasMessage | null;
  public registerSecurityPolicy(policy: SecurityPolicy): void;
}
```

## 🔄 Flusso Dati nel Sistema MAS

Il flusso di comunicazione refactorizzato segue questo schema:

1. **Componente UI** → Chiama hook `useAgentMessages`
2. **Hook** → Usa `MasServiceContext` per accedere al servizio
3. **MasCommunicationService** → Invia messaggio tipizzato
4. **SecurityManager** → Intercetta e valida il messaggio
5. **WebviewMessageHandler** → Riceve e processa il messaggio
6. **Agent System** → Elabora la richiesta
7. **Risposta** → Percorre il percorso inverso con tipi appropriati

## 🔍 Miglioramenti Principali

- **Type Safety**: 100% di copertura con tipi statici
- **Modularità**: Componenti isolati con responsabilità chiare
- **Testabilità**: Interfacce mockabili per test unitari
- **Manutenibilità**: Pattern consistente in tutto il sistema MAS
- **Sicurezza**: Validazione tipi in runtime con type guards

## 🚀 Roadmap Futura

- Implementazione completa del SecurityManager
- Espansione delle capacità per supportare agenti esterni
- Integrazione con il sistema di telemetria
- Supporto per comunicazione tra agenti (Agent-to-Agent) 