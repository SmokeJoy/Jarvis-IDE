/**
 * Modulo per la persistenza e gestione cronologica dei benchmark LLM
 * Permette di salvare, recuperare e analizzare lo storico dei test nel tempo
 */

import fs from 'fs/promises';
import path from 'path';

export interface BenchmarkResult {
  id: string;
  provider: string;
  model: string;
  type: 'call' | 'stream';
  timestamp: string;
  duration: number;
  responseLength: number;
  prompt?: any;
  response?: string;
  error?: string;
}

export interface BenchmarkSession {
  id: string;
  date: string;
  description: string;
  environment: string;
  results: BenchmarkResult[];
}

export interface BenchmarkHistory {
  sessions: BenchmarkSession[];
  lastUpdated: string;
}

export class BenchmarkStorage {
  private historyPath: string;
  private history: BenchmarkHistory;
  
  /**
   * Inizializza lo storage dei benchmark
   * @param storagePath Percorso della directory di archiviazione
   */
  constructor(storagePath: string = 'benchmark') {
    this.historyPath = path.join(process.cwd(), storagePath, 'history.json');
    this.history = {
      sessions: [],
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Inizializza lo storage e carica la storia esistente
   */
  async initialize(): Promise<void> {
    try {
      // Assicura che la directory esista
      const storageDir = path.dirname(this.historyPath);
      await fs.mkdir(storageDir, { recursive: true });
      
      // Tenta di leggere la storia esistente
      try {
        const data = await fs.readFile(this.historyPath, 'utf8');
        this.history = JSON.parse(data);
        console.log(`✅ Storia benchmark caricata da ${this.historyPath}`);
      } catch (err) {
        // Se il file non esiste, inizializza una nuova storia
        if (err.code === 'ENOENT') {
          await this.saveHistory();
          console.log(`✅ Inizializzata nuova storia benchmark in ${this.historyPath}`);
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error(`❌ Errore nell'inizializzazione dello storage benchmark: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Salva la storia dei benchmark su disco
   */
  private async saveHistory(): Promise<void> {
    try {
      this.history.lastUpdated = new Date().toISOString();
      await fs.writeFile(
        this.historyPath,
        JSON.stringify(this.history, null, 2),
        'utf8'
      );
    } catch (err) {
      console.error(`❌ Errore nel salvataggio della storia benchmark: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Crea una nuova sessione di benchmark
   * @param description Descrizione della sessione
   * @param environment Informazioni sull'ambiente di test
   * @returns ID della sessione creata
   */
  async createSession(description: string, environment: string = 'development'): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const session: BenchmarkSession = {
      id: sessionId,
      date: new Date().toISOString(),
      description,
      environment,
      results: []
    };
    
    this.history.sessions.push(session);
    await this.saveHistory();
    
    return sessionId;
  }
  
  /**
   * Aggiunge un risultato a una sessione esistente
   * @param sessionId ID della sessione
   * @param result Risultato del benchmark
   */
  async addResult(sessionId: string, result: Omit<BenchmarkResult, 'id'>): Promise<string> {
    const session = this.history.sessions.find(s => s.id === sessionId);
    
    if (!session) {
      throw new Error(`Sessione benchmark con ID ${sessionId} non trovata`);
    }
    
    const resultId = `result_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const completeResult: BenchmarkResult = {
      ...result,
      id: resultId
    };
    
    session.results.push(completeResult);
    await this.saveHistory();
    
    return resultId;
  }
  
  /**
   * Recupera una sessione specifica
   * @param sessionId ID della sessione
   * @returns Sessione di benchmark
   */
  getSession(sessionId: string): BenchmarkSession | undefined {
    return this.history.sessions.find(s => s.id === sessionId);
  }
  
  /**
   * Recupera tutte le sessioni
   * @param limit Numero massimo di sessioni da recuperare
   * @returns Array di sessioni
   */
  getSessions(limit?: number): BenchmarkSession[] {
    // Ordina le sessioni per data (le più recenti prima)
    const sorted = [...this.history.sessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return limit ? sorted.slice(0, limit) : sorted;
  }
  
  /**
   * Importa risultati da un file JSON esistente
   * @param filePath Percorso del file JSON
   * @param description Descrizione della sessione
   */
  async importFromJSON(filePath: string, description: string = 'Importato da file'): Promise<string> {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const importedData = JSON.parse(data);
      
      // Crea una nuova sessione
      const sessionId = await this.createSession(
        description,
        `Importato da ${path.basename(filePath)}`
      );
      
      // Se è un array di oggetti
      if (Array.isArray(importedData)) {
        for (const item of importedData) {
          await this.addResult(sessionId, this.normalizeResult(item));
        }
      } 
      // Se è un oggetto singolo
      else if (typeof importedData === 'object') {
        await this.addResult(sessionId, this.normalizeResult(importedData));
      }
      
      return sessionId;
    } catch (err) {
      console.error(`❌ Errore nell'importazione da ${filePath}: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Importa tutti i file JSON dalla directory dei risultati
   * @param resultsDir Directory contenente i file di risultati
   * @param description Descrizione della sessione
   */
  async importFromResultsDir(resultsDir: string = 'results', description?: string): Promise<string> {
    try {
      const fullPath = path.join(process.cwd(), resultsDir);
      const files = await fs.readdir(fullPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      if (jsonFiles.length === 0) {
        throw new Error(`Nessun file JSON trovato in ${fullPath}`);
      }
      
      // Estrai timestamp dal nome del primo file (se presente)
      const timestampMatch = jsonFiles[0].match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
      const dateString = timestampMatch 
        ? timestampMatch[0].replace(/-/g, ':').split('T').join(' ') 
        : new Date().toLocaleString();
      
      // Crea una nuova sessione
      const sessionDesc = description || `Test eseguiti il ${dateString}`;
      const sessionId = await this.createSession(
        sessionDesc,
        `Importato da directory ${resultsDir}`
      );
      
      // Importa tutti i file
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(fullPath, file);
          const data = await fs.readFile(filePath, 'utf8');
          const importedData = JSON.parse(data);
          
          // Determina il tipo dal nome del file
          const type = file.includes('_stream_') ? 'stream' : 'call';
          
          // Normalizza e aggiungi il risultato
          const result = this.normalizeResult(importedData, type);
          await this.addResult(sessionId, result);
          
        } catch (err) {
          console.warn(`⚠️ Errore nell'importazione di ${file}: ${err.message}`);
        }
      }
      
      console.log(`✅ Importati ${jsonFiles.length} file da ${fullPath}`);
      return sessionId;
    } catch (err) {
      console.error(`❌ Errore nell'importazione dalla directory: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Esporta i dati di benchmark in formato JSON
   * @param filePath Percorso di destinazione
   * @param sessionId ID della sessione (opzionale)
   */
  async exportToJSON(filePath: string, sessionId?: string): Promise<void> {
    try {
      let dataToExport: any;
      
      if (sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
          throw new Error(`Sessione con ID ${sessionId} non trovata`);
        }
        dataToExport = session;
      } else {
        dataToExport = this.history;
      }
      
      await fs.writeFile(
        filePath,
        JSON.stringify(dataToExport, null, 2),
        'utf8'
      );
      
      console.log(`✅ Dati benchmark esportati in ${filePath}`);
    } catch (err) {
      console.error(`❌ Errore nell'esportazione in ${filePath}: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Ottiene statistiche aggregate per provider
   * @param daysBack Numero di giorni indietro da considerare
   * @returns Statistiche per provider
   */
  getProviderStats(daysBack: number = 30): any {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    // Filtra le sessioni entro il periodo specificato
    const recentSessions = this.history.sessions.filter(
      session => new Date(session.date) >= cutoffDate
    );
    
    // Raccoglie tutti i risultati
    const allResults: BenchmarkResult[] = [];
    recentSessions.forEach(session => {
      allResults.push(...session.results);
    });
    
    // Raggruppa per provider
    const providerStats = {};
    
    for (const result of allResults) {
      const { provider, model, type, duration, responseLength, error } = result;
      
      if (!providerStats[provider]) {
        providerStats[provider] = {
          provider,
          models: new Set(),
          totalTests: 0,
          callTests: 0,
          streamTests: 0,
          avgCallDuration: 0,
          avgStreamDuration: 0,
          avgCallLength: 0,
          avgStreamLength: 0,
          errors: 0,
          successRate: 0
        };
      }
      
      const stats = providerStats[provider];
      stats.models.add(model);
      stats.totalTests++;
      
      if (error) {
        stats.errors++;
      }
      
      if (type === 'call') {
        stats.callTests++;
        if (!error && duration > 0) {
          stats.avgCallDuration = updateAverage(
            stats.avgCallDuration, 
            duration, 
            stats.callTests
          );
        }
        if (!error && responseLength > 0) {
          stats.avgCallLength = updateAverage(
            stats.avgCallLength, 
            responseLength, 
            stats.callTests
          );
        }
      } else if (type === 'stream') {
        stats.streamTests++;
        if (!error && duration > 0) {
          stats.avgStreamDuration = updateAverage(
            stats.avgStreamDuration, 
            duration, 
            stats.streamTests
          );
        }
        if (!error && responseLength > 0) {
          stats.avgStreamLength = updateAverage(
            stats.avgStreamLength, 
            responseLength, 
            stats.streamTests
          );
        }
      }
    }
    
    // Calcola i tassi di successo e converte i Set in array
    for (const provider in providerStats) {
      const stats = providerStats[provider];
      stats.successRate = (stats.totalTests - stats.errors) / stats.totalTests * 100;
      stats.models = Array.from(stats.models);
    }
    
    return providerStats;
  }
  
  /**
   * Ottiene una timeline delle performance nel tempo
   * @param provider Provider da analizzare
   * @param timeGranularity Granularità temporale ('day' | 'week' | 'month')
   * @returns Dati temporali di performance
   */
  getPerformanceTimeline(provider: string, timeGranularity: 'day' | 'week' | 'month' = 'day'): any {
    // Filtra i risultati per il provider specificato
    const providerResults: BenchmarkResult[] = [];
    
    this.history.sessions.forEach(session => {
      const results = session.results.filter(r => r.provider === provider);
      providerResults.push(...results);
    });
    
    // Raggruppa per periodo di tempo
    const timeline = {};
    
    for (const result of providerResults) {
      const date = new Date(result.timestamp);
      let timeKey: string;
      
      switch (timeGranularity) {
        case 'day':
          timeKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          const weekDate = new Date(date);
          weekDate.setDate(date.getDate() - date.getDay()); // Domenica della settimana
          timeKey = weekDate.toISOString().split('T')[0]; // YYYY-MM-DD (domenica)
          break;
        case 'month':
          timeKey = date.toISOString().substr(0, 7); // YYYY-MM
          break;
      }
      
      if (!timeline[timeKey]) {
        timeline[timeKey] = {
          period: timeKey,
          callCount: 0,
          streamCount: 0,
          avgCallDuration: 0,
          avgStreamDuration: 0,
          errorRate: 0,
          totalTests: 0,
          errors: 0
        };
      }
      
      const timeStats = timeline[timeKey];
      timeStats.totalTests++;
      
      if (result.error) {
        timeStats.errors++;
      }
      
      if (result.type === 'call') {
        timeStats.callCount++;
        if (!result.error && result.duration > 0) {
          timeStats.avgCallDuration = updateAverage(
            timeStats.avgCallDuration, 
            result.duration, 
            timeStats.callCount
          );
        }
      } else if (result.type === 'stream') {
        timeStats.streamCount++;
        if (!result.error && result.duration > 0) {
          timeStats.avgStreamDuration = updateAverage(
            timeStats.avgStreamDuration, 
            result.duration, 
            timeStats.streamCount
          );
        }
      }
      
      timeStats.errorRate = (timeStats.errors / timeStats.totalTests) * 100;
    }
    
    // Converti in array ordinato per tempo
    return Object.values(timeline).sort((a: any, b: any) => a.period.localeCompare(b.period));
  }
  
  /**
   * Elimina una sessione
   * @param sessionId ID della sessione da eliminare
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const initialLength = this.history.sessions.length;
    this.history.sessions = this.history.sessions.filter(s => s.id !== sessionId);
    
    if (this.history.sessions.length === initialLength) {
      return false; // Nessuna sessione trovata con quell'ID
    }
    
    await this.saveHistory();
    return true;
  }
  
  /**
   * Pulisce tutti i dati di benchmark
   * @param confirm Stringa di conferma (deve essere 'CONFIRM')
   */
  async clearAllData(confirm: string): Promise<void> {
    if (confirm !== 'CONFIRM') {
      throw new Error('Per cancellare tutti i dati, passa "CONFIRM" come parametro');
    }
    
    this.history = {
      sessions: [],
      lastUpdated: new Date().toISOString()
    };
    
    await this.saveHistory();
    console.log('✅ Tutti i dati di benchmark sono stati cancellati');
  }
  
  /**
   * Normalizza un risultato importato in un formato standard
   */
  private normalizeResult(data: any, inferredType?: 'call' | 'stream'): Omit<BenchmarkResult, 'id'> {
    return {
      provider: data.provider || 'unknown',
      model: data.model || 'unknown',
      type: inferredType || data.type || (data.responseLength ? 'stream' : 'call'),
      timestamp: data.timestamp || new Date().toISOString(),
      duration: typeof data.duration === 'number' ? data.duration : 0,
      responseLength: data.responseLength || (data.response ? data.response.length : 0),
      prompt: data.prompt,
      response: data.response,
      error: data.error
    };
  }
}

/**
 * Funzione di utilità per calcolare media incrementale
 */
function updateAverage(currentAvg: number, newValue: number, count: number): number {
  if (count === 1) return newValue;
  return currentAvg + (newValue - currentAvg) / count;
} 