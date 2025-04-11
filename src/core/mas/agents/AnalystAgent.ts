/**
 * @file AnalystAgent.ts
 * @description Agente analyst che analizza il codice, identifica pattern e problemi
 * @author AI1 | Jarvis MAS v1.0.0 Init
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { commandCenter, Agent, AgentRole, AgentStatus, Command } from '../../../core/command-center';

/**
 * Interfaccia per le richieste di analisi
 */
export interface AnalysisRequest {
  type: 'code' | 'project' | 'file' | 'diagnostic';
  target?: string;
  options?: any;
  requestId: string;
}

/**
 * Risultato di un'analisi
 */
export interface AnalysisResult {
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Agente Analyst: Responsabile dell'analisi del codice e dell'identificazione di pattern
 * - Analisi statica del codice
 * - Ricerca di problemi e bug potenziali
 * - Suggerimenti di ottimizzazione e miglioramento
 */
export class AnalystAgent {
  private agentId: string;
  private readonly capabilities = [
    'code-analysis',
    'pattern-recognition',
    'problem-detection',
    'optimization-suggestions'
  ];
  
  constructor() {
    // Registra l'agente nel CommandCenter
    this.agentId = commandCenter.registerAgent({
      name: 'Analyst',
      role: AgentRole.ANALYST,
      status: AgentStatus.IDLE,
      capabilities: this.capabilities
    });
    
    // Ascolta i comandi diretti a questo agente
    commandCenter.on(`command:${this.agentId}`, this.handleCommand.bind(this));
    
    // Ascolta i comandi generali per le operazioni di analisi
    commandCenter.on('command:analyze', this.handleAnalyzeCommand.bind(this));
    
    // Inizia il ciclo di heartbeat
    this.startHeartbeat();
    
    console.log(`[AnalystAgent] Inizializzato con ID: ${this.agentId}`);
  }
  
  /**
   * Gestisce i comandi diretti a questo agente
   */
  private async handleCommand(command: Command): Promise<void> {
    console.log(`[AnalystAgent] Ricevuto comando: ${command.type}`);
    
    // Imposta lo stato a BUSY mentre elabora il comando
    this.updateStatus(AgentStatus.BUSY);
    
    try {
      switch (command.type) {
        case 'analyze':
          await this.processAnalysisRequest(command.payload as AnalysisRequest);
          break;
        
        case 'status':
          // Invia lo stato corrente come risposta
          commandCenter.sendCommand({
            type: 'status-report',
            payload: {
              agent: 'analyst',
              status: 'ok',
              capabilities: this.capabilities
            },
            source: this.agentId,
            target: command.source,
            priority: 1
          });
          break;
          
        default:
          console.warn(`[AnalystAgent] Comando non supportato: ${command.type}`);
      }
    } catch (error) {
      console.error(`[AnalystAgent] Errore nell'elaborazione del comando:`, error);
      
      // Invia notifica di errore
      commandCenter.sendCommand({
        type: 'error',
        payload: {
          message: `Errore durante l'analisi: ${error instanceof Error ? error.message : String(error)}`,
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
   * Gestisce i comandi di analisi generali
   */
  private handleAnalyzeCommand(command: Command): void {
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
   * Elabora una richiesta di analisi
   */
  private async processAnalysisRequest(request: AnalysisRequest): Promise<void> {
    console.log(`[AnalystAgent] Elaborazione richiesta di analisi: ${request.type}`);
    
    let result: AnalysisResult;
    
    try {
      switch (request.type) {
        case 'code':
          result = await this.analyzeCode(request);
          break;
          
        case 'project':
          result = await this.analyzeProject(request);
          break;
          
        case 'file':
          result = await this.analyzeFile(request);
          break;
          
        case 'diagnostic':
          result = await this.analyzeDiagnostics(request);
          break;
          
        default:
          throw new Error(`Tipo di analisi non supportato: ${request.type}`);
      }
      
      // Invia il risultato
      commandCenter.sendCommand({
        type: 'analysis-result',
        payload: result,
        source: this.agentId,
        target: '',  // Broadcast
        priority: 1
      });
      
    } catch (error) {
      console.error(`[AnalystAgent] Errore durante l'analisi:`, error);
      
      // Invia risultato di errore
      commandCenter.sendCommand({
        type: 'analysis-result',
        payload: {
          requestId: request.requestId,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        } as AnalysisResult,
        source: this.agentId,
        target: '',  // Broadcast
        priority: 1
      });
    }
  }
  
  /**
   * Analizza un frammento di codice
   */
  private async analyzeCode(request: AnalysisRequest): Promise<AnalysisResult> {
    const { options } = request;
    const code = options?.code;
    
    if (!code) {
      throw new Error('Nessun codice fornito per l\'analisi');
    }
    
    // Implementazione semplice dell'analisi del codice
    // In una implementazione reale, qui si utilizzerebbero librerie di analisi statica
    const analysis = {
      length: code.length,
      lineCount: code.split('\n').length,
      patterns: this.detectPatterns(code),
      complexity: this.estimateComplexity(code),
    };
    
    return {
      requestId: request.requestId,
      success: true,
      data: analysis
    };
  }
  
  /**
   * Analizza un intero progetto
   */
  private async analyzeProject(request: AnalysisRequest): Promise<AnalysisResult> {
    // Ottieni tutti i file da analizzare
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('Nessun workspace aperto per l\'analisi');
    }
    
    const rootPath = workspaceFolders[0].uri.fsPath;
    const excludePattern = '{**/node_modules/**,**/dist/**,**/build/**,**/.git/**}';
    
    // Trova tutti i file nel workspace
    const files = await vscode.workspace.findFiles('**/*.{ts,js,tsx,jsx}', excludePattern);
    
    // Analisi di base del progetto
    const projectAnalysis = {
      rootPath,
      fileCount: files.length,
      extensions: this.countFileExtensions(files),
      overview: 'Analisi del progetto completata',
    };
    
    return {
      requestId: request.requestId,
      success: true,
      data: projectAnalysis
    };
  }
  
  /**
   * Analizza un file specifico
   */
  private async analyzeFile(request: AnalysisRequest): Promise<AnalysisResult> {
    const { target } = request;
    
    if (!target) {
      throw new Error('Nessun file target specificato per l\'analisi');
    }
    
    // Leggi il contenuto del file
    try {
      const fileUri = vscode.Uri.file(target);
      const document = await vscode.workspace.openTextDocument(fileUri);
      const content = document.getText();
      
      // Analisi del file
      const fileAnalysis = {
        path: target,
        name: path.basename(target),
        extension: path.extname(target),
        lineCount: document.lineCount,
        size: content.length,
        patterns: this.detectPatterns(content),
        complexity: this.estimateComplexity(content),
      };
      
      return {
        requestId: request.requestId,
        success: true,
        data: fileAnalysis
      };
    } catch (error) {
      throw new Error(`Impossibile analizzare il file ${target}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Analizza i problemi diagnostici nel workspace
   */
  private async analyzeDiagnostics(request: AnalysisRequest): Promise<AnalysisResult> {
    // Raccogli tutti i diagnostici da tutti i file aperti
    const allDiagnostics: any[] = [];
    
    vscode.languages.getDiagnostics().forEach(([uri, diagnostics]) => {
      if (diagnostics.length > 0) {
        allDiagnostics.push({
          file: uri.fsPath,
          problems: diagnostics.map(diag => ({
            message: diag.message,
            range: {
              start: {
                line: diag.range.start.line,
                character: diag.range.start.character
              },
              end: {
                line: diag.range.end.line,
                character: diag.range.end.character
              }
            },
            severity: this.translateDiagnosticSeverity(diag.severity),
            source: diag.source
          }))
        });
      }
    });
    
    return {
      requestId: request.requestId,
      success: true,
      data: {
        totalProblems: allDiagnostics.reduce((sum, file) => sum + file.problems.length, 0),
        fileCount: allDiagnostics.length,
        details: allDiagnostics
      }
    };
  }
  
  /**
   * Rileva pattern nel codice
   * Questa è una implementazione semplificata
   */
  private detectPatterns(code: string): string[] {
    const patterns: string[] = [];
    
    // Esempi di pattern da rilevare
    if (code.includes('class') && code.includes('extends')) {
      patterns.push('inheritance');
    }
    
    if (code.includes('interface') || code.includes('implements')) {
      patterns.push('interface-implementation');
    }
    
    if (code.includes('new Promise')) {
      patterns.push('promise-usage');
    }
    
    if (code.includes('async') && code.includes('await')) {
      patterns.push('async-await');
    }
    
    if ((code.match(/function\s*\(/g) || []).length > 3) {
      patterns.push('multiple-functions');
    }
    
    return patterns;
  }
  
  /**
   * Stima la complessità del codice
   * Questa è una implementazione molto semplificata
   */
  private estimateComplexity(code: string): number {
    let complexity = 0;
    
    // Conteggio base su lunghezza del codice
    complexity += Math.floor(code.length / 500);
    
    // Aggiunge complessità per strutture di controllo
    complexity += (code.match(/if\s*\(/g) || []).length;
    complexity += (code.match(/for\s*\(/g) || []).length * 2;
    complexity += (code.match(/while\s*\(/g) || []).length * 2;
    complexity += (code.match(/switch\s*\(/g) || []).length * 3;
    
    // Aggiunge complessità per funzioni annidate
    complexity += (code.match(/function/g) || []).length;
    
    // Limita il valore massimo
    return Math.min(complexity, 10);
  }
  
  /**
   * Conta le estensioni dei file
   */
  private countFileExtensions(files: vscode.Uri[]): Record<string, number> {
    const extensions: Record<string, number> = {};
    
    files.forEach(file => {
      const ext = path.extname(file.fsPath);
      extensions[ext] = (extensions[ext] || 0) + 1;
    });
    
    return extensions;
  }
  
  /**
   * Converte la severity dei diagnostici in formato leggibile
   */
  private translateDiagnosticSeverity(severity?: vscode.DiagnosticSeverity): string {
    switch (severity) {
      case vscode.DiagnosticSeverity.Error:
        return 'error';
      case vscode.DiagnosticSeverity.Warning:
        return 'warning';
      case vscode.DiagnosticSeverity.Information:
        return 'info';
      case vscode.DiagnosticSeverity.Hint:
        return 'hint';
      default:
        return 'unknown';
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
export const analystAgent = new AnalystAgent(); 