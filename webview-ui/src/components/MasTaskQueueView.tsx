import React, { useState, useEffect } from 'react';
import { VSCodeDivider, VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react';
import { TaskQueueView } from './TaskQueueView';
import { MasCommunicationService } from '../services/MasCommunicationService';
import { Task, AgentStatus, TaskQueueState } from '../types/mas-types';
import './MasTaskQueueView.css';

/**
 * Interfaccia per le proprietà del componente MasTaskQueueView
 */
interface MasTaskQueueViewProps {
  initialTasks?: Task[];
  initialAgents?: AgentStatus[];
  isLoading?: boolean;
}

/**
 * Componente principale per la visualizzazione della coda dei task del sistema MAS
 * Integra i componenti TaskQueueView, TaskTable, TaskDetailDrawer e TaskStatsPanel
 */
export const MasTaskQueueView: React.FC<MasTaskQueueViewProps> = ({
  initialTasks = [],
  initialAgents = [],
  isLoading = false
}) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [agents, setAgents] = useState<AgentStatus[]>(initialAgents);
  const [loading, setLoading] = useState<boolean>(isLoading);
  const [queueState, setQueueState] = useState<TaskQueueState | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString());
  
  const masService = MasCommunicationService.getInstance();
  
  // Effetto per caricare i dati iniziali e impostare i listener
  useEffect(() => {
    setLoading(true);
    
    // Funzione di callback per aggiornare lo stato della coda dei task
    const handleTaskQueueUpdate = (data: TaskQueueState) => {
      // Costruisci un array di tutti i task combinando active, pending e completed
      const allTasks: Task[] = [
        ...(data.activeTask ? [data.activeTask] : []),
        ...data.pendingTasks,
        ...data.completedTasks
      ];
      
      setTasks(allTasks);
      setQueueState(data);
      setLastUpdate(new Date().toISOString());
      setLoading(false);
    };
    
    // Funzione di callback per aggiornare lo stato degli agenti
    const handleAgentsUpdate = (agentsData: AgentStatus[]) => {
      setAgents(agentsData);
    };
    
    // Registra i listener per gli aggiornamenti
    masService.subscribe('taskQueueUpdate', handleTaskQueueUpdate);
    masService.subscribe('agentsStatusUpdate', handleAgentsUpdate);
    
    // Richiedi i dati iniziali
    masService.requestTaskQueueStatus();
    masService.requestAgentsStatus();
    
    // Imposta un intervallo per gli aggiornamenti automatici
    const intervalId = setInterval(() => {
      masService.requestTaskQueueStatus();
      masService.requestAgentsStatus();
    }, 5000); // Aggiorna ogni 5 secondi
    
    // Pulizia al momento dello smontaggio
    return () => {
      masService.unsubscribe('taskQueueUpdate', handleTaskQueueUpdate);
      masService.unsubscribe('agentsStatusUpdate', handleAgentsUpdate);
      clearInterval(intervalId);
    };
  }, [masService]);
  
  // Gestisce la richiesta di annullamento di un task
  const handleAbortTask = (taskId: string) => {
    setLoading(true);
    masService.abortTask(taskId);
    
    // Aggiorna lo stato dopo un breve ritardo
    setTimeout(() => {
      masService.requestTaskQueueStatus();
    }, 500);
  };
  
  // Gestisce la richiesta di ri-esecuzione di un task
  const handleRerunTask = (task: Task) => {
    setLoading(true);
    masService.rerunTask(task);
    
    // Aggiorna lo stato dopo un breve ritardo
    setTimeout(() => {
      masService.requestTaskQueueStatus();
    }, 500);
  };
  
  // Gestisce la richiesta di aggiornamento manuale
  const handleRefresh = () => {
    setLoading(true);
    masService.requestTaskQueueStatus();
    masService.requestAgentsStatus();
  };
  
  // Gestisce l'impostazione di filtri
  const handleSetFilters = (filters: { 
    status?: 'all' | 'pending' | 'active' | 'completed' | 'failed',
    priority?: 'all' | 'high' | 'normal' | 'low',
    agentId?: string
  }) => {
    masService.setTaskQueueFilter(
      filters.status,
      filters.priority,
      filters.agentId
    );
    
    // Aggiorna lo stato dopo un breve ritardo
    setTimeout(() => {
      masService.requestTaskQueueStatus();
    }, 200);
  };
  
  // Costruisci l'oggetto di stato per la TaskQueueView
  const buildTaskQueueState = () => {
    if (!queueState) {
      return {
        queueState: {
          total: tasks.length,
          pending: tasks.filter(t => t.status === 'pending').length,
          active: tasks.find(t => t.status === 'in_progress') || null,
          completed: tasks.filter(t => t.status === 'completed').length,
          failed: tasks.filter(t => t.status === 'failed' || t.status === 'aborted').length,
          priorityDistribution: {
            high: tasks.filter(t => t.instruction.priority === 'high'),
            normal: tasks.filter(t => t.instruction.priority === 'normal'),
            low: tasks.filter(t => t.instruction.priority === 'low')
          }
        },
        agents,
        timestamp: lastUpdate
      };
    }
    
    // Mappa lo stato della coda al formato richiesto dalla TaskQueueView
    return {
      queueState: {
        total: tasks.length,
        pending: queueState.pendingTasks.length,
        active: queueState.activeTask || null,
        completed: queueState.completedTasks.filter(t => t.status === 'completed').length,
        failed: queueState.completedTasks.filter(t => t.status === 'failed' || t.status === 'aborted').length,
        priorityDistribution: {
          high: tasks.filter(t => t.instruction.priority === 'high'),
          normal: tasks.filter(t => t.instruction.priority === 'normal'),
          low: tasks.filter(t => t.instruction.priority === 'low')
        }
      },
      agents,
      timestamp: lastUpdate
    };
  };

  // Mappa gli stati dei task tra i formati
  const mapTaskStatus = (status: string): 'pending' | 'active' | 'completed' | 'failed' | 'aborted' => {
    switch (status) {
      case 'in_progress': return 'active';
      case 'pending': return 'pending';
      case 'completed': return 'completed';
      case 'failed': return 'failed';
      case 'aborted': return 'aborted';
      default: return 'pending';
    }
  };

  // Mappa i task al formato richiesto dal componente TaskQueueView
  const mappedTasks = tasks.map(task => ({
    ...task,
    status: mapTaskStatus(task.status)
  }));
  
  return (
    <div className="mas-task-queue-view">
      <header className="mas-task-queue-header">
        <h2>Coda dei Task</h2>
        <div className="mas-task-queue-actions">
          <button className="refresh-button" onClick={handleRefresh} disabled={loading}>
            {loading ? <VSCodeProgressRing /> : 'Aggiorna'}
          </button>
          <span className="last-update">
            Ultimo aggiornamento: {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        </div>
      </header>
      
      <VSCodeDivider />
      
      <div className="mas-task-queue-content">
        {loading && tasks.length === 0 ? (
          <div className="loading-container">
            <VSCodeProgressRing />
            <p>Caricamento della coda dei task...</p>
          </div>
        ) : (
          <TaskQueueView 
            initialState={buildTaskQueueState()}
            onAbortTask={handleAbortTask}
            onRerunTask={handleRerunTask}
            onRefresh={handleRefresh}
            onSetFilters={handleSetFilters}
          />
        )}
      </div>
    </div>
  );
}; 