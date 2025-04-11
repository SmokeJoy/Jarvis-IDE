# Visix - Monitoraggio e Analytics per Fallback Strategy

Visix è un modulo React per il monitoraggio e l'analisi delle strategie di fallback in tempo reale. Fornisce componenti e hook per visualizzare metriche, audit e analytics.

## 📦 Installazione

```bash
npm install @jarvis/visix
```

## 🚀 Componenti

### FallbackMonitorPanel
Monitor in tempo reale delle metriche dei provider.

```tsx
import { FallbackMonitorPanel } from '@jarvis/visix';

<FallbackMonitorPanel 
  eventBus={eventBus}
  strategy={strategy}
  providers={providers}
/>
```

### FallbackAuditPanel
Pannello di audit con cronologia e analytics.

```tsx
import { FallbackAuditPanel } from '@jarvis/visix';

<FallbackAuditPanel 
  eventBus={eventBus}
  strategy={strategy}
  providers={providers}
/>
```

### FallbackChartPanel
Visualizzazione grafica delle metriche storiche.

```tsx
import { FallbackChartPanel } from '@jarvis/visix';

<FallbackChartPanel audits={audits} />
```

## 🎣 Hooks

### useFallbackTelemetry
Hook per il monitoraggio in tempo reale.

```tsx
import { useFallbackTelemetry } from '@jarvis/visix';

const { metrics, events } = useFallbackTelemetry({
  eventBus,
  strategy,
  providers
});
```

### useFallbackAudit
Hook per la gestione degli audit.

```tsx
import { useFallbackAudit } from '@jarvis/visix';

const { 
  snapshots, 
  exportEvents, 
  exportSnapshots 
} = useFallbackAudit({
  eventBus,
  strategy,
  providers
});
```

### useFallbackChartData
Hook per la trasformazione dei dati per i grafici.

```tsx
import { useFallbackChartData } from '@jarvis/visix';

const { 
  latency, 
  successRate, 
  cost, 
  usage 
} = useFallbackChartData(audits);
```

## 📊 Metriche Supportate

- **Latenza**: Tempo di risposta medio per provider
- **Successi/Fallimenti**: Tasso di successo delle richieste
- **Costi**: Costi totali per provider
- **Volume**: Numero di richieste per provider

## 🎨 Personalizzazione

Tutti i componenti supportano la personalizzazione tramite props:
- `className` per stili personalizzati
- Props specifiche per ogni componente
- Tema scuro predefinito

## 📝 Esempio Completo

```tsx
import React from 'react';
import {
  FallbackMonitorPanel,
  FallbackAuditPanel,
  useFallbackTelemetry,
  useFallbackAudit
} from '@jarvis/visix';

const App = () => {
  const { metrics } = useFallbackTelemetry({ eventBus, strategy, providers });
  const { snapshots } = useFallbackAudit({ eventBus, strategy, providers });

  return (
    <div className="grid grid-cols-2 gap-4">
      <FallbackMonitorPanel 
        eventBus={eventBus}
        strategy={strategy}
        providers={providers}
      />
      <FallbackAuditPanel 
        eventBus={eventBus}
        strategy={strategy}
        providers={providers}
      />
    </div>
  );
};
```

## 📚 Documentazione API

Vedi [API Documentation](API.md) per dettagli completi su:
- Props dei componenti
- Tipi TypeScript
- Configurazione avanzata

## 🤝 Contribuire

1. Fork il repository
2. Crea un branch per la feature
3. Commit le modifiche
4. Push al branch
5. Crea una Pull Request

## 📄 Licenza

MIT 