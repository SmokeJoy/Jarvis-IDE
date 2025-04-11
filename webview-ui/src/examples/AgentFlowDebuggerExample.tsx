import React, { useState } from 'react';
import AgentFlowDebugger from '../components/debug/AgentFlowDebugger';

/**
 * Esempio di utilizzo del componente AgentFlowDebugger
 */
const AgentFlowDebuggerExample: React.FC = () => {
  const [showTimeline, setShowTimeline] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // ID di sessione di esempio
  const sessionId = 'example-session-123';
  
  return (
    <div className="example-container">
      <h1>Esempio di AgentFlowDebugger</h1>
      
      <div className="example-options">
        <label>
          <input 
            type="checkbox" 
            checked={showTimeline} 
            onChange={(e) => setShowTimeline(e.target.checked)} 
          />
          Mostra Timeline
        </label>
        
        <label>
          <input 
            type="checkbox" 
            checked={showStats} 
            onChange={(e) => setShowStats(e.target.checked)} 
          />
          Mostra Statistiche
        </label>
        
        <label>
          <input 
            type="checkbox" 
            checked={autoRefresh} 
            onChange={(e) => setAutoRefresh(e.target.checked)} 
          />
          Aggiornamento Automatico
        </label>
      </div>
      
      {/* Demo del componente AgentFlowDebugger */}
      <div className="example-component">
        <AgentFlowDebugger 
          sessionId={sessionId}
          showTimeline={showTimeline}
          showStats={showStats}
          autoRefresh={autoRefresh}
          refreshInterval={5000}
        />
      </div>
      
      {/* Documentazione */}
      <div className="example-documentation">
        <h2>Documentazione del Componente</h2>
        
        <h3>Props</h3>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Default</th>
              <th>Descrizione</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>sessionId</td>
              <td>string</td>
              <td>-</td>
              <td>ID della sessione per identificare il flusso</td>
            </tr>
            <tr>
              <td>autoRefresh</td>
              <td>boolean</td>
              <td>true</td>
              <td>Attiva l'aggiornamento automatico dei dati</td>
            </tr>
            <tr>
              <td>refreshInterval</td>
              <td>number</td>
              <td>5000</td>
              <td>Intervallo di aggiornamento in millisecondi</td>
            </tr>
            <tr>
              <td>showHeader</td>
              <td>boolean</td>
              <td>true</td>
              <td>Mostra l'intestazione con titolo e informazioni</td>
            </tr>
            <tr>
              <td>showStats</td>
              <td>boolean</td>
              <td>true</td>
              <td>Mostra la sezione statistiche</td>
            </tr>
            <tr>
              <td>showTimeline</td>
              <td>boolean</td>
              <td>true</td>
              <td>Mostra la timeline delle interazioni</td>
            </tr>
          </tbody>
        </table>
        
        <h3>Utilizzo</h3>
        <pre>
{`import AgentFlowDebugger from './components/debug/AgentFlowDebugger';

// Esempio base
<AgentFlowDebugger sessionId="session-123" />

// Esempio completo
<AgentFlowDebugger 
  sessionId="session-123"
  autoRefresh={true}
  refreshInterval={5000}
  showHeader={true}
  showStats={true}
  showTimeline={true}
/>`}
        </pre>
      </div>
    </div>
  );
};

export default AgentFlowDebuggerExample; 