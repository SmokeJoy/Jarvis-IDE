/**
 * Pattern Detector per Jarvis-IDE
 * 
 * Questo modulo implementa un sistema di rilevamento di pattern pericolosi nei messaggi
 * basato su espressioni regolari, euristica e confronto con database di pattern noti.
 */

/**
 * Tipo di pattern pericoloso
 */
export enum PatternType {
  CODE_INJECTION = 'CODE_INJECTION',     // Iniezione di codice
  COMMAND_EXECUTION = 'COMMAND_EXECUTION', // Esecuzione di comandi
  FILEPATH_MANIPULATION = 'FILEPATH_MANIPULATION', // Manipolazione di percorsi file
  AUTH_BYPASS = 'AUTH_BYPASS',           // Bypass di autenticazione
  PROMPT_INJECTION = 'PROMPT_INJECTION', // Iniezione di prompt
  DATA_EXFILTRATION = 'DATA_EXFILTRATION', // Esfiltrazione di dati
  RESOURCE_EXHAUSTION = 'RESOURCE_EXHAUSTION', // Esaurimento risorse
  OTHER = 'OTHER',                       // Altri pattern pericolosi
}

/**
 * Pattern rilevato nel contenuto
 */
export interface DetectedPattern {
  type: PatternType;              // Tipo di pattern
  patternId: string;              // ID univoco del pattern
  description: string;            // Descrizione leggibile
  matchedText: string;            // Testo che ha fatto match
  location: {                     // Posizione nel testo
    start: number;
    end: number;
  };
  confidence: number;             // Livello di confidenza (0-1)
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // Gravità
  suggestedAction?: 'BLOCK' | 'SANITIZE' | 'FLAG'; // Azione suggerita
}

/**
 * Definizione di un pattern
 */
export interface PatternDefinition {
  id: string;                     // ID univoco del pattern
  name: string;                   // Nome del pattern
  type: PatternType;              // Categoria del pattern
  description: string;            // Descrizione dettagliata
  regex: RegExp;                  // Espressione regolare per rilevare il pattern
  caseSensitive: boolean;         // Se il pattern è case sensitive
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // Gravità predefinita
  falsePositiveExamples?: string[]; // Esempi di falsi positivi per migliorare l'algoritmo
  contextRules?: {                // Regole di contesto per migliorare la precisione
    requiresNearby?: string[];    // Pattern che devono essere presenti nelle vicinanze
    excludesNearby?: string[];    // Pattern che non devono essere presenti nelle vicinanze
    contextWindowSize?: number;   // Dimensione della finestra di contesto (caratteri)
  };
}

/**
 * Configurazione del detector
 */
export interface PatternDetectorConfig {
  minConfidence: number;              // Soglia minima di confidenza per segnalare un pattern
  maxPatternLength: number;           // Lunghezza massima del pattern da rilevare
  maxPatternsToReport: number;        // Numero massimo di pattern da riportare
  enabledPatternTypes: PatternType[]; // Tipi di pattern abilitati
  customPatterns?: PatternDefinition[]; // Pattern personalizzati
  excludedPatternIds?: string[];      // ID dei pattern da escludere
  contextAnalysisEnabled: boolean;    // Abilita l'analisi del contesto
}

/**
 * Risultato dell'analisi dei pattern
 */
export interface PatternAnalysisResult {
  detectedPatterns: DetectedPattern[];  // Pattern rilevati
  highestSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE'; // Gravità massima trovata
  overallRiskScore: number;           // Punteggio di rischio complessivo (0-100)
  analysisTime: number;               // Tempo impiegato per l'analisi (ms)
  suggestedAction: 'ALLOW' | 'BLOCK' | 'SANITIZE' | 'FLAG'; // Azione suggerita
  sanitizedContent?: string;          // Contenuto sanitizzato (se disponibile)
  metadata: {                         // Metadati dell'analisi
    totalPatterns: number;            // Numero totale di pattern controllati
    patternMatchAttempts: number;     // Numero di tentativi di match
    contentLength: number;            // Lunghezza del contenuto analizzato
  };
}

/**
 * Database di pattern predefiniti
 */
const PREDEFINED_PATTERNS: PatternDefinition[] = [
  {
    id: 'EVAL_JS',
    name: 'JavaScript eval()',
    type: PatternType.CODE_INJECTION,
    description: 'Tentativo di utilizzo della funzione eval() di JavaScript',
    regex: /\beval\s*\((?:[^)(]|\([^)(]*\))*\)/g,
    caseSensitive: false,
    severity: 'HIGH',
    contextRules: {
      excludesNearby: ['console.log', 'test case'],
      contextWindowSize: 100
    }
  },
  {
    id: 'EXEC_CMD',
    name: 'Command Execution',
    type: PatternType.COMMAND_EXECUTION,
    description: 'Tentativo di esecuzione di comandi tramite exec(), spawn() o system()',
    regex: /\b(?:exec|spawn|system|subprocess\.call|subprocess\.Popen|child_process)\s*\((?:[^)(]|\([^)(]*\))*\)/g,
    caseSensitive: false,
    severity: 'CRITICAL'
  },
  {
    id: 'RM_RF',
    name: 'Recursive File Deletion',
    type: PatternType.COMMAND_EXECUTION,
    description: 'Comando di eliminazione ricorsiva di file',
    regex: /\brm\s+(-r|-f|--recursive|--force|-rf|-fr)\b|\brmdir\s+\/s\b/g,
    caseSensitive: false,
    severity: 'CRITICAL'
  },
  {
    id: 'PATH_TRAVERSAL',
    name: 'Path Traversal',
    type: PatternType.FILEPATH_MANIPULATION,
    description: 'Tentativo di attraversamento di directory con "../"',
    regex: /(?:\.\.\/)(?:\.\.\/)*/g,
    caseSensitive: true,
    severity: 'HIGH'
  },
  {
    id: 'PROMPT_ESCAPE',
    name: 'Prompt Escape',
    type: PatternType.PROMPT_INJECTION,
    description: 'Tentativo di uscire dalle istruzioni del prompt con markers come "[INSTRUCTIONS]:"',
    regex: /\[(INSTRUCTIONS|PROMPT|SYSTEM|USER|AI|ASSISTANT|IGNORE PREVIOUS|IGNORE ABOVE)\]:|<\!--.*?-->|<\[.*?\]>/gi,
    caseSensitive: false,
    severity: 'MEDIUM'
  },
  {
    id: 'DATA_EXFIL_URL',
    name: 'Data Exfiltration URL',
    type: PatternType.DATA_EXFILTRATION,
    description: 'URL potenzialmente utilizzato per esfiltrazione dati',
    regex: /\b(https?:\/\/(?!localhost|127\.0\.0\.1)[^\s"'<>()[\]{}]+\.(com|net|org|io)\/[^\s"'<>()[\]{}]*\?.*?=)/gi,
    caseSensitive: false,
    severity: 'HIGH'
  },
  {
    id: 'INFINITE_LOOP',
    name: 'Potential Infinite Loop',
    type: PatternType.RESOURCE_EXHAUSTION,
    description: 'Potenziale loop infinito con while(true) o for(;;)',
    regex: /\bwhile\s*\(\s*(?:true|1|!\s*0)\s*\)|\bfor\s*\(\s*;\s*;\s*\)/g,
    caseSensitive: false,
    severity: 'MEDIUM',
    falsePositiveExamples: [
      'while(true) { if(condition) break; }',
      'for(;;) { if(x > 10) break; }'
    ]
  },
  {
    id: 'AUTH_TOKEN',
    name: 'Authentication Token',
    type: PatternType.AUTH_BYPASS,
    description: 'Potenziale token di autenticazione o chiave API',
    regex: /(['"`])((?:api[_-]?key|auth[_-]?token|access[_-]?token|secret[_-]?key)[^'"`]*)\1\s*(?::|=)\s*(['"`])([a-zA-Z0-9_\-\.]{20,})\3/gi,
    caseSensitive: false,
    severity: 'HIGH'
  }
];

/**
 * Classe principale per il rilevamento di pattern pericolosi
 */
export class PatternDetector {
  private patterns: PatternDefinition[] = [];
  private config: PatternDetectorConfig;
  
  /**
   * Costruttore
   */
  constructor(config?: Partial<PatternDetectorConfig>) {
    // Configurazione predefinita
    this.config = {
      minConfidence: 0.7,
      maxPatternLength: 500,
      maxPatternsToReport: 20,
      enabledPatternTypes: Object.values(PatternType),
      contextAnalysisEnabled: true,
      ...config
    };
    
    // Inizializza i pattern
    this.loadPredefinedPatterns();
    
    // Aggiungi pattern personalizzati
    if (config?.customPatterns) {
      this.addPatterns(config.customPatterns);
    }
    
    // Rimuovi pattern esclusi
    if (config?.excludedPatternIds) {
      this.excludePatterns(config.excludedPatternIds);
    }
  }
  
  /**
   * Carica i pattern predefiniti
   */
  private loadPredefinedPatterns(): void {
    this.patterns = [...PREDEFINED_PATTERNS];
  }
  
  /**
   * Aggiunge nuovi pattern al detector
   */
  public addPatterns(patterns: PatternDefinition[]): void {
    for (const pattern of patterns) {
      // Verifica se il pattern esiste già
      const existingIndex = this.patterns.findIndex(p => p.id === pattern.id);
      if (existingIndex !== -1) {
        // Sostituisci il pattern esistente
        this.patterns[existingIndex] = pattern;
      } else {
        // Aggiungi il nuovo pattern
        this.patterns.push(pattern);
      }
    }
  }
  
  /**
   * Esclude pattern specifici
   */
  public excludePatterns(patternIds: string[]): void {
    this.patterns = this.patterns.filter(pattern => !patternIds.includes(pattern.id));
  }
  
  /**
   * Analizza il contenuto per rilevare pattern pericolosi
   */
  public analyze(content: string): PatternAnalysisResult {
    const startTime = Date.now();
    
    // Inizializza il risultato
    const result: PatternAnalysisResult = {
      detectedPatterns: [],
      highestSeverity: 'NONE',
      overallRiskScore: 0,
      analysisTime: 0,
      suggestedAction: 'ALLOW',
      metadata: {
        totalPatterns: this.patterns.length,
        patternMatchAttempts: 0,
        contentLength: content.length
      }
    };
    
    // Calcola la severità dei pattern rilevati
    const severityWeights = {
      'LOW': 1,
      'MEDIUM': 10,
      'HIGH': 25,
      'CRITICAL': 50,
      'NONE': 0
    };
    
    let totalSeverityScore = 0;
    let highestSeverityValue = 0;
    
    // Filtra i pattern abilitati
    const enabledPatterns = this.patterns.filter(
      pattern => this.config.enabledPatternTypes.includes(pattern.type)
    );
    
    // Analizza ogni pattern
    for (const pattern of enabledPatterns) {
      result.metadata.patternMatchAttempts++;
      
      // Resetta lastIndex per sicurezza
      pattern.regex.lastIndex = 0;
      
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const matchedText = match[0];
        
        // Verifica la lunghezza del match
        if (matchedText.length > this.config.maxPatternLength) {
          continue;
        }
        
        // Calcola la confidenza basata sul contesto
        let confidence = 1.0; // Valore predefinito
        
        if (this.config.contextAnalysisEnabled && pattern.contextRules) {
          confidence = this.calculateContextConfidence(content, match.index, matchedText.length, pattern);
        }
        
        // Verifica la soglia di confidenza
        if (confidence < this.config.minConfidence) {
          continue;
        }
        
        // Crea il pattern rilevato
        const detectedPattern: DetectedPattern = {
          type: pattern.type,
          patternId: pattern.id,
          description: pattern.description,
          matchedText,
          location: {
            start: match.index,
            end: match.index + matchedText.length
          },
          confidence,
          severity: pattern.severity,
          suggestedAction: this.getSuggestedAction(pattern.severity)
        };
        
        result.detectedPatterns.push(detectedPattern);
        
        // Aggiorna il punteggio di severità
        const severityValue = severityWeights[pattern.severity];
        totalSeverityScore += severityValue * confidence;
        
        // Aggiorna la severità più alta
        if (severityValue > highestSeverityValue) {
          highestSeverityValue = severityValue;
          result.highestSeverity = pattern.severity;
        }
        
        // Limita il numero di pattern riportati
        if (result.detectedPatterns.length >= this.config.maxPatternsToReport) {
          break;
        }
      }
      
      // Se abbiamo raggiunto il limite massimo, interrompi
      if (result.detectedPatterns.length >= this.config.maxPatternsToReport) {
        break;
      }
    }
    
    // Calcola il punteggio di rischio complessivo (0-100)
    const maxPossibleScore = 100; // Punteggio massimo teorico
    result.overallRiskScore = Math.min(
      100,
      Math.round((totalSeverityScore / maxPossibleScore) * 100)
    );
    
    // Determina l'azione suggerita in base al punteggio di rischio
    result.suggestedAction = this.determineSuggestedAction(result.overallRiskScore, result.highestSeverity);
    
    // Se l'azione suggerita è SANITIZE, crea una versione sanitizzata del contenuto
    if (result.suggestedAction === 'SANITIZE') {
      result.sanitizedContent = this.sanitizeContent(content, result.detectedPatterns);
    }
    
    // Calcola il tempo di analisi
    result.analysisTime = Date.now() - startTime;
    
    return result;
  }
  
  /**
   * Calcola la confidenza basata sul contesto
   */
  private calculateContextConfidence(
    content: string, 
    matchIndex: number, 
    matchLength: number, 
    pattern: PatternDefinition
  ): number {
    if (!pattern.contextRules) {
      return 1.0; // Confidenza massima se non ci sono regole di contesto
    }
    
    let confidence = 1.0;
    const contextWindowSize = pattern.contextRules.contextWindowSize || 200;
    
    // Estrai la finestra di contesto
    const startIndex = Math.max(0, matchIndex - contextWindowSize);
    const endIndex = Math.min(content.length, matchIndex + matchLength + contextWindowSize);
    const contextWindow = content.substring(startIndex, endIndex);
    
    // Verifica le regole "requiresNearby"
    if (pattern.contextRules.requiresNearby) {
      const requiredFound = pattern.contextRules.requiresNearby.some(
        required => contextWindow.includes(required)
      );
      
      if (!requiredFound) {
        confidence -= 0.3; // Riduci la confidenza se mancano pattern richiesti
      }
    }
    
    // Verifica le regole "excludesNearby"
    if (pattern.contextRules.excludesNearby) {
      const excludedFound = pattern.contextRules.excludesNearby.some(
        excluded => contextWindow.includes(excluded)
      );
      
      if (excludedFound) {
        confidence -= 0.4; // Riduci la confidenza se sono presenti pattern esclusi
      }
    }
    
    // Verifica se il pattern è in un commento (euristica semplice)
    const isInComment = this.isLikelyInComment(content, matchIndex);
    if (isInComment) {
      confidence -= 0.5; // Riduci la confidenza se il pattern è in un commento
    }
    
    // Limita la confidenza tra 0 e 1
    return Math.max(0, Math.min(1, confidence));
  }
  
  /**
   * Verifica se un match è probabilmente all'interno di un commento
   */
  private isLikelyInComment(content: string, matchIndex: number): boolean {
    // Cerca l'ultimo carattere di nuova riga o inizio del file
    const lineStartIndex = content.lastIndexOf('\n', matchIndex);
    const lineStart = lineStartIndex === -1 ? 0 : lineStartIndex + 1;
    
    // Estrai il testo dalla linea corrente fino al match
    const linePrefix = content.substring(lineStart, matchIndex);
    
    // Verifica se c'è un indicatore di commento prima del match
    return /\/\/|\/\*|#|\*|<!--/.test(linePrefix);
  }
  
  /**
   * Determina l'azione suggerita in base al punteggio di rischio
   */
  private determineSuggestedAction(
    riskScore: number, 
    highestSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE'
  ): 'ALLOW' | 'BLOCK' | 'SANITIZE' | 'FLAG' {
    // Blocca sempre i pattern critici
    if (highestSeverity === 'CRITICAL') {
      return 'BLOCK';
    }
    
    // Determina l'azione in base al punteggio di rischio
    if (riskScore >= 75) {
      return 'BLOCK';
    } else if (riskScore >= 50) {
      return 'SANITIZE';
    } else if (riskScore >= 25) {
      return 'FLAG';
    } else {
      return 'ALLOW';
    }
  }
  
  /**
   * Ottiene l'azione suggerita in base alla severità
   */
  private getSuggestedAction(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): 'BLOCK' | 'SANITIZE' | 'FLAG' {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return 'BLOCK';
      case 'MEDIUM':
        return 'SANITIZE';
      case 'LOW':
      default:
        return 'FLAG';
    }
  }
  
  /**
   * Sanitizza il contenuto rimpiazzando i pattern rilevati
   */
  private sanitizeContent(content: string, detectedPatterns: DetectedPattern[]): string {
    // Clona il contenuto
    let sanitized = content;
    
    // Ordina i pattern per posizione (dalla fine all'inizio per evitare problemi di offset)
    const sortedPatterns = [...detectedPatterns].sort(
      (a, b) => b.location.start - a.location.start
    );
    
    // Sostituisci ogni pattern rilevato
    for (const pattern of sortedPatterns) {
      const { start, end } = pattern.location;
      const replacement = `[CONTENUTO RIMOSSO: ${pattern.patternId}]`;
      
      sanitized = sanitized.substring(0, start) + replacement + sanitized.substring(end);
    }
    
    return sanitized;
  }
  
  /**
   * Restituisce tutti i pattern attualmente configurati
   */
  public getPatterns(): PatternDefinition[] {
    return [...this.patterns];
  }
  
  /**
   * Aggiorna la configurazione del detector
   */
  public updateConfig(config: Partial<PatternDetectorConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
    
    // Se ci sono nuovi pattern personalizzati, aggiungili
    if (config.customPatterns) {
      this.addPatterns(config.customPatterns);
    }
    
    // Se ci sono pattern da escludere, rimuovili
    if (config.excludedPatternIds) {
      this.excludePatterns(config.excludedPatternIds);
    }
  }
}

/**
 * Crea un'istanza del PatternDetector con configurazione predefinita
 */
export function createPatternDetector(config?: Partial<PatternDetectorConfig>): PatternDetector {
  return new PatternDetector(config);
}

/**
 * Esempio di utilizzo
 */
export function patternDetectorExample(): void {
  // Crea un detector con configurazione predefinita
  const detector = createPatternDetector();
  
  // Esempio di contenuto sicuro
  const safeContent = `
    function calculateFactorial(n) {
      if (n <= 1) return 1;
      return n * calculateFactorial(n - 1);
    }
    
    // Calcola il fattoriale di 5
    const result = calculateFactorial(5);
    console.log(result); // Output: 120
  `;
  
  // Esempio di contenuto pericoloso
  const dangerousContent = `
    function hackSystem() {
      // Esegui comando pericoloso
      const process = require('child_process');
      process.exec('rm -rf /important/files', (error, stdout, stderr) => {
        console.log('Files deleted');
      });
      
      // Valuta codice dinamico
      eval('alert("System hacked!")');
      
      // Infinite loop
      while(true) {
        // Do nothing
      }
    }
  `;
  
  // Analizza il contenuto sicuro
  console.log('Analisi contenuto sicuro:');
  const safeResult = detector.analyze(safeContent);
  console.log(`Rilevati ${safeResult.detectedPatterns.length} pattern pericolosi`);
  console.log(`Punteggio di rischio: ${safeResult.overallRiskScore}`);
  console.log(`Azione suggerita: ${safeResult.suggestedAction}`);
  console.log('-------------------------');
  
  // Analizza il contenuto pericoloso
  console.log('Analisi contenuto pericoloso:');
  const dangerousResult = detector.analyze(dangerousContent);
  console.log(`Rilevati ${dangerousResult.detectedPatterns.length} pattern pericolosi:`);
  
  // Mostra i pattern rilevati
  dangerousResult.detectedPatterns.forEach((pattern, index) => {
    console.log(`${index + 1}. ${pattern.patternId}: ${pattern.matchedText} (${pattern.severity})`);
  });
  
  console.log(`Punteggio di rischio: ${dangerousResult.overallRiskScore}`);
  console.log(`Azione suggerita: ${dangerousResult.suggestedAction}`);
  
  // Se è disponibile il contenuto sanitizzato, mostralo
  if (dangerousResult.sanitizedContent) {
    console.log('\nContenuto sanitizzato:');
    console.log(dangerousResult.sanitizedContent);
  }
}

// Se questo file viene eseguito direttamente
if (require.main === module) {
  patternDetectorExample();
}