import React, { useState } from 'react';
import { Task, AgentStatus } from '../../shared/types';
import './TaskTable.css';

interface TaskTableProps {
  tasks: Task[];
  activeTaskId?: string;
  agents: AgentStatus[];
  statusFilter: 'all' | 'pending' | 'active' | 'completed' | 'failed';
  priorityFilter: 'all' | 'high' | 'normal' | 'low';
  agentFilter: string;
  onTaskSelect: (task: Task) => void;
  onAbortTask: (taskId: string) => void;
  onRerunTask: (task: Task) => void;
  onSetFilters: (filters: { 
    status?: 'all' | 'pending' | 'active' | 'completed' | 'failed';
    priority?: 'all' | 'high' | 'normal' | 'low';
    agentId?: string;
  }) => void;
}

/**
 * Componente per la visualizzazione tabulare dei task
 */
const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  activeTaskId,
  agents,
  statusFilter,
  priorityFilter,
  agentFilter,
  onTaskSelect,
  onAbortTask,
  onRerunTask,
  onSetFilters
}) => {
  // Stato per l'ordinamento
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({
    key: 'createdAt',
    direction: 'descending'
  });
  
  /**
   * Gestisce l'ordinamento delle colonne
   * @param key Chiave da ordinare
   */
  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };
  
  /**
   * Ordina l'array dei task
   * @param tasksList Lista dei task da ordinare
   * @returns Lista ordinata dei task
   */
  const sortedTasks = React.useMemo(() => {
    const sortableTasks = [...tasks];
    
    if (sortConfig.key) {
      sortableTasks.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        // Gestione speciale per campi annidati
        switch (sortConfig.key) {
          case 'priority':
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            aValue = priorityOrder[a.instruction.priority || 'normal'];
            bValue = priorityOrder[b.instruction.priority || 'normal'];
            break;
          case 'agent':
            aValue = a.assignedTo || '';
            bValue = b.assignedTo || '';
            break;
          case 'status':
            const statusOrder = { active: 0, pending: 1, completed: 2, failed: 3, aborted: 4 };
            aValue = statusOrder[a.status];
            bValue = statusOrder[b.status];
            break;
          case 'content':
            aValue = a.instruction.content;
            bValue = b.instruction.content;
            break;
          default:
            aValue = (a as any)[sortConfig.key];
            bValue = (b as any)[sortConfig.key];
        }
        
        // Gestione speciale per le date
        if (sortConfig.key === 'createdAt' || sortConfig.key === 'completedAt') {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortableTasks;
  }, [tasks, sortConfig]);
  
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
   * @param task Task di cui calcolare la durata
   * @returns Durata formattata
   */
  const formatDuration = (task: Task): string => {
    if (!task.startedAt) return 'N/D';
    
    const start = new Date(task.startedAt).getTime();
    const end = task.completedAt 
      ? new Date(task.completedAt).getTime() 
      : new Date().getTime();
    
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  /**
   * Verifica se un task può essere annullato
   * @param task Task da verificare
   * @returns true se può essere annullato
   */
  const canAbortTask = (task: Task): boolean => {
    return task.status === 'active' || task.status === 'pending';
  };
  
  /**
   * Verifica se un task può essere ri-eseguito
   * @param task Task da verificare
   * @returns true se può essere ri-eseguito
   */
  const canRerunTask = (task: Task): boolean => {
    return task.status === 'completed' || task.status === 'failed' || task.status === 'aborted';
  };
  
  /**
   * Gestisce la selezione del filtro per stato
   * @param e Evento change della select
   */
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSetFilters({ status: e.target.value as any });
  };
  
  /**
   * Gestisce la selezione del filtro per priorità
   * @param e Evento change della select
   */
  const handlePriorityFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSetFilters({ priority: e.target.value as any });
  };
  
  /**
   * Gestisce la selezione del filtro per agente
   * @param e Evento change della select
   */
  const handleAgentFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSetFilters({ agentId: e.target.value });
  };
  
  // Gestisce il caso in cui non ci sono task
  if (sortedTasks.length === 0) {
    return (
      <div className="task-table-empty">
        <div className="task-table-filters">
          <div className="filter-group">
            <label>Stato:</label>
            <select value={statusFilter} onChange={handleStatusFilterChange}>
              <option value="all">Tutti</option>
              <option value="active">Attivi</option>
              <option value="pending">In attesa</option>
              <option value="completed">Completati</option>
              <option value="failed">Falliti</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Priorità:</label>
            <select value={priorityFilter} onChange={handlePriorityFilterChange}>
              <option value="all">Tutte</option>
              <option value="high">Alta</option>
              <option value="normal">Normale</option>
              <option value="low">Bassa</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Agente:</label>
            <select value={agentFilter} onChange={handleAgentFilterChange}>
              <option value="all">Tutti</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="no-tasks-message">
          <p>
            {statusFilter === 'all' && priorityFilter === 'all' && agentFilter === 'all'
              ? 'Nessun task presente nella coda'
              : 'Nessun task corrisponde ai filtri selezionati'}
          </p>
          <p>
            <button onClick={() => onSetFilters({ status: 'all', priority: 'all', agentId: 'all' })}>
              Rimuovi tutti i filtri
            </button>
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="task-table-container">
      <div className="task-table-filters">
        <div className="filter-group">
          <label>Stato:</label>
          <select value={statusFilter} onChange={handleStatusFilterChange}>
            <option value="all">Tutti</option>
            <option value="active">Attivi</option>
            <option value="pending">In attesa</option>
            <option value="completed">Completati</option>
            <option value="failed">Falliti</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Priorità:</label>
          <select value={priorityFilter} onChange={handlePriorityFilterChange}>
            <option value="all">Tutte</option>
            <option value="high">Alta</option>
            <option value="normal">Normale</option>
            <option value="low">Bassa</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Agente:</label>
          <select value={agentFilter} onChange={handleAgentFilterChange}>
            <option value="all">Tutti</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="task-table-scroll">
        <table className="task-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('status')} className={sortConfig.key === 'status' ? `sorted-${sortConfig.direction}` : ''}>
                Stato {sortConfig.key === 'status' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('priority')} className={sortConfig.key === 'priority' ? `sorted-${sortConfig.direction}` : ''}>
                Priorità {sortConfig.key === 'priority' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('content')} className={sortConfig.key === 'content' ? `sorted-${sortConfig.direction}` : ''}>
                Istruzione {sortConfig.key === 'content' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('agent')} className={sortConfig.key === 'agent' ? `sorted-${sortConfig.direction}` : ''}>
                Agente {sortConfig.key === 'agent' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('createdAt')} className={sortConfig.key === 'createdAt' ? `sorted-${sortConfig.direction}` : ''}>
                Creato {sortConfig.key === 'createdAt' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </th>
              <th>Durata</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map(task => (
              <tr 
                key={task.id} 
                className={`task-row ${task.id === activeTaskId ? 'task-active' : ''}`}
                onClick={() => onTaskSelect(task)}
              >
                <td className={getStatusClass(task.status)}>
                  <span className="status-icon">{getStatusIcon(task.status)}</span>
                  <span className="status-text">{getStatusLabel(task.status)}</span>
                </td>
                <td>{getPriorityLabel(task.instruction.priority)}</td>
                <td className="task-content">
                  <div className="task-content-truncate">
                    {task.instruction.content.length > 60
                      ? `${task.instruction.content.substring(0, 60)}...`
                      : task.instruction.content
                    }
                  </div>
                </td>
                <td>{getAgentName(task.assignedTo)}</td>
                <td>{formatDate(task.createdAt)}</td>
                <td>{formatDuration(task)}</td>
                <td className="task-actions">
                  {canAbortTask(task) && (
                    <button 
                      className="task-action-button abort-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAbortTask(task.id);
                      }}
                      title="Annulla task"
                    >
                      Annulla
                    </button>
                  )}
                  
                  {canRerunTask(task) && (
                    <button 
                      className="task-action-button rerun-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRerunTask(task);
                      }}
                      title="Ri-esegui task"
                    >
                      Ri-esegui
                    </button>
                  )}
                  
                  <button 
                    className="task-action-button view-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskSelect(task);
                    }}
                    title="Visualizza dettagli"
                  >
                    Dettagli
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskTable; 