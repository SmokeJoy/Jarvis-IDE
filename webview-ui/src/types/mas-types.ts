/**
 * Tipi per il sistema Multi-Agent di Jarvis-IDE nella WebView
 */

/**
 * Modalità operativa dell'agente
 */
export type AgentMode = 'autonomous' | 'supervised' | 'inactive';

/**
 * Stato di un agente nel sistema MAS
 */
export interface AgentStatus {
  id: string;
  name: string;
  mode: AgentMode;
  isActive: boolean;
  currentTask?: string;
  lastActivity?: Date | string;
  dependencies: string[];
  warnings: string[];
}

/**
 * Livello di priorità per un task o un'istruzione
 */
export type PriorityLevel = 'high' | 'normal' | 'low';

/**
 * Stato di un task nel sistema MAS
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'aborted';

/**
 * Tipo di stile di codice
 */
export type CodeStyle = 'standard' | 'concise' | 'verbose';

/**
 * Rappresenta un'istruzione inviata a un agente
 */
export interface Instruction {
  id: string;
  content: string;
  createdAt: Date | string;
  agentId: string;
  style?: CodeStyle;
  priority: PriorityLevel;
}

/**
 * Rappresenta un task nel sistema MAS
 */
export interface Task {
  id: string;
  instruction: Instruction;
  status: TaskStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt?: Date | string;
  assignedTo?: string;
  result?: TaskResult;
  error?: string;
}

/**
 * Risultato di un task completato
 */
export interface TaskResult {
  id: string;
  code?: string;
  explanation?: string;
  warnings?: string[];
  suggestions?: string[];
}

/**
 * Stato della coda di task nel sistema MAS
 */
export interface TaskQueueState {
  activeTask?: Task;
  pendingTasks: Task[];
  completedTasks: Task[];
}

/**
 * Configurazione di un agente
 */
export interface AgentConfig {
  id: string;
  name: string;
  mode: AgentMode;
  model?: string;
  style?: CodeStyle;
  isEnabled: boolean;
}

/**
 * Configurazione del sistema MAS
 */
export interface MasConfig {
  agents: AgentConfig[];
  defaultStyle: CodeStyle;
  defaultMode: 'collaborative' | 'single';
} 