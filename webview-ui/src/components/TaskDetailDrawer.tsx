import React from 'react';
import { Task, AgentStatus } from '../../shared/types';
import './TaskDetailDrawer.css';

interface TaskDetailDrawerProps {
  task: Task;
  agents: AgentStatus[];
  onClose: () => void;
  onAbortTask: (taskId: string) => void;
  onRerunTask: (task: Task) => void;
}

/**
 * Componente per la visualizzazione dei dettagli di un task
 */
const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  agents,
  onClose,
  onAbortTask,
  onRerunTask
}) => {
  /**
   * Ottiene il nome di un agente dato il suo ID
   * @param agentId ID dell'agente
   * @returns Nome dell'agente o stringa predefinita
   */
  const getAgentName = (agentId: string | undefined): string => {
    if (!agentId) return 'Non assegnato';
    
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : `Agente ${agentId}`;
  };
  
  /**
   * Ottiene la classe CSS per lo stato di un task
   * @param status Stato del task
   * @returns Classe CSS
   */
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'active': return 'status-active';
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      case 'failed': return 'status-failed';
      case 'aborted': return 'status-aborted';
      default: return '';
    }
  };
  
  /**
   * Ottiene l'icona per lo stato di un task
   * @param status Stato del task
   * @returns Icona rappresentativa
   */
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'active': return '⚡';
      case 'pending': return '⏳';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'aborted': return '🛑';
      default: return '❓';
    }
  };
  
  /**
   * Ottiene l'etichetta per lo stato di un task
   * @param status Stato del task
   * @returns Etichetta localizzata
   */
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active': return 'Attivo';
      case 'pending': return 'In attesa';
      case 'completed': return 'Completato';
      case 'failed': return 'Fallito';
      case 'aborted': return 'Annullato';
      default: return 'Sconosciuto';
    }
  };
  
  /**
   * Ottiene la priorità formattata
   * @param priority Priorità del task
   * @returns Etichetta formattata
   */
  const getPriorityLabel = (priority: string | undefined): JSX.Element => {
    let className = '';
    let label = 'Normale';
    
    switch (priority) {
      case 'high':
        className = 'priority-high';
        label = 'Alta';
        break;
      case 'normal':
        className = 'priority-normal';
        label = 'Normale';
        break;
      case 'low':
        className = 'priority-low';
        label = 'Bassa';
        break;
    }
    
    return <span className={`priority-badge ${className}`}>{label}</span>;
  };
  
  /**
   * Formatta la data in formato leggibile
   * @param date Data da formattare
   * @returns Stringa formattata
   */
  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'N/D';
    
    const d = new Date(date);
    return d.toLocaleString();
  };
  
  /**
   * Formatta la durata di un task
   * @returns Durata formattata
   */
  const formatDuration = (): string => {
    if (!task.startedAt) return 'N/D';
    
    const start = new Date(task.startedAt).getTime();
    const end = task.completedAt 
      ? new Date(task.completedAt).getTime() 
      : new Date().getTime();
    
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) {
      return `${seconds} secondi`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes} minuti e ${remainingSeconds} secondi`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours} ore, ${remainingMinutes} minuti e ${remainingSeconds} secondi`;
  };
  
  /**
   * Verifica se un task può essere annullato
   * @returns true se può essere annullato
   */
  const canAbortTask = (): boolean => {
    return task.status === 'active' || task.status === 'pending';
  };
  
  /**
   * Verifica se un task può essere ri-eseguito
   * @returns true se può essere ri-eseguito
   */
  const canRerunTask = (): boolean => {
    return task.status === 'completed' || task.status === 'failed' || task.status === 'aborted';
  };
  
  /**
   * Gestisce l'annullamento del task
   */
  const handleAbort = () => {
    onAbortTask(task.id);
    onClose();
  };
  
  /**
   * Gestisce la ri-esecuzione del task
   */
  const handleRerun = () => {
    onRerunTask(task);
    onClose();
  };
  
  return (
    <div className="task-detail-drawer">
      <div className="task-detail-header">
        <h2>Dettagli Task</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="task-detail-content">
        <div className="task-detail-section">
          <div className="task-detail-id">
            <label>ID:</label>
            <span>{task.id}</span>
          </div>
          
          <div className="task-detail-status">
            <label>Stato:</label>
            <span className={getStatusClass(task.status)}>
              {getStatusIcon(task.status)} {getStatusLabel(task.status)}
            </span>
          </div>
          
          <div className="task-detail-priority">
            <label>Priorità:</label>
            <span>{getPriorityLabel(task.instruction.priority)}</span>
          </div>
          
          <div className="task-detail-agent">
            <label>Agente:</label>
            <span>{getAgentName(task.assignedTo)}</span>
          </div>
        </div>
        
        <div className="task-detail-section">
          <div className="task-detail-dates">
            <div>
              <label>Creato:</label>
              <span>{formatDate(task.createdAt)}</span>
            </div>
            
            {task.startedAt && (
              <div>
                <label>Iniziato:</label>
                <span>{formatDate(task.startedAt)}</span>
              </div>
            )}
            
            {task.completedAt && (
              <div>
                <label>Completato:</label>
                <span>{formatDate(task.completedAt)}</span>
              </div>
            )}
            
            {task.startedAt && (
              <div>
                <label>Durata:</label>
                <span>{formatDuration()}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="task-detail-section">
          <h3>Istruzione</h3>
          <div className="task-detail-instruction">
            {task.instruction.content}
          </div>
          
          {task.instruction.style && (
            <div className="task-detail-style">
              <label>Stile richiesto:</label>
              <span>{task.instruction.style}</span>
            </div>
          )}
        </div>
        
        {task.result && (
          <div className="task-detail-section">
            <h3>Risultato</h3>
            
            <div className="task-detail-explanation">
              <label>Spiegazione:</label>
              <p>{task.result.explanation}</p>
            </div>
            
            {task.result.suggestions && task.result.suggestions.length > 0 && (
              <div className="task-detail-suggestions">
                <label>Suggerimenti:</label>
                <ul>
                  {task.result.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {task.result.modifiedFiles && task.result.modifiedFiles.length > 0 && (
              <div className="task-detail-files">
                <label>File modificati:</label>
                <ul>
                  {task.result.modifiedFiles.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {task.result.createdFiles && task.result.createdFiles.length > 0 && (
              <div className="task-detail-files">
                <label>File creati:</label>
                <ul>
                  {task.result.createdFiles.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {task.result.warnings && task.result.warnings.length > 0 && (
              <div className="task-detail-warnings">
                <label>Avvisi:</label>
                <ul>
                  {task.result.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {task.error && (
          <div className="task-detail-section task-detail-error">
            <h3>Errore</h3>
            <p>{task.error}</p>
          </div>
        )}
        
        <div className="task-detail-actions">
          <button className="task-detail-close" onClick={onClose}>
            Chiudi
          </button>
          
          {canAbortTask() && (
            <button className="task-detail-abort" onClick={handleAbort}>
              Annulla Task
            </button>
          )}
          
          {canRerunTask() && (
            <button className="task-detail-rerun" onClick={handleRerun}>
              Ri-esegui Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailDrawer; 