/**
 * @file MemoryManager.ts
 * @description Classe per la gestione della memoria del sistema MAS
 */
export class MemoryManager {
  private memory: Map<string, any> = new Map();

  constructor() {
    // Inizializzazione vuota
  }

  /**
   * Ottiene un valore dalla memoria
   * @param key Chiave del valore da recuperare
   * @returns Il valore se esiste, altrimenti null
   */
  public async get(key: string): Promise<any> {
    return this.memory.get(key) || null;
  }

  /**
   * Imposta un valore nella memoria
   * @param key Chiave del valore da impostare
   * @param value Valore da salvare
   */
  public async set(key: string, value: any): Promise<void> {
    this.memory.set(key, value);
  }

  /**
   * Aggiunge un elemento a un array nella memoria
   * @param key Chiave dell'array
   * @param value Valore da aggiungere all'array
   */
  public async append(key: string, value: any): Promise<void> {
    if (!this.memory.has(key)) {
      this.memory.set(key, []);
    }
    
    const arr = this.memory.get(key);
    if (Array.isArray(arr)) {
      arr.push(value);
    } else {
      this.memory.set(key, [value]);
    }
  }

  /**
   * Rimuove un valore dalla memoria
   * @param key Chiave del valore da rimuovere
   */
  public async remove(key: string): Promise<void> {
    this.memory.delete(key);
  }

  /**
   * Svuota tutta la memoria
   */
  public async clear(): Promise<void> {
    this.memory.clear();
  }
} 