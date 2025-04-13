/**
 * @file command-center.ts
 * @description Centro di comando per il sistema Multi-Agent (MAS) di Jarvis IDE
 * Gestisce il flusso di comunicazione tra agenti, interfacce utente e sistema
 *
 * @author AI1 | Jarvis MAS v1.0.0 Init
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// Interfacce
export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  capabilities: string[];
  lastHeartbeat: number;
}

export enum AgentRole {
  COORDINATOR = 'coordinator',
  EXECUTOR = 'executor',
  ANALYST = 'analyst',
  ASSISTANT = 'assistant',
  SUPERVISOR = 'supervisor',
}

export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ERROR = 'error',
}

export interface Command {
  id: string;
  type: string;
  payload: any;
  source: string;
  target: string;
  timestamp: number;
  priority: number;
}

// Classe principale del Command Center
export class CommandCenter {
  private static instance: CommandCenter;
  private agents: Map<string, Agent>;
  private commands: Command[];
  private eventEmitter: EventEmitter;
  private heartbeatInterval: NodeJS.Timeout | null;
  private heartbeatFrequency: number; // in millisecondi

  private constructor() {
    this.agents = new Map<string, Agent>();
    this.commands = [];
    this.eventEmitter = new EventEmitter();
    this.heartbeatInterval = null;
    this.heartbeatFrequency = 30000; // 30 secondi

    this.initializeHeartbeat();
  }

  public static getInstance(): CommandCenter {
    if (!CommandCenter.instance) {
      CommandCenter.instance = new CommandCenter();
    }
    return CommandCenter.instance;
  }

  /**
   * Registra un nuovo agente nel sistema
   */
  public registerAgent(agent: Omit<Agent, 'id' | 'lastHeartbeat'>): string {
    const id = uuidv4();
    const newAgent: Agent = {
      ...agent,
      id,
      lastHeartbeat: Date.now(),
    };

    this.agents.set(id, newAgent);
    this.eventEmitter.emit('agent:registered', newAgent);

    console.log(`[CommandCenter] Agente registrato: ${agent.name} (${id})`);
    return id;
  }

  /**
   * Invia un comando nel sistema
   */
  public sendCommand(command: Omit<Command, 'id' | 'timestamp'>): string {
    const id = uuidv4();
    const newCommand: Command = {
      ...command,
      id,
      timestamp: Date.now(),
    };

    this.commands.push(newCommand);
    this.eventEmitter.emit('command:sent', newCommand);

    // Elabora il comando
    this.processCommand(newCommand);

    return id;
  }

  /**
   * Elabora un comando ricevuto
   */
  private processCommand(command: Command): void {
    console.log(`[CommandCenter] Elaborazione comando: ${command.id} (${command.type})`);

    // Logica di routing del comando
    if (command.target) {
      const targetAgent = this.agents.get(command.target);
      if (targetAgent) {
        this.eventEmitter.emit(`command:${targetAgent.id}`, command);
      } else {
        console.warn(`[CommandCenter] Agente target non trovato: ${command.target}`);
      }
    } else {
      // Broadcasting ai componenti interessati
      this.eventEmitter.emit(`command:${command.type}`, command);
    }
  }

  /**
   * Inizializza il sistema di heartbeat per monitorare gli agenti
   */
  private initializeHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.checkAgentsHealth();
    }, this.heartbeatFrequency);

    console.log(
      `[CommandCenter] Sistema heartbeat attivato. Frequenza: ${this.heartbeatFrequency}ms`
    );
  }

  /**
   * Controlla lo stato di salute degli agenti tramite heartbeat
   */
  private checkAgentsHealth(): void {
    const now = Date.now();
    const timeoutThreshold = 3 * this.heartbeatFrequency; // 3 volte la frequenza di heartbeat

    console.log(`[CommandCenter] Controllo salute degli agenti in corso...`);

    this.agents.forEach((agent, id) => {
      if (now - agent.lastHeartbeat > timeoutThreshold) {
        // L'agente non risponde
        if (agent.status !== AgentStatus.OFFLINE) {
          console.warn(
            `[CommandCenter] L'agente ${agent.name} (${id}) non risponde. Impostato come OFFLINE.`
          );
          agent.status = AgentStatus.OFFLINE;
          this.eventEmitter.emit('agent:offline', agent);
        }
      }
    });

    // Emetti un evento heartbeat
    this.eventEmitter.emit('system:heartbeat', {
      timestamp: now,
      agentsCount: this.agents.size,
      activeAgents: [...this.agents.values()].filter((a) => a.status !== AgentStatus.OFFLINE)
        .length,
    });
  }

  /**
   * Aggiorna l'heartbeat di un agente
   */
  public updateAgentHeartbeat(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastHeartbeat = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Aggiorna lo stato di un agente
   */
  public updateAgentStatus(agentId: string, status: AgentStatus): boolean {
    const agent = this.agents.get(agentId);
    if (agent) {
      const previousStatus = agent.status;
      agent.status = status;
      agent.lastHeartbeat = Date.now();

      // Emetti un evento di cambio stato
      if (previousStatus !== status) {
        this.eventEmitter.emit('agent:status-changed', {
          agentId,
          previousStatus,
          newStatus: status,
        });
      }

      return true;
    }
    return false;
  }

  /**
   * Sottoscrizione a eventi
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Rimuove un agente dal sistema
   */
  public removeAgent(agentId: string): boolean {
    const result = this.agents.delete(agentId);
    if (result) {
      this.eventEmitter.emit('agent:removed', agentId);
    }
    return result;
  }

  /**
   * Ottiene lo stato attuale del sistema
   */
  public getSystemStatus(): any {
    return {
      agentsCount: this.agents.size,
      activeAgents: [...this.agents.values()].filter((a) => a.status !== AgentStatus.OFFLINE)
        .length,
      commandsProcessed: this.commands.length,
      timestamp: Date.now(),
    };
  }
}

// Esporta l'istanza singleton del CommandCenter
export const commandCenter = CommandCenter.getInstance();
