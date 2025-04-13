import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Task, AgentStatus } from '../../shared/types/mas.types';
import { Logger } from '../../utils/logger';

/**
 * Interfaccia per i dati persistenti del MAS
 */
interface MasPersistentState {
  timestamp: string;
  tasks: Task[];
  agents: AgentStatus[];
}

/**
 * Servizio per la persistenza dei dati del sistema Multi-Agent
 * Gestisce il salvataggio e il caricamento dello stato della coda dei task e degli agenti
 */
export class MasPersistenceService {
  private static instance: MasPersistenceService;
  private logger: Logger;
  private storageDir: string;
  private storageFile: string;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private lastSavedState: MasPersistentState | null = null;

  /**
   * Costruttore privato (singleton)
   */
  private constructor() {
    this.logger = new Logger('MasPersistenceService');
    this.storageDir = path.join(os.homedir(), '.jarvis-ide', 'mas');
    this.storageFile = path.join(this.storageDir, 'task-queue.json');

    // Assicura che la directory esista
    this.ensureStorageDirectory();
  }

  /**
   * Ottiene l'istanza singleton del servizio
   */
  public static getInstance(): MasPersistenceService {
    if (!MasPersistenceService.instance) {
      MasPersistenceService.instance = new MasPersistenceService();
    }
    return MasPersistenceService.instance;
  }

  /**
   * Assicura che la directory di storage esista
   */
  private ensureStorageDirectory(): void {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
        this.logger.info(`Directory di storage creata: ${this.storageDir}`);
      }
    } catch (error) {
      this.logger.error(`Errore nella creazione della directory di storage: ${error}`);
    }
  }

  /**
   * Salva lo stato del MAS su disco
   * @param tasks Lista dei task da salvare
   * @param agents Lista degli agenti da salvare
   * @returns true se il salvataggio è avvenuto con successo
   */
  public saveState(tasks: Task[], agents: AgentStatus[]): boolean {
    try {
      const state: MasPersistentState = {
        timestamp: new Date().toISOString(),
        tasks,
        agents,
      };

      // Confronta con l'ultimo stato salvato per evitare scritture inutili
      if (this.isStateIdentical(state)) {
        this.logger.debug("Stato identico all'ultimo salvato, salvataggio ignorato");
        return true;
      }

      const jsonContent = JSON.stringify(state, null, 2);
      fs.writeFileSync(this.storageFile, jsonContent, 'utf8');

      const fileSizeKb = Math.round(fs.statSync(this.storageFile).size / 1024);
      this.logger.info(`Stato MAS salvato su disco (${fileSizeKb}KB): ${this.storageFile}`);

      // Memorizza l'ultimo stato salvato
      this.lastSavedState = state;

      return true;
    } catch (error) {
      this.logger.error(`Errore nel salvataggio dello stato MAS: ${error}`);
      return false;
    }
  }

  /**
   * Confronta lo stato attuale con l'ultimo stato salvato
   * @param newState Nuovo stato da confrontare
   * @returns true se gli stati sono identici
   */
  private isStateIdentical(newState: MasPersistentState): boolean {
    if (!this.lastSavedState) return false;

    // Confronto semplificato (ignora il timestamp)
    const tasksEqual = JSON.stringify(newState.tasks) === JSON.stringify(this.lastSavedState.tasks);
    const agentsEqual =
      JSON.stringify(newState.agents) === JSON.stringify(this.lastSavedState.agents);

    return tasksEqual && agentsEqual;
  }

  /**
   * Carica lo stato del MAS da disco
   * @returns Lo stato persistente caricato o null in caso di errore
   */
  public loadState(): MasPersistentState | null {
    try {
      if (!fs.existsSync(this.storageFile)) {
        this.logger.info(`File di stato MAS non trovato: ${this.storageFile}`);
        return null;
      }

      const jsonContent = fs.readFileSync(this.storageFile, 'utf8');
      const state = JSON.parse(jsonContent) as MasPersistentState;

      const fileSizeKb = Math.round(fs.statSync(this.storageFile).size / 1024);
      this.logger.info(`Stato MAS caricato da disco (${fileSizeKb}KB): ${this.storageFile}`);

      // Memorizza l'ultimo stato caricato
      this.lastSavedState = state;

      return state;
    } catch (error) {
      this.logger.error(`Errore nel caricamento dello stato MAS: ${error}`);
      return null;
    }
  }

  /**
   * Avvia il salvataggio automatico dello stato ad intervalli regolari
   * @param tasks Funzione per ottenere i task correnti
   * @param agents Funzione per ottenere gli agenti correnti
   * @param intervalMs Intervallo di salvataggio in millisecondi (default: 60000ms = 1 minuto)
   */
  public startAutoSave(
    tasks: () => Task[],
    agents: () => AgentStatus[],
    intervalMs: number = 60000
  ): void {
    // Ferma eventuali intervalli precedenti
    this.stopAutoSave();

    // Crea un nuovo intervallo
    this.autoSaveInterval = setInterval(() => {
      this.saveState(tasks(), agents());
    }, intervalMs);

    this.logger.info(`Salvataggio automatico avviato (intervallo: ${intervalMs}ms)`);
  }

  /**
   * Ferma il salvataggio automatico
   */
  public stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      this.logger.info('Salvataggio automatico fermato');
    }
  }

  /**
   * Esporta lo stato corrente in un file specificato dall'utente
   */
  public async exportState(tasks: Task[], agents: AgentStatus[]): Promise<void> {
    try {
      const state: MasPersistentState = {
        timestamp: new Date().toISOString(),
        tasks,
        agents,
      };

      const jsonContent = JSON.stringify(state, null, 2);

      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('mas-state.json'),
        filters: {
          JSON: ['json'],
        },
        title: 'Esporta stato MAS',
      });

      if (uri) {
        fs.writeFileSync(uri.fsPath, jsonContent, 'utf8');
        this.logger.info(`Stato MAS esportato in: ${uri.fsPath}`);
        vscode.window.showInformationMessage(`Stato MAS esportato con successo in: ${uri.fsPath}`);
      }
    } catch (error) {
      this.logger.error(`Errore nell'esportazione dello stato MAS: ${error}`);
      vscode.window.showErrorMessage(`Errore nell'esportazione dello stato MAS: ${error}`);
    }
  }

  /**
   * Importa lo stato da un file specificato dall'utente
   */
  public async importState(): Promise<MasPersistentState | null> {
    try {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
          JSON: ['json'],
        },
        title: 'Importa stato MAS',
      });

      if (uris && uris.length > 0) {
        const jsonContent = fs.readFileSync(uris[0].fsPath, 'utf8');
        const state = JSON.parse(jsonContent) as MasPersistentState;

        this.logger.info(`Stato MAS importato da: ${uris[0].fsPath}`);
        vscode.window.showInformationMessage(
          `Stato MAS importato con successo da: ${uris[0].fsPath}`
        );

        return state;
      }

      return null;
    } catch (error) {
      this.logger.error(`Errore nell'importazione dello stato MAS: ${error}`);
      vscode.window.showErrorMessage(`Errore nell'importazione dello stato MAS: ${error}`);
      return null;
    }
  }

  /**
   * Verifica se esistono dati persistenti salvati
   */
  public hasSavedState(): boolean {
    return fs.existsSync(this.storageFile);
  }
}
