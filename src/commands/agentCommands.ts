import * as vscode from 'vscode';
import { logger } from '../utils/logger.js.js';
import { JarvisProvider } from '../core/webview/JarvisProvider.js.js';
import { JarvisAgent } from '../agent/JarvisAgent.js.js';
import { Logger } from '../utils/Logger.js.js';
import { createMasSystem, SupervisorAgent } from '../core/mas.js.js';
import { v4 as uuidv4 } from 'uuid';

// Logger per i comandi degli agenti
const agentLogger = new Logger('AgentCommands');

// Istanza condivisa del sistema MAS
let masSystem: SupervisorAgent | null = null;

/**
 * Inizializza il sistema MAS
 */
function initializeMasSystem(): SupervisorAgent {
  if (!masSystem) {
    agentLogger.info('Inizializzazione del sistema MAS');
    masSystem = createMasSystem();
    
    // Configura gli ascoltatori di eventi
    masSystem.on('instruction-queued', (data) => {
      agentLogger.info(`Istruzione in coda per ${data.agentId}: ${data.instruction}`);
      vscode.window.setStatusBarMessage(`Istruzione inviata a ${data.agentId}`, 3000);
    });
    
    masSystem.on('instruction-completed', (data) => {
      agentLogger.info(`Istruzione completata da ${data.agentId}`);
      vscode.window.setStatusBarMessage(`Operazione completata da ${data.agentId}`, 3000);
    });
    
    masSystem.on('instruction-failed', (data) => {
      agentLogger.error(`Errore nell'esecuzione dell'istruzione per ${data.agentId}`, data.error);
      vscode.window.showErrorMessage(`Errore durante l'esecuzione: ${data.error.message}`);
    });
  }
  
  return masSystem;
}

/**
 * Registra i comandi relativi all'agente Jarvis
 * @param context Contesto dell'estensione
 * @param provider Provider del WebView
 */
export function registerAgentCommands(
  context: vscode.ExtensionContext,
  provider?: JarvisProvider
): vscode.Disposable[] {
  agentLogger.info('Registrazione comandi dell\'agente Jarvis');
  
  const disposables: vscode.Disposable[] = [];
  
  // Comando per eseguire l'agente autonomo
  const runAgentCommand = vscode.commands.registerCommand('jarvis.runAgent', async () => {
    try {
      agentLogger.info('Avvio agente Jarvis');
      const agent = new JarvisAgent();
      await agent.run();
      agentLogger.info('Agente Jarvis completato con successo');
    } catch (error) {
      agentLogger.error(`Errore durante l'esecuzione dell'agente: ${error}`);
      vscode.window.showErrorMessage(`Errore: ${error}`);
    }
  });
  
  // Comando per analizzare il file corrente
  const analyzeFileCommand = vscode.commands.registerCommand('jarvis.analyzeFile', async () => {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('Nessun file aperto da analizzare');
        return;
      }

      const document = editor.document;
      const fileName = document.fileName;
      const fileContent = document.getText();
      const fileExtension = fileName.split('.').pop() || '';

      agentLogger.info(`Analisi del file: ${fileName}`);

      // Qui si può implementare la logica per l'analisi del file
      // Ad esempio, inviare il contenuto all'agente AI

      vscode.window.showInformationMessage(`Analisi di ${fileName} in corso...`);
    } catch (error) {
      agentLogger.error(`Errore durante l'analisi del file: ${error}`);
      vscode.window.showErrorMessage(`Errore: ${error}`);
    }
  });
  
  // Comando per inviare un'istruzione al CoderAgent
  const sendCoderInstructionCommand = vscode.commands.registerCommand(
    'jarvis-ide.sendCoderInstruction', 
    async () => {
      try {
        const masSystem = initializeMasSystem();
        
        // Richiedi l'istruzione all'utente
        const instruction = await vscode.window.showInputBox({
          prompt: 'Inserisci l\'istruzione per il CoderAgent',
          placeHolder: 'Es. Crea una classe per...'
        });
        
        if (!instruction) {
          return; // Operazione annullata
        }
        
        // Invia l'istruzione
        await masSystem.queueInstruction('coder-agent', instruction);
        agentLogger.info(`Istruzione inviata al CoderAgent: ${instruction}`);
        
      } catch (error) {
        agentLogger.error('Errore nell\'invio dell\'istruzione', error as Error);
        vscode.window.showErrorMessage(`Errore: ${(error as Error).message}`);
      }
    }
  );
  
  // Comando per mostrare lo stato degli agenti
  const showAgentStatusCommand = vscode.commands.registerCommand(
    'jarvis-ide.showAgentStatus',
    () => {
      try {
        const masSystem = initializeMasSystem();
        const statuses = masSystem.getAllAgentsStatus();
        
        // Formatta e mostra lo stato
        const statusMessages = statuses.map(status => {
          return `${status.name} (${status.id}): ${status.isActive ? 'attivo' : 'inattivo'}, modalità: ${status.mode}${status.currentTask ? `, task corrente: ${status.currentTask}` : ''}`;
        });
        
        vscode.window.showInformationMessage('Stato del sistema MAS', {
          modal: true,
          detail: statusMessages.join('\n')
        });
        
        agentLogger.info('Stato del sistema MAS visualizzato');
        
      } catch (error) {
        agentLogger.error('Errore nella visualizzazione dello stato', error as Error);
        vscode.window.showErrorMessage(`Errore: ${(error as Error).message}`);
      }
    }
  );
  
  // Comando per attivare/disattivare il CoderAgent
  const toggleCoderAgentCommand = vscode.commands.registerCommand(
    'jarvis-ide.toggleCoderAgent',
    async () => {
      try {
        const masSystem = initializeMasSystem();
        const status = masSystem.getAgentStatus('coder-agent');
        
        if (status.isActive) {
          // Ottieni lo stato corrente
          const confirmDisable = await vscode.window.showWarningMessage(
            'Disattivare il CoderAgent?',
            { modal: true },
            'Sì', 'No'
          );
          
          if (confirmDisable === 'Sì') {
            // Invia un messaggio per disattivare l'agente
            masSystem.sendMessage({
              id: uuidv4(),
              from: masSystem.id,
              to: 'coder-agent',
              type: 'notification',
              timestamp: new Date(),
              payload: 'deactivate'
            });
            
            vscode.window.setStatusBarMessage('CoderAgent disattivato', 3000);
            agentLogger.info('CoderAgent disattivato');
          }
        } else {
          // Attiva l'agente
          masSystem.sendMessage({
            id: uuidv4(),
            from: masSystem.id,
            to: 'coder-agent',
            type: 'notification',
            timestamp: new Date(),
            payload: 'activate'
          });
          
          vscode.window.setStatusBarMessage('CoderAgent attivato', 3000);
          agentLogger.info('CoderAgent attivato');
        }
        
      } catch (error) {
        agentLogger.error('Errore nel toggle del CoderAgent', error as Error);
        vscode.window.showErrorMessage(`Errore: ${(error as Error).message}`);
      }
    }
  );
  
  disposables.push(runAgentCommand, analyzeFileCommand, sendCoderInstructionCommand, showAgentStatusCommand, toggleCoderAgentCommand);
  return disposables;
}

/**
 * Genera un UUID v4
 */
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
} 