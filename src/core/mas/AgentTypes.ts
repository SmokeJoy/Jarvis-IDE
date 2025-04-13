/**
 * Definizioni dei tipi per il sistema Multi-Agent di Jarvis-IDE
 */

/**
 * Stati operativi possibili per un agente
 */
export type AgentMode = 'autonomous' | 'supervised' | 'inactive';

/**
 * Interfaccia base per tutti gli agenti nel sistema
 */
export interface BaseAgent {
  id: string;
  name: string;
  mode: AgentMode;
  isActive: boolean;

  activate(): void;
  deactivate(): void;
}

/**
 * Stato operativo di un agente
 */
export interface AgentStatus {
  id: string;
  name: string;
  mode: AgentMode;
  isActive: boolean;
  currentTask?: string;
  lastActivity?: Date;
  dependencies: string[];
  warnings: string[];
}

/**
 * Interfaccia per le istruzioni inviate a CoderAgent
 */
export interface CoderInstruction {
  context: string;
  objective: string;
  requiredStyle?: string;
  actions: string[];
  constraints: string[];
}

/**
 * Tipo di messaggio scambiato tra agenti
 */
export type MessageType = 'instruction' | 'response' | 'notification' | 'status';

/**
 * Payload generico per i messaggi tra agenti
 */
export type AgentPayload = Record<string, unknown>;

/**
 * Messaggio scambiato tra gli agenti
 */
export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: MessageType;
  timestamp: Date;
  payload: AgentPayload;
  replyTo?: string;
}

/**
 * Risultato dell'esecuzione di un'istruzione
 */
export interface InstructionResult {
  success: boolean;
  message: string;
  code?: string;
  warnings?: string[];
  errors?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Interfaccia per il CoderAgent
 */
export interface CoderAgent extends BaseAgent {
  currentInstruction?: CoderInstruction;
  executeInstruction(instruction: string): Promise<InstructionResult>;
}

/**
 * Interfaccia per lo StyleAgent
 */
export interface StyleAgent extends BaseAgent {
  currentStyle?: string;
  applyStyle(code: string, style: string): Promise<string>;
}

/**
 * Interfaccia per il MultiAgent
 */
export interface MultiAgent extends BaseAgent {
  createAgentGroup(objective: string): Promise<string>;
  dissolveAgentGroup(groupId: string): Promise<void>;
}

/**
 * Interfaccia per il DocAgent
 */
export interface DocAgent extends BaseAgent {
  generateDocumentation(code: string, type: string): Promise<string>;
}

/**
 * Tipo per gli eventi del sistema di agenti
 */
export type AgentEventListener = (...args: unknown[]) => void;

/**
 * Interfaccia per il SupervisorAgent
 */
export interface SupervisorAgent extends BaseAgent {
  registerAgents(
    coderAgent?: CoderAgent,
    styleAgent?: StyleAgent,
    multiAgent?: MultiAgent,
    docAgent?: DocAgent
  ): void;

  queueInstruction(agentId: string, instruction: string): Promise<void>;
  getAgentStatus(agentId: string): AgentStatus;
  getAllAgentsStatus(): AgentStatus[];
  sendMessage(message: AgentMessage): void;

  on(event: string, listener: AgentEventListener): void;
  off(event: string, listener: AgentEventListener): void;
}
