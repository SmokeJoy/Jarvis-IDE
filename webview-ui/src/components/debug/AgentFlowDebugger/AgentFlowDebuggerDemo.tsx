import React, { useState } from 'react';
import AgentFlowDebugger from './AgentFlowDebugger';

// Dati di esempio per il diagramma
const sampleAgentFlow = {
  id: 'flow-1',
  name: 'Task Planning and Execution Flow',
  description: 'Demo di un flusso multi-agente per pianificazione ed esecuzione',
  agents: [
    {
      id: 'planner',
      name: 'Task Planner',
      role: 'Pianifica i passaggi necessari',
      status: 'completed' as const,
      startTime: Date.now() - 8000,
      endTime: Date.now() - 6000
    },
    {
      id: 'analyzer',
      name: 'Code Analyzer',
      role: 'Analizza il codice esistente',
      status: 'completed' as const,
      startTime: Date.now() - 6000,
      endTime: Date.now() - 3000
    },
    {
      id: 'generator',
      name: 'Code Generator',
      role: 'Genera il nuovo codice',
      status: 'running' as const,
      startTime: Date.now() - 3000
    },
    {
      id: 'tester',
      name: 'Code Tester',
      role: 'Testa il codice generato',
      status: 'idle' as const
    },
    {
      id: 'reviewer',
      name: 'Code Reviewer',
      role: 'Rivede il codice per migliorarlo',
      status: 'error' as const,
      startTime: Date.now() - 5000,
      endTime: Date.now() - 4000,
      error: 'Impossibile inizializzare l\'agente di revisione a causa di una mancanza di permessi.'
    }
  ],
  interactions: [
    {
      id: 'i1',
      fromAgentId: 'planner',
      toAgentId: 'analyzer',
      message: 'Analizza il modulo di autenticazione in src/auth/*.ts e identifica eventuali problemi di sicurezza',
      timestamp: Date.now() - 6500
    },
    {
      id: 'i2',
      fromAgentId: 'analyzer',
      toAgentId: 'planner',
      message: 'Analisi completata. Identificati 3 possibili miglioramenti di sicurezza nel modulo di autenticazione.',
      timestamp: Date.now() - 5500
    },
    {
      id: 'i3',
      fromAgentId: 'planner',
      toAgentId: 'generator',
      message: 'Genera un patch per migliorare la sicurezza nel modulo di autenticazione, implementando: 1) Timeout token, 2) Rate limiting, 3) Validazione input',
      timestamp: Date.now() - 5000
    },
    {
      id: 'i4',
      fromAgentId: 'planner',
      toAgentId: 'reviewer',
      message: 'Prepara una checklist di sicurezza per la revisione del codice in src/auth/*',
      timestamp: Date.now() - 4500
    },
    {
      id: 'i5',
      fromAgentId: 'generator',
      toAgentId: 'planner',
      message: 'Generato il codice per timeout token e rate limiting. Sto lavorando sulla validazione degli input...',
      timestamp: Date.now() - 1500
    }
  ],
  startTime: Date.now() - 8000,
  status: 'running' as const,
  maxTurns: 10,
  currentTurn: 3
};

/**
 * Componente demo per illustrare l'utilizzo di AgentFlowDebugger
 */
const AgentFlowDebuggerDemo: React.FC = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [exportCount, setExportCount] = useState(0);
  
  // Gestisce la selezione di un agente
  const handleAgentSelection = (agentId: string) => {
    console.log(`Agente selezionato: ${agentId}`);
    setSelectedAgentId(agentId);
  };

  // Monitora le esportazioni per dimostrare la funzionalità
  const handleExport = () => {
    // Questo hook sarebbe usato in un'applicazione reale per tracciare gli export
    // In questa demo, incrementiamo semplicemente un contatore
    setExportCount(prev => prev + 1);
  };
  
  return (
    <div className="demo-container">
      <h1>Demo Debugger Flusso Agenti</h1>
      <p>
        Questo è un esempio di utilizzo del componente AgentFlowDebugger per visualizzare 
        e analizzare flussi di esecuzione in un sistema multi-agente.
      </p>
      <div className="demo-instructions">
        <h3>Interazioni disponibili:</h3>
        <ul>
          <li><strong>Visualizzazione:</strong> Il diagramma mostra il flusso tra agenti con codici colore per gli stati</li>
          <li><strong>Selezione:</strong> Clicca su qualsiasi nodo nel grafico per visualizzare i dettagli dell'agente</li>
          <li><strong>Esportazione:</strong> Usa il pulsante "Esporta PNG" per salvare il diagramma come immagine</li>
        </ul>
      </div>
      
      {/* Utilizzo del componente con i dati di esempio */}
      <AgentFlowDebugger 
        flow={sampleAgentFlow} 
        onSelectAgent={handleAgentSelection}
      />
      
      <div className="demo-info">
        <h3>Agente selezionato: {selectedAgentId || 'Nessuno'}</h3>
        <p>
          Il componente ti permette di visualizzare il flusso di comunicazione tra agenti, 
          monitorare lo stato di esecuzione e ispezionare i messaggi scambiati.
        </p>
        {exportCount > 0 && (
          <div className="export-info">
            <p>Hai esportato il diagramma {exportCount} volte. Controlla la cartella dei download!</p>
          </div>
        )}
      </div>
      
      <div className="demo-controls">
        <h3>Presto disponibili:</h3>
        <ul>
          <li>Aggiornamento in tempo reale dello stato degli agenti</li>
          <li>Timeline di esecuzione dettagliata</li>
          <li>Filtri per tipo di interazione</li>
          <li>Supporto per diagrammi annidati (sotto-agenti)</li>
        </ul>
      </div>
      
      <style jsx>{`
        .demo-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .demo-instructions {
          margin-bottom: 20px;
          padding: 16px;
          border-radius: 4px;
          background-color: var(--vscode-editor-background);
          border: 1px solid var(--vscode-panel-border);
        }
        
        .demo-info, .demo-controls {
          margin-top: 24px;
          padding: 16px;
          border-radius: 4px;
          border: 1px solid var(--vscode-panel-border, #e0e0e0);
        }
        
        .demo-controls ul {
          padding-left: 20px;
        }
        
        .export-info {
          margin-top: 12px;
          padding: 8px 12px;
          background-color: var(--vscode-editorInfo-background, #e8f4fd);
          border-radius: 4px;
          border-left: 3px solid var(--vscode-editorInfo-foreground, #1a85ff);
        }
      `}</style>
    </div>
  );
};

export default AgentFlowDebuggerDemo; 