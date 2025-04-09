import * as vscode from 'vscode';
import { MasManager } from './MasManager.js.js';
import { TaskQueueService } from './services/TaskQueueService.js.js';
import { MasPersistenceService } from './services/MasPersistenceService.js.js';
import { Logger } from '../utils/logger.js.js';

/**
 * Registra i comandi VS Code per il sistema MAS
 * @param context Contesto dell'estensione VS Code
 * @param masManager Istanza del MasManager
 */
export function registerMasCommands(
  context: vscode.ExtensionContext,
  masManager: MasManager
): void {
  const logger = new Logger('MasCommands');
  const taskQueueService = new TaskQueueService(context, masManager);
  const persistenceService = MasPersistenceService.getInstance();
  
  // Comando per aggiungere un'istruzione (task) a un agente
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.mas.addInstruction', async () => {
      try {
        // Ottieni agenti attivi
        const agents = masManager.getAllAgentsStatus().filter(a => a.isActive);
        
        if (agents.length === 0) {
          vscode.window.showWarningMessage('Non ci sono agenti attivi nel sistema MAS');
          return;
        }
        
        // Selezione dell'agente
        const agentSelected = await vscode.window.showQuickPick(
          agents.map(a => ({ label: a.name, detail: a.id })),
          { placeHolder: 'Seleziona un agente' }
        );
        
        if (!agentSelected) return;
        
        // Input dell'istruzione
        const instruction = await vscode.window.showInputBox({
          prompt: 'Inserisci l\'istruzione per l\'agente',
          placeHolder: 'Cosa vuoi che faccia l\'agente?'
        });
        
        if (!instruction) return;
        
        // Selezione della priorità
        const prioritySelected = await vscode.window.showQuickPick(
          [
            { label: 'Alta', detail: 'high' },
            { label: 'Normale', detail: 'normal' },
            { label: 'Bassa', detail: 'low' }
          ],
          { placeHolder: 'Seleziona la priorità' }
        );
        
        if (!prioritySelected) return;
        
        // Aggiungi il task
        const task = masManager.queueInstruction(
          agentSelected.detail,
          instruction,
          undefined,
          prioritySelected.detail as 'high' | 'normal' | 'low'
        );
        
        // Mostra feedback all'utente
        vscode.window.showInformationMessage(`Task aggiunto con ID: ${task.id}`);
        
        // Avvia l'elaborazione se non è già in corso
        masManager.start();
      } catch (error) {
        vscode.window.showErrorMessage(`Errore nell'aggiunta del task: ${error}`);
      }
    })
  );
  
  // Comando per abortire un task
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.mas.abortTask', async () => {
      try {
        // Ottengo tutti i task nel sistema
        const allTasks = masManager.getAllTasks();
        
        // Filtro i task attivi e in attesa
        const activeTasks = allTasks.filter(task => task.status === 'active');
        const pendingTasks = allTasks.filter(task => task.status === 'pending');
        
        const tasks = [...activeTasks, ...pendingTasks];
        
        if (tasks.length === 0) {
          vscode.window.showInformationMessage('Non ci sono task attivi o in attesa');
          return;
        }
        
        // Mostra la lista di task all'utente
        const taskSelected = await vscode.window.showQuickPick(
          tasks.map(t => ({
            label: `${t.status === 'active' ? '▶ ' : '⏸ '}${t.instruction.content.substring(0, 50)}${t.instruction.content.length > 50 ? '...' : ''}`,
            detail: t.id,
            description: `${t.status === 'active' ? 'In esecuzione' : 'In attesa'} | Agente: ${t.assignedTo || 'Non assegnato'}`
          })),
          { placeHolder: 'Seleziona un task da cancellare' }
        );
        
        if (!taskSelected) return;
        
        // Conferma dall'utente
        const confirmed = await vscode.window.showWarningMessage(
          `Sei sicuro di voler annullare il task "${taskSelected.label}"?`,
          { modal: true },
          'Annulla Task'
        );
        
        if (confirmed !== 'Annulla Task') return;
        
        // Annulla il task
        const aborted = masManager.abortTask(taskSelected.detail);
        
        if (aborted) {
          vscode.window.showInformationMessage(`Task ${taskSelected.detail} annullato con successo`);
        } else {
          vscode.window.showWarningMessage(`Impossibile annullare il task ${taskSelected.detail}`);
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Errore nell'annullamento del task: ${error}`);
      }
    })
  );
  
  // Comando per attivare/disattivare un agente
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.mas.toggleAgent', async () => {
      try {
        // Ottieni tutti gli agenti
        const agents = masManager.getAllAgentsStatus();
        
        if (agents.length === 0) {
          vscode.window.showWarningMessage('Non ci sono agenti nel sistema MAS');
          return;
        }
        
        // Mostra la lista di agenti all'utente
        const agentSelected = await vscode.window.showQuickPick(
          agents.map(a => ({
            label: `${a.isActive ? '✓ ' : '✗ '}${a.name}`,
            detail: a.id,
            description: a.isActive ? 'Attivo' : 'Inattivo'
          })),
          { placeHolder: 'Seleziona un agente da attivare/disattivare' }
        );
        
        if (!agentSelected) return;
        
        // Trova l'agente corrispondente
        const agent = agents.find(a => a.id === agentSelected.detail);
        
        if (agent) {
          // Conferma dall'utente
          const newState = !agent.isActive;
          const confirmed = await vscode.window.showWarningMessage(
            `Sei sicuro di voler ${newState ? 'attivare' : 'disattivare'} l'agente "${agent.name}"?`,
            { modal: true },
            `${newState ? 'Attiva' : 'Disattiva'} Agente`
          );
          
          if (!confirmed) return;
          
          // Aggiorna lo stato dell'agente
          masManager.setAgentActive(agent.id, newState);
          
          vscode.window.showInformationMessage(`Agente ${agent.name} ${newState ? 'attivato' : 'disattivato'} con successo`);
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Errore nell'attivazione/disattivazione dell'agente: ${error}`);
      }
    })
  );
  
  // Comando per mostrare il pannello della coda di task
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.mas.showTaskQueue', () => {
      taskQueueService.openTaskQueueView();
    })
  );
  
  // Comando per salvare manualmente lo stato MAS
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.mas.saveQueueNow', async () => {
      try {
        logger.info('Salvataggio manuale dello stato MAS');
        taskQueueService.saveState();
        vscode.window.showInformationMessage('Stato MAS salvato con successo');
      } catch (error) {
        logger.error(`Errore nel salvataggio manuale dello stato MAS: ${error}`);
        vscode.window.showErrorMessage(`Errore nel salvataggio dello stato MAS: ${error}`);
      }
    })
  );
  
  // Comando per esportare lo stato MAS in un file specifico
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.mas.exportState', async () => {
      try {
        logger.info('Esportazione dello stato MAS');
        await persistenceService.exportState(
          masManager.getAllTasks(),
          masManager.getAllAgentsStatus()
        );
      } catch (error) {
        logger.error(`Errore nell'esportazione dello stato MAS: ${error}`);
        vscode.window.showErrorMessage(`Errore nell'esportazione dello stato MAS: ${error}`);
      }
    })
  );
  
  // Comando per importare lo stato MAS da un file
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.mas.importState', async () => {
      try {
        logger.info('Importazione dello stato MAS');
        const state = await persistenceService.importState();
        
        if (state) {
          // Qui potremmo implementare la logica per ripristinare lo stato importato
          vscode.window.showInformationMessage(`Stato MAS importato: ${state.tasks.length} task e ${state.agents.length} agenti`);
          
          // TODO: Implementare il ripristino dello stato importato
        }
      } catch (error) {
        logger.error(`Errore nell'importazione dello stato MAS: ${error}`);
        vscode.window.showErrorMessage(`Errore nell'importazione dello stato MAS: ${error}`);
      }
    })
  );
} 