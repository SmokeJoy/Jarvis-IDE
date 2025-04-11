import AgentFlowDebugger from './AgentFlowDebugger';
import AgentFlowControls from './AgentFlowControls';
import AgentFlowDiagram from './AgentFlowDiagram';
import AgentFlowHeader from './AgentFlowHeader';
import AgentFlowStats from './AgentFlowStats';
import AgentFlowTimeline from './AgentFlowTimeline';
import { AgentFlowSummary } from './AgentFlowSummary';

export {
  AgentFlowControls,
  AgentFlowDiagram,
  AgentFlowHeader,
  AgentFlowStats,
  AgentFlowTimeline,
  AgentFlowSummary
};

export default AgentFlowDebugger;

// Esporta le interfacce per chi utilizza il componente
export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
  error?: string;
}

export interface AgentInteraction {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface AgentFlow {
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
