import type { 
  AgentStatus, 
  SupervisorAgent as ISupervisorAgent,
  CoderAgent,
  StyleAgent,
  MultiAgent,
  DocAgent,
  AgentMessage,
  CoderInstruction
} from './AgentTypes.js';
import type { EventEmitter } from 'events';

/**
 * Implementazione del SupervisorAgent che coordina tutti gli altri agenti nel sistema MAS
 */
export class SupervisorAgent implements ISupervisorAgent {
  id: string = 'supervisor-agent';
  name: string = 'SupervisorAgent';
  mode: 'autonomous' = 'autonomous';
  isActive: boolean = false;
  
  private coderAgent: CoderAgent | null = null;
  private styleAgent: StyleAgent | null = null;
  private multiAgent: MultiAgent | null = null;
  private docAgent: DocAgent | null = null;
  
  private instructionQueue: Map<string, CoderInstruction[]> = new Map();
  private eventEmitter = new EventEmitter();
  
  private agentStatuses: Map<string, AgentStatus> = new Map();
  
  constructor() {
    // Il SupervisorAgent è attivo di default
    this.isActive = true;
    // Inizializza lo stato di base
    this.agentStatuses.set(this.id, {
      id: this.id,
      name: this.name,
      mode: this.mode,
      isActive: this.isActive,
      dependencies: [],
      warnings: []
    });
  }
  
  /**
   * Registra gli agenti che saranno coordinati dal supervisore
   */
  registerAgents(
    coderAgent?: CoderAgent, 
    styleAgent?: StyleAgent, 
    multiAgent?: MultiAgent, 
    docAgent?: DocAgent
  ): void {
    if (coderAgent) {
      this.coderAgent = coderAgent;
      this.agentStatuses.set(coderAgent.id, {
        id: coderAgent.id,
        name: coderAgent.name,
        mode: coderAgent.mode,
        isActive: coderAgent.isActive,
        dependencies: ['supervisor-agent'],
        warnings: []
      });
    }
    
    if (styleAgent) {
      this.styleAgent = styleAgent;
      this.agentStatuses.set(styleAgent.id, {
        id: styleAgent.id,
        name: styleAgent.name,
        mode: styleAgent.mode,
        isActive: styleAgent.isActive,
        dependencies: ['coder-agent'],
        warnings: []
      });
    }
    
    if (multiAgent) {
      this.multiAgent = multiAgent;
      this.agentStatuses.set(multiAgent.id, {
        id: multiAgent.id,
        name: multiAgent.name,
        mode: multiAgent.mode,
        isActive: multiAgent.isActive,
        dependencies: ['coder-agent'],
        warnings: []
      });
    }
    
    if (docAgent) {
      this.docAgent = docAgent;
      this.agentStatuses.set(docAgent.id, {
        id: docAgent.id,
        name: docAgent.name,
        mode: docAgent.mode,
        isActive: docAgent.isActive,
        dependencies: [],
        warnings: []
      });
    }
  }
  
  activate(): void {
    this.isActive = true;
    const status = this.agentStatuses.get(this.id);
    if (status) {
      status.isActive = true;
      status.lastActivity = new Date();
    }
  }
  
  deactivate(): void {
    // Il SupervisorAgent non può essere disattivato se ci sono agenti attivi
    if (this.hasActiveAgents()) {
      console.warn('Impossibile disattivare il SupervisorAgent: ci sono ancora agenti attivi');
      return;
    }
    
    this.isActive = false;
    const status = this.agentStatuses.get(this.id);
    if (status) {
      status.isActive = false;
      status.lastActivity = new Date();
    }
  }
  
  /**
   * Verifica se ci sono agenti attivi oltre al supervisore
   */
  private hasActiveAgents(): boolean {
    for (const [id, status] of this.agentStatuses.entries()) {
      if (id !== this.id && status.isActive) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Aggiunge un'istruzione alla coda per un agente specifico
   */
  async queueInstruction(agentId: string, instruction: string): Promise<void> {
    if (!this.isActive) {
      throw new Error('SupervisorAgent non attivo');
    }
    
    if (agentId === 'coder-agent' && this.coderAgent) {
      // Crea un'istruzione strutturata per il CoderAgent
      const coderInstruction: CoderInstruction = {
        context: 'Richiesta di codifica da SupervisorAgent',
        objective: instruction,
        requiredStyle: this.styleAgent?.currentStyle || 'standard',
        actions: [instruction],
        constraints: []
      };
      
      // Aggiungi alla coda
      if (!this.instructionQueue.has(agentId)) {
        this.instructionQueue.set(agentId, []);
      }
      
      this.instructionQueue.get(agentId)?.push(coderInstruction);
      
      // Attiva l'agente se necessario
      if (!this.coderAgent.isActive) {
        this.coderAgent.activate();
      }
      
      // Aggiorna lo stato
      const status = this.agentStatuses.get(agentId);
      if (status) {
        status.currentTask = instruction;
        status.lastActivity = new Date();
      }
      
      // Emetti evento
      this.eventEmitter.emit('instruction-queued', { agentId, instruction });
      
      // Se l'agente è disponibile, esegui subito l'istruzione
      if (this.coderAgent.isActive && !this.coderAgent.currentInstruction) {
        this.processNextInstruction(agentId);
      }
    } else {
      throw new Error(`Agente ${agentId} non supportato o non registrato`);
    }
  }
  
  /**
   * Processa la prossima istruzione nella coda di un agente
   */
  private async processNextInstruction(agentId: string): Promise<void> {
    const queue = this.instructionQueue.get(agentId);
    if (!queue || queue.length === 0) {
      return;
    }
    
    const instruction = queue.shift();
    if (!instruction) {
      return;
    }
    
    if (agentId === 'coder-agent' && this.coderAgent) {
      try {
        // Esegui l'istruzione
        const result = await this.coderAgent.executeInstruction(instruction.objective);
        
        // Emetti evento di completamento
        this.eventEmitter.emit('instruction-completed', { 
          agentId, 
          instruction, 
          result 
        });
        
        // Aggiorna lo stato
        const status = this.agentStatuses.get(agentId);
        if (status) {
          status.currentTask = undefined;
          status.lastActivity = new Date();
        }
      } catch (error) {
        // Gestisci errore
        this.eventEmitter.emit('instruction-failed', { 
          agentId, 
          instruction, 
          error 
        });
        
        // Aggiorna lo stato
        const status = this.agentStatuses.get(agentId);
        if (status) {
          status.warnings.push(`Errore nell'esecuzione: ${error}`);
          status.currentTask = undefined;
          status.lastActivity = new Date();
        }
      }
    }
  }
  
  /**
   * Ottiene lo stato di un agente specifico
   */
  getAgentStatus(agentId: string): AgentStatus {
    const status = this.agentStatuses.get(agentId);
    if (!status) {
      throw new Error(`Agente ${agentId} non trovato`);
    }
    return status;
  }
  
  /**
   * Ottiene lo stato di tutti gli agenti
   */
  getAllAgentsStatus(): AgentStatus[] {
    return Array.from(this.agentStatuses.values());
  }
  
  /**
   * Invia un messaggio da un agente all'altro
   */
  sendMessage(message: AgentMessage): void {
    // Verifica che il mittente e il destinatario siano validi
    if (!this.agentStatuses.has(message.from) || !this.agentStatuses.has(message.to)) {
      throw new Error('Mittente o destinatario non valido');
    }
    
    // Verifica che il CoderAgent possa ricevere messaggi solo dal Supervisore
    if (message.to === 'coder-agent' && message.from !== this.id) {
      throw new Error('CoderAgent può ricevere messaggi solo dal SupervisorAgent');
    }
    
    // Emetti evento di messaggio
    this.eventEmitter.emit('message', message);
    
    // Gestisci il messaggio in base al tipo
    if (message.type === 'instruction' && message.to === 'coder-agent') {
      this.queueInstruction(message.to, message.payload);
    }
  }
  
  /**
   * Registra un listener per gli eventi del supervisore
   */
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
  
  /**
   * Rimuove un listener per gli eventi del supervisore
   */
  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
} 