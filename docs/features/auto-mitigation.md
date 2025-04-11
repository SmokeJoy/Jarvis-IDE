# 🛡️ Auto-Mitigation System

## Panoramica
Il sistema di Auto-Mitigation è un componente predittivo che monitora in tempo reale lo stato dei provider e attiva automaticamente strategie di fallback quando rileva pattern di errore ricorrenti.

## Architettura

### Componenti Principali
- `useAutoMitigation`: Hook principale per la logica di mitigazione
- `AutoMitigationToast`: UI per notifiche in tempo reale
- `TimelineEntry`: Integrazione con badge di stato

### Flusso di Dati
1. Monitoraggio continuo dei provider
2. Analisi predittiva basata su:
   - Trend di fallimento
   - Pattern storici
   - Stato attuale
3. Calcolo confidenza (0-1)
4. Trigger automatico se confidenza > 0.8

## API

### useAutoMitigation
```typescript
interface AutoMitigationState {
  isActive: boolean;
  currentProvider: string;
  nextProvider: string | null;
  confidence: number;
  lastMitigation: Date | null;
}
```

### Eventi
- `auto-mitigation:triggered`: Emesso quando viene attivata una mitigazione
- `auto-mitigation:completed`: Emesso al completamento della mitigazione

## Configurazione
```typescript
// Soglia di confidenza per attivazione
const CONFIDENCE_THRESHOLD = 0.8;

// Intervallo di valutazione (ms)
const EVALUATION_INTERVAL = 5000;
```

## Best Practices
1. Monitorare il log degli eventi per debug
2. Aggiustare la soglia di confidenza in base al contesto
3. Testare con diversi pattern di errore
4. Documentare le decisioni di mitigazione

## Test
```typescript
// Esempio test unitario
test('should trigger mitigation when confidence > threshold', () => {
  const { result } = renderHook(() => useAutoMitigation());
  // ... implementazione test
});
```

## Troubleshooting
1. Verificare che l'EventBus sia correttamente configurato
2. Controllare i log per pattern di errore non rilevati
3. Aggiustare la soglia di confidenza se necessario 