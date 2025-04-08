/**
 * Tipi condivisi tra il backend e la WebView
 */

/**
 * Livello di priorità dei task
 */
export type PriorityLevel = 'high' | 'normal' | 'low';

/**
 * Modalità di operazione di un agente
 */
export type AgentMode = 'autonomous' | 'supervised' | 'interactive';

/**
 * Stile di codice utilizzato dagli agenti
 */
export type CodeStyle = 'standard' | 'compact' | 'verbose' | 'documented';

/**
 * Stato di un task
 */
export type TaskStatus = 'pending' | 'active' | 'completed' | 'failed' | 'aborted';

/**
 * Stato di un agente
 */
export interface AgentStatus {
  /** Identificatore unico dell'agente */
  id: string;
  /** Nome dell'agente */
  name: string;
  /** Modalità di operazione */
  mode: AgentMode;
  /** Indica se l'agente è attivo */
  isActive: boolean;
  /** Task attualmente in esecuzione */
  currentTask?: string;
  /** Timestamp dell'ultima attività */
  lastActivity?: Date;
  /** Agenti da cui dipende */
  dependencies: string[];
  /** Avvisi o problemi */
  warnings: string[];
}

/**
 * Istruzione per un agente
 */
export interface Instruction {
  /** Identificatore unico dell'istruzione */
  id: string;
  /** Contenuto dell'istruzione */
  content: string;
  /** Timestamp di creazione */
  createdAt: Date;
  /** Agente a cui è destinata */
  agentId: string;
  /** Stile di codice richiesto */
  style?: CodeStyle;
  /** Priorità dell'istruzione */
  priority?: PriorityLevel;
}

/**
 * Risultato di un task
 */
export interface TaskResult {
  /** Identificatore unico del risultato */
  id: string;
  /** Spiegazione delle azioni intraprese */
  explanation: string;
  /** Suggerimenti per l'utente */
  suggestions?: string[];
  /** File modificati */
  modifiedFiles?: string[];
  /** File creati */
  createdFiles?: string[];
  /** Eventuali warning */
  warnings?: string[];
}

/**
 * Task per un agente
 */
export interface Task {
  /** Identificatore unico del task */
  id: string;
  /** Stato del task */
  status: TaskStatus;
  /** Timestamp di creazione */
  createdAt: Date;
  /** Timestamp di inizio esecuzione */
  startedAt?: Date;
  /** Timestamp di completamento */
  completedAt?: Date;
  /** Agente a cui è assegnato il task */
  assignedTo?: string;
  /** Istruzione da eseguire */
  instruction: Instruction;
  /** Risultato dell'elaborazione */
  result?: TaskResult;
  /** Errore in caso di fallimento */
  error?: string;
}

/**
 * Stato della coda dei task per la WebView
 */
export interface TaskQueueState {
  /** Numero totale di task */
  total: number;
  /** Numero di task in attesa */
  pending: number;
  /** Task attualmente attivo */
  active: Task | null;
  /** Numero di task completati */
  completed: number;
  /** Numero di task falliti */
  failed: number;
  /** Distribuzione dei task per priorità */
  priorityDistribution: {
    /** Task con priorità alta */
    high: Task[];
    /** Task con priorità normale */
    normal: Task[];
    /** Task con priorità bassa */
    low: Task[];
  };
} 