import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import type { SettingsManager, Settings } from '../shared/settings.js';
import { FileManager } from './FileManager.js';
import { sendPromptToLLM } from './sendPromptToLLM.js';
import { Logger } from '../utils/logger.js';
import { compileDotnetProject } from '../utils/compileDotnetProject.js';
import { AvailableModel } from '../shared/types/settings.types.js';

export interface AgentResponse {
  action: string;
  path?: string;
  content?: string;
  command?: string;
  message?: string;
}

export class JarvisAgent {
  private static instance: JarvisAgent;
  private settingsManager: SettingsManager;

  private constructor() {
    this.settingsManager = SettingsManager.getInstance();
  }

  public static getInstance(): JarvisAgent {
    if (!JarvisAgent.instance) {
      JarvisAgent.instance = new JarvisAgent();
    }
    return JarvisAgent.instance;
  }

  /**
   * Esegue un ciclo completo di elaborazione dell'agente
   * - Legge il contesto del progetto
   * - Invia il prompt al modello LLM
   * - Interpreta la risposta
   * - Esegue l'azione richiesta
   * 
   * Il sistema autonomo di Jarvis può:
   * - saveFile: crea o modifica file nel workspace
   * - runCommand: esegue comandi o compila progetti
   * - openFile: apre un file nell'editor
   * - message: mostra un messaggio all'utente
   * 
   * @param userPrompt Prompt fornito dall'utente
   */
  public async runFullLoop(userPrompt: string = ""): Promise<AgentResponse> {
    try {
      Logger.info("Avvio loop dell'agente Jarvis");
      
      // Carica le impostazioni
      const settings = await this.settingsManager.loadSettings();
      if (!settings) {
        throw new Error("Impossibile caricare le impostazioni");
      }
      
      // Seleziona il modello appropriato
      const selectedModel = this.getSelectedModel(settings);
      if (!selectedModel) {
        throw new Error("Nessun modello LLM disponibile. Aggiungi un modello nelle impostazioni.");
      }
      
      // Log del modello selezionato
      Logger.info(`Utilizzo modello: ${selectedModel.label} (${selectedModel.provider})`);
      
      // Ottieni il system prompt
      const systemPrompt = await this.settingsManager.getSystemPrompt();
      
      // Determina le estensioni di file da leggere basandosi sulla modalità coder
      const isCoder = selectedModel.coder || settings.coder_mode;
      const extensions = isCoder 
        ? ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.cs'] 
        : ['.md', '.txt', '.json'];
      
      // Leggi i file del progetto per generare il contesto
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
      const context = await FileManager.readProjectFiles(workspaceRoot, extensions);
      
      Logger.info(`Contesto generato da ${context.numFiles} file`);
      
      // Costruisci il prompt completo
      const fullPrompt = `
# JARVIS SYSTEM PROMPT
${systemPrompt}

# USER CONTEXT
${userPrompt ? `Richiesta utente: ${userPrompt}\n\n` : ''}
Di seguito troverai il codice sorgente pertinente. Analizza questi file e rispondi con un piano d'azione formattato come JSON.

${context.content}

# ISTRUZIONI RISPOSTA
Rispondi con un oggetto JSON nel seguente formato:
\`\`\`json
{
  "action": "saveFile", // Una tra: saveFile, runCommand, openFile, message
  "path": "percorso/del/file.ts", // Per action=saveFile o openFile
  "content": "// contenuto del file", // Per action=saveFile
  "command": "compile", // Per action=runCommand
  "message": "Messaggio per l'utente" // Per action=message
}
\`\`\`
`;

      // Aggiorna le impostazioni con il modello selezionato
      const updatedSettings: Settings = {
        ...settings,
        provider: selectedModel.provider as any,
        model: selectedModel.value,
        apiConfiguration: {
          ...settings.apiConfiguration,
          provider: selectedModel.provider,
          apiKey: selectedModel.apiKey || settings.apiConfiguration.apiKey,
          baseUrl: selectedModel.endpoint || settings.apiConfiguration.baseUrl
        }
      };

      // Invia il prompt al modello LLM
      const result = await sendPromptToLLM(fullPrompt, updatedSettings);
      
      Logger.info(`Risposta LLM ricevuta: ${result.action}`);
      
      // Esegui l'azione richiesta
      await this.executeAction(result);
      
      return result;
    } catch (error) {
      Logger.error(`Errore nell'esecuzione dell'agente: ${error}`);
      return {
        action: 'message',
        message: `Si è verificato un errore durante l'esecuzione dell'agente: ${error}`
      };
    }
  }
  
  /**
   * Ottiene il modello selezionato dalle impostazioni
   */
  private getSelectedModel(settings: Settings): AvailableModel | null {
    const availableModels = settings.availableModels || [];
    
    // Se non ci sono modelli, restituisci null
    if (availableModels.length === 0) {
      return null;
    }
    
    // Cerca il modello selezionato dall'utente
    const selectedModel = availableModels.find(m => m.value === settings.model);
    
    // Se non è selezionato nessun modello, usa il primo disponibile
    return selectedModel || availableModels[0];
  }
  
  /**
   * Esegue l'azione specificata nella risposta dell'agente
   */
  private async executeAction(response: AgentResponse): Promise<void> {
    switch (response.action) {
      case 'saveFile':
        if (response.path && response.content) {
          // Rendi il percorso assoluto se è relativo
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
          const filePath = path.isAbsolute(response.path) 
            ? response.path 
            : path.join(workspaceRoot, response.path);
          
          await FileManager.writeFile(filePath, response.content);
          Logger.info(`File salvato: ${filePath}`);
          
          // Apri il file nell'editor
          const uri = vscode.Uri.file(filePath);
          await vscode.window.showTextDocument(uri);
        }
        break;
        
      case 'runCommand':
        if (response.command) {
          Logger.info(`Esecuzione comando: ${response.command}`);
          
          if (response.command === 'compile' || response.command === 'build') {
            try {
              // Utilizza compileDotnetProject per compilare il progetto
              const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
              const output = await compileDotnetProject(workspaceRoot);
              
              vscode.window.showInformationMessage('Compilazione completata con successo');
              
              // Mostra l'output in un canale dedicato
              const buildChannel = vscode.window.createOutputChannel('Jarvis Build');
              buildChannel.clear();
              buildChannel.append(output);
              buildChannel.show();
            } catch (error) {
              Logger.error(`Errore durante la compilazione: ${error}`);
              vscode.window.showErrorMessage(`Errore durante la compilazione: ${error}`);
            }
          } else {
            // Esegui il comando specificato come comando VS Code
            await vscode.commands.executeCommand(response.command);
          }
        }
        break;
        
      case 'openFile':
        if (response.path) {
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
          const filePath = path.isAbsolute(response.path) 
            ? response.path 
            : path.join(workspaceRoot, response.path);
          
          const uri = vscode.Uri.file(filePath);
          await vscode.window.showTextDocument(uri);
          Logger.info(`File aperto: ${filePath}`);
        }
        break;
        
      case 'message':
      default:
        // Non serve fare nulla per i messaggi, verranno solo visualizzati
        break;
    }
  }
} 