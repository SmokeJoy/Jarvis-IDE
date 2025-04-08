import React, { useState, useEffect, useRef } from 'react';
import './LogViewer.css';
import { useExtensionState } from '../../context/ExtensionStateContext';
import { vscode } from '../../utils/vscode';

// Interfaccia per i log entry
interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

// Colori per i diversi livelli di log
const LOG_COLORS = {
  DEBUG: '#6c757d', // Grigio
  INFO: '#17a2b8',  // Blu chiaro
  WARN: '#ffc107',  // Giallo
  ERROR: '#dc3545', // Rosso
};

// Durata massima della cronologia (per non sovraccaricare la memoria)
const MAX_LOG_HISTORY = 1000;

// Chiave per salvare i log nel localStorage
const LOG_STORAGE_KEY = 'logHistory';

export const LogViewer: React.FC = () => {
  // Stato per i log entries
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [exportFormat, setExportFormat] = useState<'json' | 'text'>('json');
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // Carica i log dal localStorage all'avvio
  useEffect(() => {
    try {
      const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
      if (storedLogs) {
        const parsed: LogEntry[] = JSON.parse(storedLogs);
        setLogs(parsed.slice(-MAX_LOG_HISTORY)); // Protezione da eccessi
      }
    } catch (e) {
      console.warn("Impossibile caricare log da localStorage", e);
    }
  }, []);
  
  // Salva i log nel localStorage quando cambiano
  useEffect(() => {
    try {
      const serialized = JSON.stringify(logs);
      localStorage.setItem(LOG_STORAGE_KEY, serialized);
    } catch (e) {
      console.warn("Impossibile salvare log nel localStorage", e);
    }
  }, [logs]);
  
  // Gestisce messaggi in arrivo dall'estensione
  useEffect(() => {
    if (!vscode) return;

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      // Se è un messaggio di log
      if (message.type === 'log.update' && message.logEntry) {
        setLogs(prevLogs => {
          const newLogs = [...prevLogs, message.logEntry];
          // Limita la lunghezza della cronologia
          return newLogs.slice(-MAX_LOG_HISTORY);
        });
      }
    };

    // Aggiungi event listener
    window.addEventListener('message', handleMessage);
    
    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  // Filtra i log in base ai criteri selezionati
  useEffect(() => {
    setFilteredLogs(logs.filter(log => {
      // Filtro per livello
      if (levelFilter !== 'ALL' && log.level !== levelFilter) {
        return false;
      }
      
      // Filtro per testo
      if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) {
        return false;
      }
      
      return true;
    }));
  }, [logs, filter, levelFilter]);
  
  // Auto-scroll al fondo quando arrivano nuovi log
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);
  
  // Funzione per esportare i log visibili
  const handleExportWebviewLogs = () => {
    try {
      let content = '';
      let filename = '';
      
      if (exportFormat === 'json') {
        content = JSON.stringify(filteredLogs, null, 2);
        filename = 'logs-export.json';
      } else {
        // Formato testuale
        content = filteredLogs.map(log => 
          `[${log.timestamp}] [${log.level}] ${log.message}`
        ).join('\n');
        filename = 'logs-export.txt';
      }
      
      // Crea un elemento <a> per scaricare il file
      const element = document.createElement('a');
      const file = new Blob([content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element); // Required for Firefox
      element.click();
      document.body.removeChild(element);
    } catch (e) {
      console.error('Errore durante l\'esportazione dei log', e);
      if (vscode) {
        vscode.postMessage({
          type: 'error',
          text: `Errore durante l'esportazione dei log: ${e}`
        });
      }
    }
  };
  
  // Pulisce tutti i log
  const handleClearLogs = () => {
    setLogs([]);
    try {
      localStorage.removeItem(LOG_STORAGE_KEY);
    } catch (e) {
      console.warn("Errore nella rimozione log dal localStorage", e);
    }
  };
  
  // Formatta timestamp per essere più leggibile
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch (e) {
      return timestamp;
    }
  };
  
  return (
    <div className="log-viewer">
      <div className="log-controls">
        <div className="log-filters">
          <select 
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="log-level-filter"
          >
            <option value="ALL">Tutti i livelli</option>
            <option value="DEBUG">Debug</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warning</option>
            <option value="ERROR">Error</option>
          </select>
          
          <input
            type="text"
            placeholder="Filtra log..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="log-text-filter"
          />
        </div>
        
        <div className="log-actions">
          <label className="auto-scroll-label">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={() => setAutoScroll(!autoScroll)}
            />
            Auto-scroll
          </label>
          
          <select 
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'json' | 'text')}
            className="export-format-select"
            title="Formato di esportazione"
          >
            <option value="json">JSON</option>
            <option value="text">Text</option>
          </select>
          
          <button 
            onClick={handleClearLogs}
            className="clear-logs-button"
            title="Pulisci i log dalla visualizzazione e dal localStorage"
          >
            🧹 Pulisci
          </button>
          
          <button 
            onClick={handleExportWebviewLogs}
            className="export-webview-logs-button"
            title="Esporta i log filtrati attualmente visualizzati"
          >
            💾 Salvare
          </button>
          
          <button 
            onClick={() => vscode?.postMessage({ type: 'log.export' })}
            className="export-logs-button"
            title="Esporta tutti i log salvati su file"
          >
            📤 Esporta File
          </button>
          
          <button 
            onClick={() => vscode?.postMessage({ type: 'log.openFolder' })}
            className="open-folder-button"
            title="Apri la cartella dei log"
          >
            📁 Apri Cartella
          </button>
        </div>
      </div>
      
      <div className="log-container" ref={logContainerRef}>
        {filteredLogs.length === 0 ? (
          <div className="no-logs">Nessun log da visualizzare</div>
        ) : (
          filteredLogs.map((log, index) => (
            <div 
              key={`${log.timestamp}-${index}`} 
              className={`log-entry log-level-${log.level.toLowerCase()}`}
            >
              <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
              <span 
                className="log-level" 
                style={{ color: LOG_COLORS[log.level] }}
              >
                {log.level}
              </span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 