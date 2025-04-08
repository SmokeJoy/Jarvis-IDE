import React, { useState } from 'react';
import { VSCodeButton, VSCodeBadge, VSCodeProgressRing, VSCodeDivider } from '@vscode/webview-ui-toolkit/react';
import { Task, TaskStatus, PriorityLevel } from '../types/mas-types';
import { MasCommunicationService } from '../services/MasCommunicationService';
import './TaskQueueVisualizer.css';

interface TaskQueueVisualizerProps {
  activeTask?: Task;
  pendingTasks: Task[];
  completedTasks: Task[];
  isLoading?: boolean;
}

/**
 * Componente che visualizza la coda dei task nel sistema MAS
 */
export const TaskQueueVisualizer: React.FC<TaskQueueVisualizerProps> = ({
  activeTask,
  pendingTasks,
  completedTasks,
  isLoading = false
}) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tutti' | 'attivi' | 'completati'>('tutti');
  
  const masService = MasCommunicationService.getInstance();
  
  /**
   * Formatta la data in formato leggibile
   */
  const formatDate = (dateStr?: Date | string): string => {
    if (!dateStr) return 'N/A';
    
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  /**
   * Restituisce l'etichetta per lo stato del task
   */
  const getTaskStatusLabel = (status: TaskStatus): string => {
    switch(status) {
      case 'pending': return 'In attesa';
      case 'in_progress': return 'In esecuzione';
      case 'completed': return 'Completato';
      case 'failed': return 'Fallito';
      case 'aborted': return 'Annullato';
      default: return 'Sconosciuto';
    }
  };
  
  /**
   * Restituisce il colore per lo stato del task
   */
  const getTaskStatusColor = (status: TaskStatus): string => {
    switch(status) {
      case 'pending': return 'pending';
      case 'in_progress': return 'running';
      case 'completed': return 'completed';
      case 'failed': return 'failed';
      case 'aborted': return 'aborted';
      default: return '';
    }
  };
  
  /**
   * Restituisce l'etichetta per la priorità
   */
  const getPriorityLabel = (priority: PriorityLevel): string => {
    switch(priority) {
      case 'high': return 'Alta';
      case 'normal': return 'Normale';
      case 'low': return 'Bassa';
      default: return 'Normale';
    }
  };
  
  /**
   * Tronca il testo se troppo lungo
   */
  const truncateText = (text: string, maxLength: number = 50): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  /**
   * Gestisce l'espansione/compressione dei dettagli di un task
   */
  const toggleTaskExpand = (taskId: string) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
    }
  };
  
  /**
   * Annulla un task in attesa
   */
  const abortTask = (taskId: string) => {
    if (window.confirm('Sei sicuro di voler annullare questo task?')) {
      // In un'implementazione reale, questo invierebbe una richiesta al backend
      // Per questo MVP, possiamo solo mostrare un messaggio
      alert('Richiesta di annullamento inviata');
    }
  };
  
  /**
   * Filtro per i task in base alla modalità di visualizzazione
   */
  const filteredCompletedTasks = viewMode === 'attivi' ? [] : completedTasks;
  const filteredPendingTasks = viewMode === 'completati' ? [] : pendingTasks;
  const showActiveTask = viewMode !== 'completati';
  
  return (
    <div className="task-queue-visualizer">
      <div className="queue-header">
        <h3>Coda di Task</h3>
        {isLoading && <VSCodeProgressRing className="loading-indicator" />}
        <div className="queue-stats">
          {activeTask && (
            <VSCodeBadge className="queue-badge running">1 attivo</VSCodeBadge>
          )}
          {pendingTasks.length > 0 && (
            <VSCodeBadge className="queue-badge pending">{pendingTasks.length} in attesa</VSCodeBadge>
          )}
          {completedTasks.length > 0 && (
            <VSCodeBadge className="queue-badge completed">{completedTasks.length} completati</VSCodeBadge>
          )}
        </div>
      </div>
      
      <div className="view-mode-selector">
        <button 
          className={`view-mode-button ${viewMode === 'tutti' ? 'active' : ''}`}
          onClick={() => setViewMode('tutti')}
        >
          Tutti
        </button>
        <button 
          className={`view-mode-button ${viewMode === 'attivi' ? 'active' : ''}`}
          onClick={() => setViewMode('attivi')}
        >
          Attivi
        </button>
        <button 
          className={`view-mode-button ${viewMode === 'completati' ? 'active' : ''}`}
          onClick={() => setViewMode('completati')}
        >
          Completati
        </button>
      </div>
      
      {((activeTask && showActiveTask) || pendingTasks.length > 0 || filteredCompletedTasks.length > 0) ? (
        <div className="tasks-list">
          {/* Task attivo */}
          {activeTask && showActiveTask && (
            <div className="task-section">
              <h4 className="section-title">In esecuzione</h4>
              <div className={`task-card ${getTaskStatusColor(activeTask.status)}`}>
                <div className="task-header">
                  <div className="task-title">
                    <span className="task-status-indicator"></span>
                    <span className="task-name">{truncateText(activeTask.instruction.content)}</span>
                  </div>
                  <div className="task-actions">
                    <VSCodeButton
                      appearance="icon"
                      title={expandedTaskId === activeTask.id ? "Nascondi dettagli" : "Mostra dettagli"}
                      onClick={() => toggleTaskExpand(activeTask.id)}
                    >
                      {expandedTaskId === activeTask.id ? '↑' : '↓'}
                    </VSCodeButton>
                  </div>
                </div>
                
                <div className="task-info">
                  <span className="task-info-item">
                    <strong>Agente:</strong> {activeTask.assignedTo || 'Non assegnato'}
                  </span>
                  <span className="task-info-item">
                    <strong>Priorità:</strong> {getPriorityLabel(activeTask.instruction.priority)}
                  </span>
                  <span className="task-info-item">
                    <strong>Stato:</strong> {getTaskStatusLabel(activeTask.status)}
                  </span>
                </div>
                
                {expandedTaskId === activeTask.id && (
                  <div className="task-details">
                    <VSCodeDivider />
                    <div className="detail-item">
                      <strong>Istruzione completa:</strong>
                      <div className="detail-content instruction">
                        {activeTask.instruction.content}
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <strong>Creato:</strong>
                      <div className="detail-content">
                        {formatDate(activeTask.createdAt)}
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <strong>Aggiornato:</strong>
                      <div className="detail-content">
                        {formatDate(activeTask.updatedAt)}
                      </div>
                    </div>
                    
                    {activeTask.result && (
                      <div className="detail-item">
                        <strong>Risultato:</strong>
                        <div className="detail-content result">
                          {activeTask.result.explanation || 'Nessuna spiegazione disponibile'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Task in attesa */}
          {filteredPendingTasks.length > 0 && (
            <div className="task-section">
              <h4 className="section-title">In attesa</h4>
              {filteredPendingTasks.map(task => (
                <div key={task.id} className={`task-card ${getTaskStatusColor(task.status)}`}>
                  <div className="task-header">
                    <div className="task-title">
                      <span className="task-status-indicator"></span>
                      <span className="task-name">{truncateText(task.instruction.content)}</span>
                    </div>
                    <div className="task-actions">
                      <VSCodeButton
                        appearance="icon"
                        title={expandedTaskId === task.id ? "Nascondi dettagli" : "Mostra dettagli"}
                        onClick={() => toggleTaskExpand(task.id)}
                      >
                        {expandedTaskId === task.id ? '↑' : '↓'}
                      </VSCodeButton>
                      <VSCodeButton
                        appearance="icon"
                        title="Annulla task"
                        onClick={() => abortTask(task.id)}
                      >
                        ✖
                      </VSCodeButton>
                    </div>
                  </div>
                  
                  <div className="task-info">
                    <span className="task-info-item">
                      <strong>Agente:</strong> {task.assignedTo || 'Non assegnato'}
                    </span>
                    <span className="task-info-item">
                      <strong>Priorità:</strong> {getPriorityLabel(task.instruction.priority)}
                    </span>
                    <span className="task-info-item">
                      <strong>Stato:</strong> {getTaskStatusLabel(task.status)}
                    </span>
                  </div>
                  
                  {expandedTaskId === task.id && (
                    <div className="task-details">
                      <VSCodeDivider />
                      <div className="detail-item">
                        <strong>Istruzione completa:</strong>
                        <div className="detail-content instruction">
                          {task.instruction.content}
                        </div>
                      </div>
                      
                      <div className="detail-item">
                        <strong>Creato:</strong>
                        <div className="detail-content">
                          {formatDate(task.createdAt)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Task completati */}
          {filteredCompletedTasks.length > 0 && (
            <div className="task-section">
              <h4 className="section-title">Completati</h4>
              {filteredCompletedTasks.map(task => (
                <div key={task.id} className={`task-card ${getTaskStatusColor(task.status)}`}>
                  <div className="task-header">
                    <div className="task-title">
                      <span className="task-status-indicator"></span>
                      <span className="task-name">{truncateText(task.instruction.content)}</span>
                    </div>
                    <div className="task-actions">
                      <VSCodeButton
                        appearance="icon"
                        title={expandedTaskId === task.id ? "Nascondi dettagli" : "Mostra dettagli"}
                        onClick={() => toggleTaskExpand(task.id)}
                      >
                        {expandedTaskId === task.id ? '↑' : '↓'}
                      </VSCodeButton>
                    </div>
                  </div>
                  
                  <div className="task-info">
                    <span className="task-info-item">
                      <strong>Agente:</strong> {task.assignedTo || 'Non assegnato'}
                    </span>
                    <span className="task-info-item">
                      <strong>Completato:</strong> {formatDate(task.completedAt)}
                    </span>
                    <span className="task-info-item">
                      <strong>Stato:</strong> {getTaskStatusLabel(task.status)}
                    </span>
                  </div>
                  
                  {expandedTaskId === task.id && (
                    <div className="task-details">
                      <VSCodeDivider />
                      <div className="detail-item">
                        <strong>Istruzione completa:</strong>
                        <div className="detail-content instruction">
                          {task.instruction.content}
                        </div>
                      </div>
                      
                      {task.result && (
                        <div className="detail-item">
                          <strong>Risultato:</strong>
                          <div className="detail-content result">
                            {task.result.explanation || 'Nessuna spiegazione disponibile'}
                          </div>
                        </div>
                      )}
                      
                      {task.error && (
                        <div className="detail-item error">
                          <strong>Errore:</strong>
                          <div className="detail-content error">
                            {task.error}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="no-tasks-message">
          {isLoading 
            ? 'Caricamento task...' 
            : viewMode === 'completati' 
              ? 'Nessun task completato' 
              : viewMode === 'attivi' 
                ? 'Nessun task attivo' 
                : 'Nessun task presente nella coda'}
        </div>
      )}
    </div>
  );
}; 