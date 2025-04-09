/**
 * Tipi per il sistema Multi-Agent (MAS)
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
 * Configurazione del sistema MAS
 */
export interface MasConfig {
  /** Versione della configurazione */
  version: string;
  /** Modalità di sistema (collaborativa o singola) */
  systemMode: 'collaborative' | 'single';
  /** Stile di codice predefinito */
  defaultStyle: CodeStyle;
  /** Configurazioni degli agenti */
  agents: AgentConfig[];
}

/**
 * Configurazione di un agente
 */
export interface AgentConfig {
  /** Identificatore unico dell'agente */
  id: string;
  /** Nome dell'agente */
  name: string;
  /** Modalità di operazione */
  mode: AgentMode;
  /** Indica se l'agente è abilitato */
  isEnabled: boolean;
  /** Stile di codice preferito */
  style: CodeStyle;
}

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
 * Evento emesso quando un'istruzione viene messa in coda
 */
export interface InstructionQueuedEvent {
  agentId: string;
  instruction: Instruction;
}

/**
 * Evento emesso quando un task inizia
 */
export interface TaskStartedEvent {
  agentId: string;
  task: Task;
}

/**
 * Evento emesso quando un'istruzione viene completata
 */
export interface InstructionCompletedEvent {
  agentId: string;
  instruction: Instruction;
  result: TaskResult;
}

/**
 * Evento emesso quando un task viene annullato
 */
export interface TaskAbortedEvent {
  agentId: string;
  taskId: string;
}

/**
 * Tipo di messaggio del sistema MAS
 */
export interface MasMessage {
  /** Destinatario del messaggio */
  to: string;
  /** Mittente del messaggio */
  from?: string;
  /** Payload del messaggio */
  payload: any;
  /** Timestamp di invio */
  timestamp: Date;
}

/**
 * Stato della coda dei task
 */
export interface TaskQueueState {
  /** Task attualmente in esecuzione */
  active?: Task;
  /** Task in attesa di esecuzione */
  pending: Task[];
  /** Task completati */
  completed: Task[];
  /** Task falliti */
  failed: Task[];
  /** Task annullati */
  aborted: Task[];
  /** Timestamp dell'ultimo aggiornamento */
  lastUpdated: Date;
  /** Filtri attivi */
  filter?: {
    status?: TaskStatus[];
    agentId?: string;
    search?: string;
  };
} 