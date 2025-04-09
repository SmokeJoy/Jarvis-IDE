import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskResult, TaskStatus, PriorityLevel, Instruction } from '../shared/types/mas.types.js.js';

/**
 * Interfaccia che rappresenta lo stato della coda dei task
 */
interface TaskQueueState {
  total: number;
  pending: number;
  active: Task | null;
  completed: number;
  failed: number;
  priorityDistribution: {
    high: number;
    normal: number;
    low: number;
  };
}

/**
 * Gestisce la coda di task con priorità per il sistema Multi-Agent
 */
export class TaskQueueManager {
  // Code separate per ciascun livello di priorità
  private highPriorityQueue: Task[] = [];
  private normalPriorityQueue: Task[] = [];
  private lowPriorityQueue: Task[] = [];
  
  // Task attualmente in esecuzione
  private activeTask: Task | null = null;
  
  // Storico dei task completati e falliti
  private completedTasks: Task[] = [];
  private failedTasks: Task[] = [];
  
  // Statistiche
  private stats = {
    addedCount: 0,
    completedCount: 0,
    failedCount: 0,
    abortedCount: 0
  };
  
  /**
   * Costruttore del TaskQueueManager
   */
  constructor() {
    // Inizializzazione se necessaria
  }
  
  /**
   * Aggiunge un nuovo task alla coda appropriata in base alla sua priorità
   * @param task Il task da aggiungere
   * @returns Il task aggiunto con il suo ID assegnato
   */
  public addTask(task: Omit<Task, 'id' | 'status' | 'createdAt'>): Task {
    // Crea una copia completa del task con un ID e timestamp
    const newTask: Task = {
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date(),
      ...task,
      instruction: {
        ...task.instruction,
        // Assicura che l'istruzione abbia un ID
        id: task.instruction.id || uuidv4()
      }
    };
    
    // Determina in quale coda aggiungere il task in base alla priorità
    const priority = task.instruction.priority || 'normal';
    
    switch (priority) {
      case 'high':
        this.highPriorityQueue.push(newTask);
        break;
      case 'normal':
        this.normalPriorityQueue.push(newTask);
        break;
      case 'low':
        this.lowPriorityQueue.push(newTask);
        break;
      default:
        this.normalPriorityQueue.push(newTask);
    }
    
    // Aggiorna le statistiche
    this.stats.addedCount++;
    
    return newTask;
  }
  
  /**
   * Ottiene e avvia il prossimo task dalla coda con la priorità più alta
   * @returns Il task avviato o null se non ci sono task in attesa
   */
  public startNextTask(): Task | null {
    // Se c'è già un task attivo, non avviarne un altro
    if (this.activeTask) {
      return null;
    }
    
    // Preleva il prossimo task dalla coda con priorità più alta
    let nextTask: Task | undefined;
    
    if (this.highPriorityQueue.length > 0) {
      nextTask = this.highPriorityQueue.shift();
    } else if (this.normalPriorityQueue.length > 0) {
      nextTask = this.normalPriorityQueue.shift();
    } else if (this.lowPriorityQueue.length > 0) {
      nextTask = this.lowPriorityQueue.shift();
    }
    
    if (nextTask) {
      // Aggiorna lo stato del task
      nextTask.status = 'active';
      nextTask.startedAt = new Date();
      
      // Imposta il task come attivo
      this.activeTask = nextTask;
      
      return nextTask;
    }
    
    return null;
  }
  
  /**
   * Completa il task attualmente attivo
   * @param result Risultato dell'elaborazione del task
   * @returns Il task completato o null se non c'è un task attivo
   */
  public completeActiveTask(result: TaskResult): Task | null {
    if (!this.activeTask) {
      return null;
    }
    
    // Copia il task attivo
    const completedTask = { ...this.activeTask };
    
    // Aggiorna lo stato e il risultato
    completedTask.status = 'completed';
    completedTask.result = result;
    completedTask.completedAt = new Date();
    
    // Aggiungi alla lista dei task completati
    this.completedTasks.push(completedTask);
    
    // Aggiorna le statistiche
    this.stats.completedCount++;
    
    // Reimposta il task attivo
    this.activeTask = null;
    
    return completedTask;
  }
  
  /**
   * Fallisce il task attualmente attivo
   * @param error Messaggio di errore o ragione del fallimento
   * @returns Il task fallito o null se non c'è un task attivo
   */
  public failActiveTask(error: string): Task | null {
    if (!this.activeTask) {
      return null;
    }
    
    // Copia il task attivo
    const failedTask = { ...this.activeTask };
    
    // Aggiorna lo stato e aggiungi l'errore
    failedTask.status = 'failed';
    failedTask.error = error;
    failedTask.completedAt = new Date();
    
    // Aggiungi alla lista dei task falliti
    this.failedTasks.push(failedTask);
    
    // Aggiorna le statistiche
    this.stats.failedCount++;
    
    // Reimposta il task attivo
    this.activeTask = null;
    
    return failedTask;
  }
  
  /**
   * Annulla un task specifico
   * @param taskId ID del task da annullare
   * @returns true se il task è stato annullato, false altrimenti
   */
  public abortTask(taskId: string): boolean {
    // Verifica se il task è quello attivo
    if (this.activeTask && this.activeTask.id === taskId) {
      // Aggiorna lo stato e azzera il task attivo
      this.activeTask.status = 'aborted';
      this.activeTask.completedAt = new Date();
      
      // Aggiungi alla lista dei task falliti
      this.failedTasks.push({ ...this.activeTask });
      
      // Aggiorna le statistiche
      this.stats.abortedCount++;
      
      // Reimposta il task attivo
      this.activeTask = null;
      
      return true;
    }
    
    // Cerca nelle varie code di priorità
    const findAndRemove = (queue: Task[]): boolean => {
      const index = queue.findIndex(task => task.id === taskId);
      
      if (index !== -1) {
        // Aggiorna lo stato del task
        queue[index].status = 'aborted';
        queue[index].completedAt = new Date();
        
        // Aggiungi alla lista dei task falliti
        this.failedTasks.push({ ...queue[index] });
        
        // Rimuovi dalla coda
        queue.splice(index, 1);
        
        // Aggiorna le statistiche
        this.stats.abortedCount++;
        
        return true;
      }
      
      return false;
    };
    
    return (
      findAndRemove(this.highPriorityQueue) ||
      findAndRemove(this.normalPriorityQueue) ||
      findAndRemove(this.lowPriorityQueue)
    );
  }
  
  /**
   * Ottiene il task attualmente in esecuzione
   * @returns Il task attivo o null se non ce n'è nessuno
   */
  public getActiveTask(): Task | null {
    return this.activeTask;
  }
  
  /**
   * Ottiene lo stato corrente della coda dei task
   * @returns Stato della coda dei task
   */
  public getQueueState(): TaskQueueState {
    return {
      total: 
        this.highPriorityQueue.length + 
        this.normalPriorityQueue.length + 
        this.lowPriorityQueue.length +
        (this.activeTask ? 1 : 0) +
        this.completedTasks.length +
        this.failedTasks.length,
      pending: 
        this.highPriorityQueue.length + 
        this.normalPriorityQueue.length + 
        this.lowPriorityQueue.length,
      active: this.activeTask,
      completed: this.completedTasks.length,
      failed: this.failedTasks.length,
      priorityDistribution: {
        high: this.highPriorityQueue.length,
        normal: this.normalPriorityQueue.length,
        low: this.lowPriorityQueue.length
      }
    };
  }
  
  /**
   * Ottiene tutti i task, inclusi quelli completati e falliti
   * @returns Un array di tutti i task
   */
  public getAllTasks(): Task[] {
    return [
      ...this.highPriorityQueue,
      ...this.normalPriorityQueue,
      ...this.lowPriorityQueue,
      ...(this.activeTask ? [this.activeTask] : []),
      ...this.completedTasks,
      ...this.failedTasks
    ];
  }
  
  /**
   * Ottiene la storia dei task completati
   * @param limit Numero massimo di task da restituire (opzionale)
   * @returns Array di task completati
   */
  public getCompletedTasks(limit?: number): Task[] {
    const sorted = [...this.completedTasks].sort((a, b) => {
      return (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0);
    });
    
    return limit ? sorted.slice(0, limit) : sorted;
  }
  
  /**
   * Ottiene la storia dei task falliti
   * @param limit Numero massimo di task da restituire (opzionale)
   * @returns Array di task falliti
   */
  public getFailedTasks(limit?: number): Task[] {
    const sorted = [...this.failedTasks].sort((a, b) => {
      return (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0);
    });
    
    return limit ? sorted.slice(0, limit) : sorted;
  }
  
  /**
   * Ottiene le statistiche della coda
   * @returns Statistiche dei task elaborati
   */
  public getStats() {
    return { ...this.stats };
  }
  
  /**
   * Pulisce la cronologia dei task completati e falliti
   */
  public clearHistory(): void {
    this.completedTasks = [];
    this.failedTasks = [];
  }
  
  /**
   * Ripristina completamente la coda dei task
   */
  public reset(): void {
    this.highPriorityQueue = [];
    this.normalPriorityQueue = [];
    this.lowPriorityQueue = [];
    this.activeTask = null;
    this.completedTasks = [];
    this.failedTasks = [];
    this.stats = {
      addedCount: 0,
      completedCount: 0,
      failedCount: 0,
      abortedCount: 0
    };
  }
  
  /**
   * Ottiene tutti i task attualmente in coda ad alta priorità
   * @returns Array dei task ad alta priorità
   */
  public getHighPriorityTasks(): Task[] {
    return [...this.highPriorityQueue];
  }
  
  /**
   * Ottiene tutti i task attualmente in coda a priorità normale
   * @returns Array dei task a priorità normale
   */
  public getNormalPriorityTasks(): Task[] {
    return [...this.normalPriorityQueue];
  }
  
  /**
   * Ottiene tutti i task attualmente in coda a bassa priorità
   * @returns Array dei task a bassa priorità
   */
  public getLowPriorityTasks(): Task[] {
    return [...this.lowPriorityQueue];
  }
} 