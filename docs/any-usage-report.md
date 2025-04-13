# Report Uso di `any` nel Progetto

## 📊 Analisi Statistica
- **Totale occorrenze**: ~150
- **File interessati**: 45+
- **Categorie principali**:
  - Event Handlers (~30%)
  - Configurazioni (~25%)
  - API Responses (~20%)
  - Test Mocks (~15%)
  - Altri (~10%)

## 🎯 Priorità di Intervento

### 🔴 Critico (Da correggere immediatamente)
1. **src/extension.ts**
   - Linee 44-48: Variabili di stato non tipizzate
   - Sostituire con tipi specifici per ogni funzione

2. **src/services/mcp/handlers/**
   - `codeGenerateHandler.ts` e `searchDocsHandler.ts`: Input/output non tipizzati
   - Necessario definire interfacce specifiche per i parametri

3. **src/types/llm-provider.types.ts**
   - Già corretto con `Record<string, unknown>`
   - Da usare come riferimento per altri file

### 🟡 Medio (Da correggere nella prossima fase)
1. **Event Handlers**
   - Sostituire `(event: any)` con tipi specifici per evento
   - Creare enum per i tipi di evento

2. **Configurazioni**
   - Sostituire `config: any` con interfacce specifiche
   - Usare `Partial<T>` per configurazioni opzionali

### 🟢 Basso (Da correggere in fase finale)
1. **Test Mocks**
   - Mantenere `any` solo dove necessario per testing
   - Usare `as unknown as T` per type casting

## 📝 Piano d'Azione

### Fase 1: Core Types (Giorno 1)
1. Correggere `src/types/`
2. Aggiornare `src/extension.ts`
3. Verifica con `pnpm tsc --noEmit`

### Fase 2: Services (Giorno 2)
1. Correggere handlers in `src/services/`
2. Aggiornare interfacce API
3. Verifica con `pnpm lint --fix`

### Fase 3: Event System (Giorno 3)
1. Tipizzare event handlers
2. Creare enum per event types
3. Verifica con `pnpm verify:all`

## 🔍 Esempi di Correzione

### Da:
```typescript
function handleEvent(event: any): void {
  // ...
}
```

### A:
```typescript
interface EventPayload {
  type: EventType;
  data: unknown;
}

function handleEvent(event: EventPayload): void {
  // ...
}
```

## 📈 Metriche di Progresso
- [ ] Fase 1 completata
- [ ] Fase 2 completata
- [ ] Fase 3 completata
- [ ] Zero warning ESLint
- [ ] Zero errori TypeScript

## 🔄 Processo di Verifica
Dopo ogni modifica:
1. `pnpm lint`
2. `pnpm tsc --noEmit`
3. `pnpm verify:all`

## 📌 Note
- Usare `unknown` invece di `any` dove possibile
- Mantenere `any` solo in test mocks quando necessario
- Documentare ogni decisione di design in commenti 