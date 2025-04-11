/**
 * @file ExecutorAgent.ts
 * @description Agente executor che esegue operazioni concrete sul workspace e file system
 * @author AI1 | Jarvis MAS v1.0.0 Init
 */

import * as vscode from 'vscode';
import { commandCenter, Agent, AgentRole, AgentStatus, Command } from '../../../core/command-center';

/**
 * Interfaccia per le richieste di esecuzione
 */
export interface ExecutionRequest {
  type: 'file' | 'terminal' | 'workspace';
  action: string;
  payload: any;
  requestId: string;
}

/**
 * Risultato di un'esecuzione
 */
export interface ExecutionResult {
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Agente Executor: Responsabile dell'esecuzione di azioni concrete sul codice e sul sistema
 * - Manipolazione di file (creazione, modifica, eliminazione)
 * - Esecuzione di comandi nel terminale
 * - Operazioni sul workspace
 */
export class ExecutorAgent {
  private agentId: string;
  private readonly capabilities = [
    'file-operations',
    'terminal-execution',
    'workspace-actions'
  ];
  
  constructor() {
    // Registra l'agente nel CommandCenter
    this.agentId = commandCenter.registerAgent({
      name: 'Executor',
      role: AgentRole.EXECUTOR,
      status: AgentStatus.IDLE,
      capabilities: this.capabilities
    });
    
    // Ascolta i comandi diretti a questo agente
    commandCenter.on(`command:${this.agentId}`, this.handleCommand.bind(this));
    
    // Ascolta i comandi generali per le operazioni di esecuzione
    commandCenter.on('command:execute', this.handleExecuteCommand.bind(this));
    
    // Inizia il ciclo di heartbeat
    this.startHeartbeat();
    
    console.log(`[ExecutorAgent] Inizializzato con ID: ${this.agentId}`);
  }
  
  /**
   * Gestisce i comandi diretti a questo agente
   */
  private async handleCommand(command: Command): Promise<void> {
    console.log(`[ExecutorAgent] Ricevuto comando: ${command.type}`);
    
    // Imposta lo stato a BUSY mentre elabora il comando
    this.updateStatus(AgentStatus.BUSY);
    
    try {
      switch (command.type) {
        case 'execute':
          await this.processExecutionRequest(command.payload as ExecutionRequest);
          break;
        
        case 'status':
          // Invia lo stato corrente come risposta
          commandCenter.sendCommand({
            type: 'status-report',
            payload: {
              agent: 'executor',
              status: 'ok',
              capabilities: this.capabilities
            },
            source: this.agentId,
            target: command.source,
            priority: 1
          });
          break;
          
        default:
          console.warn(`[ExecutorAgent] Comando non supportato: ${command.type}`);
      }
    } catch (error) {
      console.error(`[ExecutorAgent] Errore nell'elaborazione del comando:`, error);
      
      // Invia notifica di errore
      commandCenter.sendCommand({
        type: 'error',
        payload: {
          message: `Errore durante l'esecuzione: ${error instanceof Error ? error.message : String(error)}`,
          command: command.type,
          agentId: this.agentId
        },
        source: this.agentId,
        target: command.source,
        priority: 2
      });
    } finally {
      // Reimposta lo stato a IDLE dopo aver completato l'elaborazione
      this.updateStatus(AgentStatus.IDLE);
    }
  }
  
  /**
   * Gestisce i comandi di esecuzione generali
   */
  private handleExecuteCommand(command: Command): void {
    if (command.target && command.target !== this.agentId) {
      // Il comando è diretto ad un altro agente
      return;
    }
    
    // Gestisci il comando come se fosse diretto a questo agente
    this.handleCommand({
      ...command,
      target: this.agentId
    });
  }
  
  /**
   * Elabora una richiesta di esecuzione
   */
  private async processExecutionRequest(request: ExecutionRequest): Promise<void> {
    console.log(`[ExecutorAgent] Elaborazione richiesta di esecuzione: ${request.type}/${request.action}`);
    
    let result: ExecutionResult;
    
    try {
      switch (request.type) {
        case 'file':
          result = await this.executeFileOperation(request);
          break;
          
        case 'terminal':
          result = await this.executeTerminalCommand(request);
          break;
          
        case 'workspace':
          result = await this.executeWorkspaceAction(request);
          break;
          
        default:
          throw new Error(`Tipo di esecuzione non supportato: ${request.type}`);
      }
      
      // Invia il risultato
      commandCenter.sendCommand({
        type: 'execution-result',
        payload: result,
        source: this.agentId,
        target: '',  // Broadcast
        priority: 1
      });
      
    } catch (error) {
      console.error(`[ExecutorAgent] Errore durante l'esecuzione:`, error);
      
      // Invia risultato di errore
      commandCenter.sendCommand({
        type: 'execution-result',
        payload: {
          requestId: request.requestId,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        } as ExecutionResult,
        source: this.agentId,
        target: '',  // Broadcast
        priority: 1
      });
    }
  }
  
  /**
   * Esegue un'operazione su file
   */
  private async executeFileOperation(request: ExecutionRequest): Promise<ExecutionResult> {
    const { action, payload } = request;
    
    switch (action) {
      case 'read':
        // Implementazione della lettura file
        try {
          const content = await vscode.workspace.fs.readFile(vscode.Uri.file(payload.path));
          return {
            requestId: request.requestId,
            success: true,
            data: {
              content: Buffer.from(content).toString('utf-8'),
              path: payload.path
            }
          };
        } catch (error) {
          throw new Error(`Impossibile leggere il file ${payload.path}: ${error instanceof Error ? error.message : String(error)}`);
        }
        
      case 'write':
        // Implementazione della scrittura file
        try {
          const contentBuffer = Buffer.from(payload.content, 'utf-8');
          await vscode.workspace.fs.writeFile(vscode.Uri.file(payload.path), contentBuffer);
          return {
            requestId: request.requestId,
            success: true,
            data: { path: payload.path }
          };
        } catch (error) {
          throw new Error(`Impossibile scrivere il file ${payload.path}: ${error instanceof Error ? error.message : String(error)}`);
        }
        
      case 'delete':
        // Implementazione dell'eliminazione file
        try {
          await vscode.workspace.fs.delete(vscode.Uri.file(payload.path), { recursive: payload.recursive || false });
          return {
            requestId: request.requestId,
            success: true,
            data: { path: payload.path }
          };
        } catch (error) {
          throw new Error(`Impossibile eliminare ${payload.path}: ${error instanceof Error ? error.message : String(error)}`);
        }
        
      default:
        throw new Error(`Operazione file non supportata: ${action}`);
    }
  }
  
  /**
   * Esegue un comando nel terminale
   */
  private async executeTerminalCommand(request: ExecutionRequest): Promise<ExecutionResult> {
    const { payload } = request;
    
    try {
      // Creazione di un nuovo terminale
      const terminal = vscode.window.createTerminal('Jarvis MAS Terminal');
      terminal.show();
      
      // Esecuzione del comando
      terminal.sendText(payload.command);
      
      return {
        requestId: request.requestId,
        success: true,
        data: { command: payload.command }
      };
    } catch (error) {
      throw new Error(`Errore nell'esecuzione del comando: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Esegue un'azione sul workspace
   */
  private async executeWorkspaceAction(request: ExecutionRequest): Promise<ExecutionResult> {
    const { action, payload } = request;
    
    switch (action) {
      case 'search':
        // Implementazione della ricerca nel workspace
        try {
          const results = await vscode.workspace.findFiles(
            payload.pattern,
            payload.exclude || null,
            payload.maxResults || 100
          );
          
          return {
            requestId: request.requestId,
            success: true,
            data: {
              files: results.map(uri => uri.fsPath),
              pattern: payload.pattern
            }
          };
        } catch (error) {
          throw new Error(`Errore nella ricerca: ${error instanceof Error ? error.message : String(error)}`);
        }
        
      default:
        throw new Error(`Azione workspace non supportata: ${action}`);
    }
  }
  
  /**
   * Aggiorna lo stato dell'agente nel Command Center
   */
  private updateStatus(status: AgentStatus): void {
    commandCenter.updateAgentStatus(this.agentId, status);
  }
  
  /**
   * Avvia il ciclo di heartbeat per l'agente
   */
  private startHeartbeat(): void {
    // Invia un heartbeat ogni 15 secondi
    setInterval(() => {
      commandCenter.updateAgentHeartbeat(this.agentId);
    }, 15000);
  }
}

// Esporta l'istanza singleton dell'agente
export const executorAgent = new ExecutorAgent(); 