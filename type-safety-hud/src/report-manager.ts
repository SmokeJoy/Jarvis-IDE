import fs from 'fs';
import path from 'path';
import { 
  FileReport, 
  RefactorMap, 
  RefactorStatistics,
  RefactorStatus,
  PriorityLevel,
  ReportFile,
  TrendData,
  TrendDataPoint
} from './types';

/**
 * Manager per la gestione dei report di refactoring
 */
export class ReportManager {
  private reportPath: string;
  private trendPath: string;

  /**
   * Crea una nuova istanza del gestore dei report
   * @param reportPath Percorso del file di report
   * @param trendPath Percorso del file di trend
   */
  constructor(reportPath: string, trendPath: string) {
    this.reportPath = reportPath;
    this.trendPath = trendPath;
  }

  /**
   * Carica un report dal file system
   * @returns Il report caricato o null se non esiste
   */
  public loadReport(): ReportFile | null {
    try {
      if (!fs.existsSync(this.reportPath)) {
        return null;
      }
      
      const fileContent = fs.readFileSync(this.reportPath, 'utf-8');
      return JSON.parse(fileContent) as ReportFile;
    } catch (error) {
      console.error(`Errore nel caricamento del report: ${error}`);
      return null;
    }
  }

  /**
   * Salva un report nel file system
   * @param report Report da salvare
   */
  public saveReport(report: ReportFile): void {
    try {
      const dirPath = path.dirname(this.reportPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(
        this.reportPath,
        JSON.stringify(report, null, 2),
        'utf-8'
      );
      
      console.log(`Report salvato con successo in: ${this.reportPath}`);
    } catch (error) {
      console.error(`Errore nel salvataggio del report: ${error}`);
    }
  }

  /**
   * Carica i dati di trend dal file system
   * @returns I dati di trend caricati o null se non esistono
   */
  public loadTrendData(): TrendData | null {
    try {
      if (!fs.existsSync(this.trendPath)) {
        return {
          points: [],
          lastUpdated: new Date().toISOString()
        };
      }
      
      const fileContent = fs.readFileSync(this.trendPath, 'utf-8');
      return JSON.parse(fileContent) as TrendData;
    } catch (error) {
      console.error(`Errore nel caricamento dei dati di trend: ${error}`);
      return null;
    }
  }

  /**
   * Salva i dati di trend nel file system
   * @param trendData Dati di trend da salvare
   */
  public saveTrendData(trendData: TrendData): void {
    try {
      const dirPath = path.dirname(this.trendPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(
        this.trendPath,
        JSON.stringify(trendData, null, 2),
        'utf-8'
      );
      
      console.log(`Dati di trend salvati con successo in: ${this.trendPath}`);
    } catch (error) {
      console.error(`Errore nel salvataggio dei dati di trend: ${error}`);
    }
  }

  /**
   * Aggiorna i dati di trend con le nuove statistiche
   * @param statistics Statistiche da aggiungere ai dati di trend
   */
  public updateTrendData(statistics: RefactorStatistics): void {
    const trendData = this.loadTrendData() || {
      points: [],
      lastUpdated: new Date().toISOString()
    };
    
    const newDataPoint: TrendDataPoint = {
      date: new Date().toISOString(),
      totalFiles: statistics.totalFiles,
      filesWithAny: statistics.filesWithAnyCount,
      filesWithJsImports: statistics.filesWithJsImportsCount,
      totalAnyCount: statistics.totalAnyCount,
      totalJsImports: statistics.totalJsImportsCount,
      completed: statistics.completedCount,
      inProgress: statistics.inProgressCount,
      pending: statistics.pendingCount
    };
    
    trendData.points.push(newDataPoint);
    trendData.lastUpdated = new Date().toISOString();
    
    this.saveTrendData(trendData);
  }

  /**
   * Genera le statistiche a partire dalla mappa di refactoring
   * @param refactorMap Mappa di refactoring
   * @returns Statistiche generate
   */
  public generateStatistics(refactorMap: RefactorMap): RefactorStatistics {
    const filePaths = Object.keys(refactorMap);
    const totalFiles = filePaths.length;
    
    // Inizializza i contatori
    let filesWithAnyCount = 0;
    let filesWithJsImportsCount = 0;
    let totalAnyCount = 0;
    let totalJsImportsCount = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let pendingCount = 0;
    let highPriorityCount = 0;
    let mediumPriorityCount = 0;
    let lowPriorityCount = 0;
    
    // Variabile per tenere traccia del file più critico
    let topCriticalFile: {
      filePath: string;
      anyCount: number;
      jsImportsCount: number;
      priority: PriorityLevel;
      status: RefactorStatus;
      lastAnalyzed: string;
    } | null = null;
    
    // Calcola statistiche
    for (const filePath of filePaths) {
      const report = refactorMap[filePath];
      
      // Conteggia file con 'any' e import .js
      if (report.anyCount > 0) {
        filesWithAnyCount++;
        totalAnyCount += report.anyCount;
      }
      
      if (report.jsImportsCount > 0) {
        filesWithJsImportsCount++;
        totalJsImportsCount += report.jsImportsCount;
      }
      
      // Conteggia stato di refactoring
      if (report.status === 'COMPLETED') {
        completedCount++;
      } else if (report.status === 'IN_PROGRESS') {
        inProgressCount++;
      } else if (report.status === 'PENDING') {
        pendingCount++;
      }
      
      // Conteggia priorità
      if (report.priority === 'HIGH') {
        highPriorityCount++;
      } else if (report.priority === 'MEDIUM') {
        mediumPriorityCount++;
      } else if (report.priority === 'LOW') {
        lowPriorityCount++;
      }
      
      // Determina se questo è il file più critico
      const isCriticalFile = report.status !== 'COMPLETED' && 
        (report.anyCount > 0 || report.jsImportsCount > 0);
      
      if (isCriticalFile) {
        const currentPriorityValue = this.getPriorityValue(report.priority);
        
        if (!topCriticalFile || 
            this.getPriorityValue(topCriticalFile.priority) < currentPriorityValue ||
            (this.getPriorityValue(topCriticalFile.priority) === currentPriorityValue && 
             (report.anyCount + report.jsImportsCount) > 
             (topCriticalFile.anyCount + topCriticalFile.jsImportsCount))) {
          topCriticalFile = {
            filePath,
            anyCount: report.anyCount,
            jsImportsCount: report.jsImportsCount,
            priority: report.priority,
            status: report.status,
            lastAnalyzed: report.lastAnalyzed
          };
        }
      }
    }
    
    // Calcola percentuali
    const filesWithAnyPercentage = this.calculatePercentage(filesWithAnyCount, totalFiles);
    const filesWithJsImportsPercentage = this.calculatePercentage(filesWithJsImportsCount, totalFiles);
    const completedPercentage = this.calculatePercentage(completedCount, totalFiles);
    const inProgressPercentage = this.calculatePercentage(inProgressCount, totalFiles);
    const pendingPercentage = this.calculatePercentage(pendingCount, totalFiles);
    
    return {
      totalFiles,
      filesWithAnyCount,
      filesWithAnyPercentage,
      filesWithJsImportsCount,
      filesWithJsImportsPercentage,
      totalAnyCount,
      totalJsImportsCount,
      completedCount,
      completedPercentage,
      inProgressCount,
      inProgressPercentage,
      pendingCount,
      pendingPercentage,
      highPriorityCount,
      mediumPriorityCount,
      lowPriorityCount,
      topCriticalFile
    };
  }

  /**
   * Calcola una percentuale
   * @param value Valore
   * @param total Totale
   * @returns Percentuale calcolata
   */
  private calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return parseFloat((value / total * 100).toFixed(1));
  }

  /**
   * Ottiene il valore numerico di una priorità
   * @param priority Livello di priorità
   * @returns Valore numerico
   */
  private getPriorityValue(priority: PriorityLevel): number {
    switch (priority) {
      case 'HIGH': return 2;
      case 'MEDIUM': return 1;
      case 'LOW': return 0;
      default: return 0;
    }
  }
} 