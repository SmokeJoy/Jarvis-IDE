import React from 'react';
import { TaskQueueState, AgentStatus } from '../../shared/types';
import './TaskStatsPanel.css';

interface TaskStatsPanelProps {
  queueState: TaskQueueState;
  agents: AgentStatus[];
}

/**
 * Componente per la visualizzazione delle statistiche della coda dei task
 */
const TaskStatsPanel: React.FC<TaskStatsPanelProps> = ({ queueState, agents }) => {
  // Calcola la percentuale di completamento dei task
  const calculateCompletionRate = (): string => {
    const total = queueState.completed + queueState.failed;
    
    if (total === 0) {
      return 'N/D';
    }
    
    const rate = (queueState.completed / total) * 100;
    return `${rate.toFixed(1)}%`;
  };
  
  // Calcola la distribuzione percentuale della priorità
  const calculatePriorityDistribution = (): { high: number; normal: number; low: number } => {
    const highCount = queueState.priorityDistribution.high.length;
    const normalCount = queueState.priorityDistribution.normal.length;
    const lowCount = queueState.priorityDistribution.low.length;
    const total = highCount + normalCount + lowCount;
    
    if (total === 0) {
      return { high: 0, normal: 0, low: 0 };
    }
    
    return {
      high: Math.round((highCount / total) * 100),
      normal: Math.round((normalCount / total) * 100),
      low: Math.round((lowCount / total) * 100)
    };
  };
  
  const priorityDistribution = calculatePriorityDistribution();
  
  // Calcola il numero di agenti attivi
  const activeAgentsCount = agents.filter(a => a.isActive).length;
  
  return (
    <div className="task-stats-panel">
      <div className="task-stats-header">
        <h2>Statistiche della Coda dei Task</h2>
      </div>
      
      <div className="task-stats-grid">
        <div className="task-stats-card">
          <div className="task-stats-card-title">Stato Attuale</div>
          <div className="task-stats-card-content">
            <div className="task-stats-metric">
              <div className="task-stats-metric-value">{queueState.pending}</div>
              <div className="task-stats-metric-label">In attesa</div>
            </div>
            
            <div className="task-stats-metric">
              <div className="task-stats-metric-value">
                {queueState.active ? '1' : '0'}
              </div>
              <div className="task-stats-metric-label">Attivi</div>
            </div>
            
            <div className="task-stats-metric">
              <div className="task-stats-metric-value">{queueState.total}</div>
              <div className="task-stats-metric-label">Totali</div>
            </div>
          </div>
        </div>
        
        <div className="task-stats-card">
          <div className="task-stats-card-title">Completamento</div>
          <div className="task-stats-card-content">
            <div className="task-stats-metric">
              <div className="task-stats-metric-value">{queueState.completed}</div>
              <div className="task-stats-metric-label">Completati</div>
            </div>
            
            <div className="task-stats-metric">
              <div className="task-stats-metric-value">{queueState.failed}</div>
              <div className="task-stats-metric-label">Falliti</div>
            </div>
            
            <div className="task-stats-metric">
              <div className="task-stats-metric-value">{calculateCompletionRate()}</div>
              <div className="task-stats-metric-label">Successo</div>
            </div>
          </div>
        </div>
        
        <div className="task-stats-card">
          <div className="task-stats-card-title">Priorità</div>
          <div className="task-stats-card-content">
            <div className="task-stats-priority-bars">
              <div className="task-stats-priority-bar">
                <div className="task-stats-priority-label">Alta</div>
                <div className="task-stats-priority-bar-container">
                  <div 
                    className="task-stats-priority-bar-fill priority-high"
                    style={{ width: `${priorityDistribution.high}%` }}
                  />
                </div>
                <div className="task-stats-priority-value">
                  {queueState.priorityDistribution.high.length}
                </div>
              </div>
              
              <div className="task-stats-priority-bar">
                <div className="task-stats-priority-label">Normale</div>
                <div className="task-stats-priority-bar-container">
                  <div 
                    className="task-stats-priority-bar-fill priority-normal"
                    style={{ width: `${priorityDistribution.normal}%` }}
                  />
                </div>
                <div className="task-stats-priority-value">
                  {queueState.priorityDistribution.normal.length}
                </div>
              </div>
              
              <div className="task-stats-priority-bar">
                <div className="task-stats-priority-label">Bassa</div>
                <div className="task-stats-priority-bar-container">
                  <div 
                    className="task-stats-priority-bar-fill priority-low"
                    style={{ width: `${priorityDistribution.low}%` }}
                  />
                </div>
                <div className="task-stats-priority-value">
                  {queueState.priorityDistribution.low.length}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="task-stats-card">
          <div className="task-stats-card-title">Agenti</div>
          <div className="task-stats-card-content">
            <div className="task-stats-metric">
              <div className="task-stats-metric-value">{agents.length}</div>
              <div className="task-stats-metric-label">Totale</div>
            </div>
            
            <div className="task-stats-metric">
              <div className="task-stats-metric-value">{activeAgentsCount}</div>
              <div className="task-stats-metric-label">Attivi</div>
            </div>
            
            <div className="task-stats-agents-list">
              {agents.map(agent => (
                <div key={agent.id} className="task-stats-agent-item">
                  <span className={`task-stats-agent-status ${agent.isActive ? 'active' : 'inactive'}`} />
                  <span className="task-stats-agent-name">{agent.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskStatsPanel; 