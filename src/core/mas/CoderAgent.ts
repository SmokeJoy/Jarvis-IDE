import { CoderAgent as ICoderAgent, CoderInstruction, AgentMessage } from './AgentTypes';
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';

/**
 * Implementazione del CoderAgent che opera solo sotto le istruzioni del SupervisorAgent
 * Questo agente è responsabile della generazione e modifica del codice
 */
export class CoderAgent implements ICoderAgent {
  id: string = 'coder-agent';
  name: string = 'CoderAgent';
  mode: 'supervised' = 'supervised';
  isActive: boolean = false;
  currentInstruction?: CoderInstruction;

  private logger = new Logger('CoderAgent');
  private eventEmitter = new EventEmitter();
  private taskInProgress: boolean = false;

  constructor() {
    this.logger.debug('CoderAgent inizializzato in modalità supervised');
  }

  /**
   * Attiva l'agente per ricevere istruzioni
   */
  activate(): void {
    this.isActive = true;
    this.logger.info('CoderAgent attivato');
    this.eventEmitter.emit('status-change', { id: this.id, isActive: true });
  }

  /**
   * Disattiva l'agente
   */
  deactivate(): void {
    // Non consente la disattivazione se c'è un'operazione in corso
    if (this.taskInProgress) {
      this.logger.warn('Impossibile disattivare CoderAgent: task in corso');
      return;
    }

    this.isActive = false;
    this.currentInstruction = undefined;
    this.logger.info('CoderAgent disattivato');
    this.eventEmitter.emit('status-change', { id: this.id, isActive: false });
  }

  /**
   * Esegue un'istruzione ricevuta dal SupervisorAgent
   * @param instruction Istruzione da eseguire
   * @returns Risultato dell'esecuzione
   */
  async executeInstruction(instruction: string): Promise<any> {
    if (!this.isActive) {
      throw new Error('CoderAgent non attivo');
    }

    if (this.taskInProgress) {
      throw new Error('CoderAgent già occupato con un altro task');
    }

    try {
      this.taskInProgress = true;
      this.logger.info(`Esecuzione istruzione: ${instruction}`);

      // Creiamo un'istruzione semplice se non fornita come oggetto
      if (!this.currentInstruction) {
        this.currentInstruction = {
          context: 'Istruzione diretta',
          objective: instruction,
          actions: [instruction],
          constraints: [],
        };
      }

      // Emetti evento di inizio esecuzione
      this.eventEmitter.emit('instruction-started', {
        id: this.id,
        instruction: this.currentInstruction,
      });

      // Simuliamo l'esecuzione dell'istruzione
      // In un'implementazione reale, qui verrebbe eseguita una chiamata a un LLM
      // o ad un altro servizio per generare il codice
      const result = await this.simulateCodeGeneration(instruction);

      // Emetti evento di completamento
      this.eventEmitter.emit('instruction-completed', {
        id: this.id,
        instruction: this.currentInstruction,
        result,
      });

      // Resetta lo stato
      this.currentInstruction = undefined;
      this.taskInProgress = false;

      return result;
    } catch (error) {
      this.logger.error(`Errore nell'esecuzione dell'istruzione: ${error}`);

      // Emetti evento di errore
      this.eventEmitter.emit('instruction-failed', {
        id: this.id,
        instruction: this.currentInstruction,
        error,
      });

      // Resetta lo stato
      this.currentInstruction = undefined;
      this.taskInProgress = false;

      throw error;
    }
  }

  /**
   * Simula la generazione di codice (da sostituire con logica reale)
   * @param instruction Istruzione da eseguire
   * @returns Risultato simulato
   */
  private async simulateCodeGeneration(instruction: string): Promise<any> {
    // Simuliamo un tempo di elaborazione
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Esempio di risposta simulata
    return {
      code: `// Codice generato per: ${instruction}\nfunction example() {\n  console.log("Implementazione simulata");\n}`,
      explanation: `Implementazione simulata per l'istruzione: ${instruction}`,
      status: 'completed',
    };
  }

  /**
   * Annulla l'operazione corrente
   */
  abortCurrentTask(): void {
    if (!this.taskInProgress) {
      this.logger.warn('Nessun task in corso da annullare');
      return;
    }

    this.logger.info('Annullamento del task corrente');

    // Emetti evento di annullamento
    this.eventEmitter.emit('instruction-aborted', {
      id: this.id,
      instruction: this.currentInstruction,
    });

    // Resetta lo stato
    this.currentInstruction = undefined;
    this.taskInProgress = false;
  }

  /**
   * Registra un listener per gli eventi del CoderAgent
   * @param event Nome dell'evento
   * @param listener Funzione da eseguire all'evento
   */
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Rimuove un listener per gli eventi del CoderAgent
   * @param event Nome dell'evento
   * @param listener Funzione da rimuovere
   */
  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Gestisce un messaggio ricevuto
   * @param message Messaggio ricevuto
   */
  handleMessage(message: AgentMessage): void {
    if (message.to !== this.id) {
      return;
    }

    // Verifica che il messaggio provenga dal SupervisorAgent
    if (message.from !== 'supervisor-agent') {
      this.logger.warn(
        `Messaggio ricevuto da ${message.from} ignorato: CoderAgent accetta messaggi solo dal SupervisorAgent`
      );
      return;
    }

    this.logger.debug(`Messaggio ricevuto: ${JSON.stringify(message)}`);

    // Gestione dei vari tipi di messaggi
    switch (message.type) {
      case 'instruction':
        // Converti in istruzione e esegui
        if (typeof message.payload === 'string') {
          this.executeInstruction(message.payload).catch((error) =>
            this.logger.error(`Errore nell'esecuzione: ${error}`)
          );
        } else if (typeof message.payload === 'object') {
          this.currentInstruction = message.payload as CoderInstruction;
          this.executeInstruction(this.currentInstruction.objective).catch((error) =>
            this.logger.error(`Errore nell'esecuzione: ${error}`)
          );
        }
        break;

      case 'notification':
        // Semplice notifica, nessuna azione richiesta
        this.logger.info(`Notifica ricevuta: ${message.payload}`);
        break;

      default:
        this.logger.warn(`Tipo di messaggio non gestito: ${message.type}`);
        break;
    }
  }
}
