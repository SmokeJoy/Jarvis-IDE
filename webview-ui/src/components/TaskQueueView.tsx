import React, { useState, useEffect } from 'react';
import { TaskQueueState, AgentStatus, Task } from '../../shared/types';
import TaskTable from './TaskTable';
import TaskDetailDrawer from './TaskDetailDrawer';
import TaskStatsPanel from './TaskStatsPanel';
import { vscode } from '../utilities/vscode';
import './TaskQueueView.css';

/**
 * Stato dell'applicazione
 */
interface AppState {
  queueState: TaskQueueState | null;
  agents: AgentStatus[];
  selectedTask: Task | null;
  isDetailDrawerOpen: boolean;
  statusFilter: 'all' | 'pending' | 'active' | 'completed' | 'failed';
  priorityFilter: 'all' | 'high' | 'normal' | 'low';
  agentFilter: string;
  lastUpdate: string;
}

/**
 * Componente principale per la visualizzazione della coda dei task
 */
const TaskQueueView: React.FC = () => {
  // Stato dell'applicazione
  const [state, setState] = useState<AppState>({
    queueState: null,
    agents: [],
    selectedTask: null,
    isDetailDrawerOpen: false,
    statusFilter: 'all',
    priorityFilter: 'all',
    agentFilter: 'all',
    lastUpdate: ''
  });
  
  /**
   * Effetto per registrare il listener dei messaggi
   */
  useEffect(() => {
    // Funzione per gestire i messaggi dal backend
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      if (message.type === 'mas.taskQueue/update') {
        setState(prevState => ({
          ...prevState,
          queueState: message.payload.queueState,
          agents: message.payload.agents,
          lastUpdate: new Date().toLocaleTimeString()
        }));
      }
    };
    
    // Registra il listener
    window.addEventListener('message', handleMessage);
    
    // Richiedi un aggiornamento iniziale
    requestUpdate();
    
    // Pulisci il listener alla smontaggio
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  /**
   * Richiede un aggiornamento dello stato della coda
   */
  const requestUpdate = () => {
    vscode.postMessage({
      type: 'mas.taskQueue/requestUpdate',
      payload: {}
    });
  };
  
  /**
   * Gestisce l'apertura del drawer dei dettagli di un task
   * @param task Task selezionato
   */
  const handleTaskSelect = (task: Task) => {
    setState(prevState => ({
      ...prevState,
      selectedTask: task,
      isDetailDrawerOpen: true
    }));
  };
  
  /**
   * Chiude il drawer dei dettagli
   */
  const handleCloseDetail = () => {
    setState(prevState => ({
      ...prevState,
      isDetailDrawerOpen: false
    }));
  };
  
  /**
   * Annulla un task
   * @param taskId ID del task da annullare
   */
  const handleAbortTask = (taskId: string) => {
    vscode.postMessage({
      type: 'mas.taskQueue/abortTask',
      payload: { taskId }
    });
  };
  
  /**
   * Ri-esegue un task completato o fallito
   * @param task Task da ri-eseguire
   */
  const handleRerunTask = (task: Task) => {
    vscode.postMessage({
      type: 'mas.taskQueue/rerunTask',
      payload: { task }
    });
  };
  
  /**
   * Imposta i filtri per la tabella dei task
   * @param filters Filtri da applicare
   */
  const handleSetFilters = (filters: { 
    status?: 'all' | 'pending' | 'active' | 'completed' | 'failed';
    priority?: 'all' | 'high' | 'normal' | 'low';
    agentId?: string;
  }) => {
    setState(prevState => ({
      ...prevState,
      statusFilter: filters.status || prevState.statusFilter,
      priorityFilter: filters.priority || prevState.priorityFilter,
      agentFilter: filters.agentId || prevState.agentFilter
    }));
    
    // Invia anche al backend (per eventuali elaborazioni lato server)
    vscode.postMessage({
      type: 'mas.taskQueue/setFilter',
      payload: {
        status: filters.status,
        priority: filters.priority,
        agentId: filters.agentId
      }
    });
  };
  
  /**
   * Filtra i task in base ai filtri selezionati
   * @param tasks Array di task da filtrare
   * @returns Array di task filtrati
   */
  const filterTasks = (tasks: Task[]): Task[] => {
    return tasks.filter(task => {
      // Filtra per stato
      if (state.statusFilter !== 'all' && task.status !== state.statusFilter) {
        return false;
      }
      
      // Filtra per priorità
      if (state.priorityFilter !== 'all' && 
          task.instruction.priority !== state.priorityFilter) {
        return false;
      }
      
      // Filtra per agente
      if (state.agentFilter !== 'all' && task.assignedTo !== state.agentFilter) {
        return false;
      }
      
      return true;
    });
  };
  
  /**
   * Prepara tutti i task da mostrare nella tabella
   * @returns Array combinato di task filtrati
   */
  const getFilteredTasks = (): Task[] => {
    if (!state.queueState) {
      return [];
    }
    
    // Raccogli tutti i task da tutte le fonti
    const allTasks: Task[] = [];
    
    // Task attivo
    if (state.queueState.active) {
      allTasks.push(state.queueState.active);
    }
    
    // Task in attesa per ogni priorità
    if (state.queueState.priorityDistribution) {
      allTasks.push(...state.queueState.priorityDistribution.high);
      allTasks.push(...state.queueState.priorityDistribution.normal);
      allTasks.push(...state.queueState.priorityDistribution.low);
    }
    
    // Applica i filtri
    return filterTasks(allTasks);
  };
  
  // Se non c'è stato, mostra un loader
  if (!state.queueState) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Caricamento della coda dei task...</p>
      </div>
    );
  }
  
  return (
    <div className="task-queue-container">
      <header className="task-queue-header">
        <h1>Coda dei Task - Sistema Multi-Agent</h1>
        <div className="task-queue-actions">
          <button onClick={requestUpdate} className="refresh-button">
            Aggiorna
          </button>
          <span className="last-update">
            Ultimo aggiornamento: {state.lastUpdate}
          </span>
        </div>
      </header>
      
      <div className="task-queue-content">
        <div className="task-queue-main">
          <TaskStatsPanel 
            queueState={state.queueState} 
            agents={state.agents} 
          />
          
          <TaskTable 
            tasks={getFilteredTasks()}
            activeTaskId={state.queueState.active?.id}
            onTaskSelect={handleTaskSelect}
            onAbortTask={handleAbortTask}
            onRerunTask={handleRerunTask}
            onSetFilters={handleSetFilters}
            statusFilter={state.statusFilter}
            priorityFilter={state.priorityFilter}
            agentFilter={state.agentFilter}
            agents={state.agents}
          />
        </div>
        
        {state.isDetailDrawerOpen && state.selectedTask && (
          <TaskDetailDrawer 
            task={state.selectedTask}
            agents={state.agents}
            onClose={handleCloseDetail}
            onAbortTask={handleAbortTask}
            onRerunTask={handleRerunTask}
          />
        )}
      </div>
    </div>
  );
};

export default TaskQueueView; 