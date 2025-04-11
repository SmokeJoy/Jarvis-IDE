/**
 * Definizioni di tipo per il sistema di debug dei flussi di agenti
 */

// Tipi base

/**
 * Rappresenta un agente nel sistema
 */
export interface Agent {
  id: string;
  name: string;
  role?: string;
  description?: string;
  status: AgentStatus;
  capabilities?: string[];
  stats?: AgentStats;
  metadata?: Record<string, any>;
}

/**
 * Stato possibile di un agente
 */
export type AgentStatus = 
  | 'idle' 
  | 'processing' 
  | 'responding'
  | 'waiting'
  | 'error'
  | 'completed';

/**
 * Statistiche di un agente
 */
export interface AgentStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  avgResponseTime?: number;
  totalTokensUsed?: number;
  lastActiveTimestamp?: number;
}

/**
 * Rappresenta un'interazione tra agenti
 */
export interface AgentInteraction {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  message: string;
  timestamp: number;
  duration?: number;
  type: InteractionType;
  status: InteractionStatus;
  tokens?: {
    input: number;
    output: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Tipo di interazione tra agenti
 */
export type InteractionType = 
  | 'request' 
  | 'response' 
  | 'notification' 
  | 'error'
  | 'memory'
  | 'system';

/**
 * Stato di un'interazione
 */
export type InteractionStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed';

/**
 * Rappresenta il flusso completo di un sistema multi-agente
 */
export interface AgentFlow {
  id: string;
  name: string;
  description?: string;
  agents: Agent[];
  interactions: AgentInteraction[];
  startTime: number;
  endTime?: number;
  status: FlowStatus;
  metadata?: Record<string, any>;
  stats?: {
    totalInteractions: number;
    totalTokensUsed?: number;
    totalDuration?: number;
    averageResponseTime?: number;
  };
}

/**
 * Stato del flusso di agenti
 */
export type FlowStatus = 
  | 'initializing' 
  | 'running' 
  | 'paused'
  | 'completed' 
  | 'error' 
  | 'terminated';

// Tipi per i filtri

/**
 * Filtri per le interazioni
 */
export interface InteractionFilters {
  agentIds?: string[];
  startTime?: number;
  endTime?: number;
  types?: InteractionType[];
  statuses?: InteractionStatus[];
  searchTerm?: string;
}

// Tipi per le opzioni di diagramma

/**
 * Opzioni per il rendering del diagramma
 */
export interface DiagramOptions {
  showTimestamps: boolean;
  animateInteractions: boolean;
  layout: DiagramLayout;
  theme: DiagramTheme;
}

export type DiagramLayout = 'TB' | 'BT' | 'LR' | 'RL';
export type DiagramTheme = 'default' | 'dark' | 'light' | 'forest' | 'neutral';

// Tipi per lo stato dell'UI

/**
 * Stato del componente AgentFlowDebugger
 */
export interface AgentFlowDebuggerState {
  selectedAgentId: string | null;
  filters: Partial<InteractionFilters>;
  diagramOptions: DiagramOptions;
  isLiveUpdating: boolean;
  isExporting: boolean;
  zoomLevel: number;
}

// Tipi per l'esportazione

/**
 * Formato di esportazione del diagramma
 */
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'json';

/**
 * Opzioni per l'esportazione
 */
export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  filename?: string;
}

// Tipi per i servizi e API

/**
 * Dati per la creazione di un flusso
 */
export interface CreateFlowData {
  name: string;
  description?: string;
  agents: Omit<Agent, 'id' | 'status' | 'stats'>[];
  metadata?: Record<string, any>;
}

/**
 * Dati per l'aggiunta di un'interazione
 */
export interface AddInteractionData {
  fromAgentId: string;
  toAgentId: string;
  message: string;
  type: InteractionType;
  tokens?: {
    input: number;
    output: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Props per il componente AgentFlowDebugger
 */
export interface AgentFlowDebuggerProps {
  /** Dati del flusso da visualizzare */
  flow: AgentFlow;
  /** URL per gli aggiornamenti via WebSocket (opzionale) */
  websocketUrl?: string;
  /** Intervallo di polling in ms per gli aggiornamenti (se websocket non disponibile) */
  pollingInterval?: number;
  /** Callback richiamato quando un agente viene selezionato */
  onSelectAgent?: (agentId: string) => void;
  /** Callback richiamato quando avviene un cambiamento nello stato del flusso */
  onFlowStatusChange?: (oldStatus: FlowStatus, newStatus: FlowStatus) => void;
  /** Classe CSS opzionale da applicare al container principale */
  className?: string;
}

/**
 * Risultato dello hook useAgentFlow
 */
export interface UseAgentFlowResult {
  flow: AgentFlow | null;
  error: Error | null;
  isLoading: boolean;
  isConnected: boolean;
  refresh: () => void;
  disconnect: () => void;
  reconnect: () => void;
} 