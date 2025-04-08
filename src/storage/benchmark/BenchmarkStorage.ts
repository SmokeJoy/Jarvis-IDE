import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { getStoragePath } from '../StoragePath.js';
import { BenchmarkSession, BenchmarkSessionDetail, ProviderStats, TimelineStats } from '../../shared/WebviewMessage.js';

/**
 * Classe per la gestione dello storage dei dati di benchmark
 */
export class BenchmarkStorage {
  private storagePath: string;
  private sessionsDir: string;

  constructor() {
    this.storagePath = getStoragePath();
    this.sessionsDir = path.join(this.storagePath, 'benchmark');
    this.ensureDirectories();
  }

  /**
   * Assicura che tutte le directory necessarie esistano
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
    
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  /**
   * Genera un ID univoco per una sessione
   */
  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Salva una nuova sessione di benchmark
   * @param session I dati della sessione di benchmark
   * @returns L'ID della sessione salvata
   */
  public saveSession(session: Omit<BenchmarkSessionDetail, 'id'>): string {
    const id = this.generateId();
    const sessionWithId: BenchmarkSessionDetail = {
      ...session,
      id,
    };

    const filePath = path.join(this.sessionsDir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(sessionWithId, null, 2));

    return id;
  }

  /**
   * Importa una sessione di benchmark da un file JSON
   * @param filePath Il percorso del file JSON da importare
   * @returns L'ID della sessione importata
   */
  public importSession(filePath: string): string {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const session = JSON.parse(fileContent) as Omit<BenchmarkSessionDetail, 'id'>;
      return this.saveSession(session);
    } catch (error) {
      throw new Error(`Errore durante l'importazione del file: ${error.message}`);
    }
  }

  /**
   * Ottiene tutte le sessioni di benchmark
   * @returns L'elenco delle sessioni di benchmark
   */
  public getSessions(): BenchmarkSession[] {
    this.ensureDirectories();

    try {
      const files = fs.readdirSync(this.sessionsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      return jsonFiles.map(file => {
        const filePath = path.join(this.sessionsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const session = JSON.parse(content) as BenchmarkSessionDetail;

        // Estrae solo le informazioni di riepilogo
        return {
          id: session.id,
          provider: session.provider,
          timestamp: session.timestamp,
          duration: session.duration,
          testCount: session.results.length,
        };
      }).sort((a, b) => b.timestamp - a.timestamp); // Ordina dal più recente
    } catch (error) {
      console.error('Errore durante la lettura delle sessioni di benchmark:', error);
      return [];
    }
  }

  /**
   * Ottiene i dettagli di una specifica sessione di benchmark
   * @param id L'ID della sessione
   * @returns I dettagli della sessione
   */
  public getSession(id: string): BenchmarkSessionDetail | null {
    try {
      const filePath = path.join(this.sessionsDir, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as BenchmarkSessionDetail;
    } catch (error) {
      console.error(`Errore durante la lettura della sessione ${id}:`, error);
      return null;
    }
  }

  /**
   * Elimina una sessione di benchmark
   * @param id L'ID della sessione da eliminare
   * @returns true se l'eliminazione è andata a buon fine, false altrimenti
   */
  public deleteSession(id: string): boolean {
    try {
      const filePath = path.join(this.sessionsDir, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        return false;
      }

      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error(`Errore durante l'eliminazione della sessione ${id}:`, error);
      return false;
    }
  }

  /**
   * Esporta una sessione di benchmark in un file JSON
   * @param id L'ID della sessione da esportare
   * @param exportPath Il percorso dove esportare il file
   * @returns Il percorso del file esportato o null in caso di errore
   */
  public exportSession(id: string, exportPath?: string): string | null {
    try {
      const session = this.getSession(id);
      
      if (!session) {
        return null;
      }

      const fileName = `benchmark_${session.provider}_${new Date(session.timestamp).toISOString().split('T')[0]}.json`;
      const filePath = exportPath || path.join(process.env.HOME || process.env.USERPROFILE || '', 'Downloads', fileName);
      
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
      return filePath;
    } catch (error) {
      console.error(`Errore durante l'esportazione della sessione ${id}:`, error);
      return null;
    }
  }

  /**
   * Calcola le statistiche aggregate per provider per un dato periodo
   * @param days Il numero di giorni da considerare
   * @returns Le statistiche per provider
   */
  public getStats(days: number): Record<string, ProviderStats> {
    try {
      const sessions = this.getSessions();
      const now = Date.now();
      const cutoffTime = now - days * 24 * 60 * 60 * 1000;
      
      // Filtra le sessioni per il periodo specificato
      const filteredSessions = sessions.filter(session => session.timestamp >= cutoffTime);
      
      // Raggruppa le sessioni per provider
      const providers: Record<string, BenchmarkSession[]> = {};
      
      for (const session of filteredSessions) {
        if (!providers[session.provider]) {
          providers[session.provider] = [];
        }
        providers[session.provider].push(session);
      }
      
      const stats: Record<string, ProviderStats> = {};
      
      // Calcola le statistiche per ogni provider
      for (const [provider, providerSessions] of Object.entries(providers)) {
        const sessionIds = providerSessions.map(session => session.id);
        const detailedSessions = sessionIds
          .map(id => this.getSession(id))
          .filter(session => session !== null) as BenchmarkSessionDetail[];
        
        // Raccogli tutti i risultati di test
        const allResults = detailedSessions.flatMap(session => session.results);
        
        if (allResults.length === 0) {
          continue;
        }
        
        // Calcola le statistiche
        const responseTimes = allResults.map(result => result.responseTime);
        const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        const fastestResponseTime = Math.min(...responseTimes);
        const slowestResponseTime = Math.max(...responseTimes);
        
        const inputTokens = allResults.map(result => result.tokens.inputTokens);
        const outputTokens = allResults.map(result => result.tokens.outputTokens);
        
        const avgInputTokens = inputTokens.reduce((sum, tokens) => sum + tokens, 0) / inputTokens.length;
        const avgOutputTokens = outputTokens.reduce((sum, tokens) => sum + tokens, 0) / outputTokens.length;
        
        stats[provider] = {
          avgResponseTime,
          fastestResponseTime,
          slowestResponseTime,
          avgInputTokens,
          avgOutputTokens,
          sessionCount: detailedSessions.length,
          testCount: allResults.length,
        };
      }
      
      return stats;
    } catch (error) {
      console.error('Errore durante il calcolo delle statistiche:', error);
      return {};
    }
  }

  /**
   * Ottiene i dati per la timeline delle prestazioni di un provider
   * @param provider Il nome del provider
   * @param days Il numero di giorni da considerare
   * @returns I dati della timeline
   */
  public getTimeline(provider: string, days: number): TimelineStats[] {
    try {
      const sessions = this.getSessions();
      const now = Date.now();
      const cutoffTime = now - days * 24 * 60 * 60 * 1000;
      
      // Filtra le sessioni per provider e periodo
      const filteredSessions = sessions.filter(
        session => session.provider === provider && session.timestamp >= cutoffTime
      );
      
      const timeline: TimelineStats[] = [];
      
      // Elabora ogni sessione per ottenere i dati della timeline
      for (const session of filteredSessions) {
        const detailedSession = this.getSession(session.id);
        
        if (!detailedSession || detailedSession.results.length === 0) {
          continue;
        }
        
        const responseTimes = detailedSession.results.map(result => result.responseTime);
        const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        
        const inputTokens = detailedSession.results.map(result => result.tokens.inputTokens);
        const outputTokens = detailedSession.results.map(result => result.tokens.outputTokens);
        
        const avgInputTokens = inputTokens.reduce((sum, tokens) => sum + tokens, 0) / inputTokens.length;
        const avgOutputTokens = outputTokens.reduce((sum, tokens) => sum + tokens, 0) / outputTokens.length;
        
        timeline.push({
          date: detailedSession.timestamp,
          avgResponseTime,
          avgInputTokens,
          avgOutputTokens,
          testCount: detailedSession.results.length,
        });
      }
      
      // Ordina per data
      return timeline.sort((a, b) => a.date - b.date);
    } catch (error) {
      console.error(`Errore durante il calcolo della timeline per il provider ${provider}:`, error);
      return [];
    }
  }
} 