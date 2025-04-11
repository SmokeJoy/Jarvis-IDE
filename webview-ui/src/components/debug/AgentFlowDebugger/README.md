# AgentFlowDebugger

Un componente React per visualizzare e analizzare i flussi di comunicazione tra agenti in un sistema multi-agente.

![AgentFlowDebugger Screenshot](./screenshot.png)

## Caratteristiche

- **Visualizzazione grafica** del flusso di comunicazione tra agenti utilizzando Mermaid.js
- **Statistiche dettagliate** sul flusso di esecuzione
- **Ispezione degli agenti** con dettagli su stato, durata e messagi d'errore
- **Visualizzazione delle interazioni** tra agenti
- **Esportazione del diagramma** come immagine PNG
- **Supporto per temi chiari e scuri** integrato con le variabili CSS di VSCode
- **Design responsivo** per diverse dimensioni di schermo

## Installazione

```bash
# Se Mermaid.js non è già installato
npm install mermaid
```

## Utilizzo Base

```tsx
import React from 'react';
import AgentFlowDebugger, { AgentFlow } from './components/debug/AgentFlowDebugger';

const MyComponent: React.FC = () => {
  // Dati di esempio del flusso multi-agente
  const agentFlow: AgentFlow = {
    id: 'flow-1',
    name: 'Esempio di Flusso',
    agents: [
      {
        id: 'agent1',
        name: 'Agente 1',
        role: 'Ruolo 1',
        status: 'completed',
        startTime: Date.now() - 5000,
        endTime: Date.now() - 2000
      },
      {
        id: 'agent2',
        name: 'Agente 2',
        role: 'Ruolo 2',
        status: 'running',
        startTime: Date.now() - 3000
      }
    ],
    interactions: [
      {
        id: 'interaction1',
        fromAgentId: 'agent1',
        toAgentId: 'agent2',
        message: 'Messaggio da Agente 1 a Agente 2',
        timestamp: Date.now() - 3500
      }
    ],
    startTime: Date.now() - 5000,
    status: 'running'
  };

  // Gestisce la selezione di un agente
  const handleAgentSelect = (agentId: string) => {
    console.log(`Agente selezionato: ${agentId}`);
  };

  return (
    <div>
      <h1>Visualizzazione Flusso Agenti</h1>
      <AgentFlowDebugger 
        flow={agentFlow} 
        onSelectAgent={handleAgentSelect} 
      />
    </div>
  );
};

export default MyComponent;
```

## Interfacce

Il componente espone le seguenti interfacce TypeScript:

```typescript
interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
  error?: string;
}

interface AgentInteraction {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface AgentFlow {
  id: string;
  name: string;
  description?: string;
  agents: Agent[];
  interactions: AgentInteraction[];
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'error';
  maxTurns?: number;
  currentTurn?: number;
}

interface AgentFlowDebuggerProps {
  flow: AgentFlow;
  onSelectAgent?: (agentId: string) => void;
  className?: string;
}
```

## Props

| Prop | Tipo | Descrizione |
|------|------|-------------|
| `flow` | `AgentFlow` | Oggetto contenente i dati del flusso multi-agente da visualizzare |
| `onSelectAgent` | `(agentId: string) => void` | Callback opzionale chiamato quando un agente viene selezionato |
| `className` | `string` | Classe CSS opzionale da applicare al container principale |

## Funzionalità

### Esportazione del diagramma

Il componente include un pulsante "Esporta PNG" che consente di salvare il diagramma del flusso come immagine PNG. L'immagine esportata:

- Mantiene i colori e lo stile del tema corrente
- Include tutti i nodi e le connessioni
- Preserva la formattazione visiva del diagramma
- Viene salvata automaticamente con il nome del flusso (es. "esempio-di-flusso-diagram.png")

Questa funzionalità è particolarmente utile per:
- Documentare il comportamento del sistema multi-agente
- Condividere il flusso di esecuzione con altri sviluppatori
- Salvare uno snapshot di una sessione di debugging

## Esempi di Utilizzo

### Aggiornamento Dati in Tempo Reale

```tsx
import React, { useState, useEffect } from 'react';
import AgentFlowDebugger, { AgentFlow } from './components/debug/AgentFlowDebugger';

const LiveAgentFlow: React.FC = () => {
  const [flowData, setFlowData] = useState<AgentFlow | null>(null);

  useEffect(() => {
    // Funzione per ottenere i dati aggiornati
    const fetchFlowData = async () => {
      try {
        const response = await fetch('/api/agent-flow');
        const data = await response.json();
        setFlowData(data);
      } catch (error) {
        console.error('Errore nel recupero dei dati:', error);
      }
    };

    // Recupera i dati iniziali
    fetchFlowData();

    // Configura un polling per aggiornamenti
    const intervalId = setInterval(fetchFlowData, 5000);

    return () => clearInterval(intervalId);
  }, []);

  if (!flowData) {
    return <div>Caricamento dati...</div>;
  }

  return <AgentFlowDebugger flow={flowData} />;
};
```

### Integrazione con un Sistema di Notifiche

```tsx
import React from 'react';
import AgentFlowDebugger, { AgentFlow } from './components/debug/AgentFlowDebugger';
import { useNotifications } from './your-notification-system';

const NotifiedAgentFlow: React.FC<{ flow: AgentFlow }> = ({ flow }) => {
  const { showNotification } = useNotifications();

  const handleAgentSelect = (agentId: string) => {
    const agent = flow.agents.find(a => a.id === agentId);
    
    if (agent?.status === 'error') {
      showNotification({
        type: 'error',
        title: `Errore in ${agent.name}`,
        message: agent.error || 'Si è verificato un errore sconosciuto'
      });
    }
  };

  return (
    <AgentFlowDebugger 
      flow={flow} 
      onSelectAgent={handleAgentSelect}
    />
  );
};
```

## Personalizzazione

Il componente utilizza le variabili CSS di VSCode per la stilizzazione, garantendo la compatibilità con i temi dell'IDE. È inoltre possibile estendere gli stili attraverso le classi CSS personalizzate:

```css
/* Esempio di personalizzazione */
.my-custom-debugger .agentflowdebugger-container {
  border-color: #3498db;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.my-custom-debugger .agentflowdebugger-stats {
  background-color: #f8f9fa;
}

/* Personalizzazione del pulsante di esportazione */
.my-custom-debugger .agentflowdebugger-export-button {
  background-color: #4caf50;
}

.my-custom-debugger .agentflowdebugger-export-button:hover {
  background-color: #388e3c;
}
```

Poi nell'uso:

```tsx
<AgentFlowDebugger 
  flow={agentFlow} 
  className="my-custom-debugger"
/>
```

## Test

Il componente include un set completo di test utilizzando Vitest e React Testing Library:

```bash
# Esegui i test
npm run test

# Esegui i test con visualizzazione della copertura
npm run test:coverage
```

## Demo

Per vedere il componente in azione, è disponibile un demo:

```tsx
import { AgentFlowDebuggerDemo } from './components/debug/AgentFlowDebugger';

const App = () => (
  <div>
    <AgentFlowDebuggerDemo />
  </div>
);
```

## Integrazione con Sistemi Multi-Agente

Il componente è ideale per integrarsi con sistemi multi-agente come:

- **MAS Orchestrator**: visualizza il flusso di comunicazione tra agenti orchestrati
- **Pipeline di AI collaborativa**: mostra come diversi modelli AI collaborano
- **Sistemi di debugging**: aiuta a identificare colli di bottiglia e errori nella comunicazione

## Futuro Sviluppo

Funzionalità pianificate per le prossime versioni:

- ✅ Esportazione del diagramma come immagine (implementato)
- Animazione in tempo reale delle interazioni
- Timeline interattiva degli eventi
- Filtri avanzati per le interazioni
- Modalità di visualizzazione espansa/compressa 