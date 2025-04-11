import { SecurityManager, SecurityManagerImpl, ValidationResult, ValidationError, Message, MessageValidator } from './prototipo-validatore';
import { PatternDetector, PatternDetectionResult, ThreatLevel, createPatternDetector } from './pattern-detector';

/**
 * Validator che utilizza il PatternDetector per rilevare pattern dannosi
 */
export class PatternBasedValidator implements MessageValidator {
  private detector: PatternDetector;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initialize();
  }

  /**
   * Inizializza il validator
   */
  private async initialize(): Promise<void> {
    this.detector = await createPatternDetector();
    this.isInitialized = true;
    console.log('PatternBasedValidator inizializzato con successo');
  }

  /**
   * Valida un messaggio utilizzando il pattern detector
   */
  async validateMessage(message: Message): Promise<ValidationResult> {
    // Assicurati che il detector sia inizializzato
    if (!this.isInitialized) {
      if (this.initializationPromise) {
        await this.initializationPromise;
      } else {
        await this.initialize();
      }
    }

    // Estrai il contenuto da analizzare dal messaggio
    const content = this.extractContentToAnalyze(message);
    
    // Rileva pattern dannosi
    const detectionResult = await this.detector.detectPatterns(content);
    
    // Se non ci sono pattern dannosi, il messaggio è valido
    if (detectionResult.detectedPatterns.length === 0) {
      return { isValid: true };
    }
    
    // Altrimenti, genera errori di validazione
    const errors = this.detector.generateValidationErrors(detectionResult);
    
    return {
      isValid: !detectionResult.containsHighRisk,
      errors,
      metadata: {
        threatScore: detectionResult.overallThreatScore,
        detectedPatterns: detectionResult.detectedPatterns.map(dp => dp.pattern.id)
      }
    };
  }

  /**
   * Estrae il contenuto da analizzare dal messaggio
   */
  private extractContentToAnalyze(message: Message): string {
    // Analizza diversi tipi di messaggio per estrarre il contenuto pertinente
    const contentParts: string[] = [];
    
    // Estrai il payload base
    if (typeof message.payload === 'string') {
      contentParts.push(message.payload);
    } else if (message.payload && typeof message.payload === 'object') {
      // Estrai ricorsivamente tutte le stringhe dall'oggetto
      this.extractStringsFromObject(message.payload, contentParts);
    }
    
    // Aggiungi anche il tipo del messaggio all'analisi
    if (message.type) {
      contentParts.push(message.type);
    }
    
    return contentParts.join('\n');
  }

  /**
   * Estrae ricorsivamente tutte le stringhe da un oggetto
   */
  private extractStringsFromObject(obj: any, result: string[]): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Analizza solo stringhe di una certa lunghezza
        if (value.length > 3) {
          result.push(value);
        }
      } else if (Array.isArray(value)) {
        // Analizza array
        for (const item of value) {
          if (typeof item === 'string') {
            if (item.length > 3) {
              result.push(item);
            }
          } else if (typeof item === 'object' && item !== null) {
            this.extractStringsFromObject(item, result);
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        // Analizza oggetti in modo ricorsivo
        this.extractStringsFromObject(value, result);
      }
    }
  }

  /**
   * Sanitizza un messaggio rimuovendo o modificando contenuti dannosi
   */
  async sanitizeMessage(message: Message): Promise<Message> {
    // Implementazione semplificata della sanitizzazione
    // In un caso reale, applicheremmo tecniche più sofisticate
    
    // Clona il messaggio
    const sanitizedMessage = JSON.parse(JSON.stringify(message));
    
    // Valida il messaggio per identificare i pattern dannosi
    const validationResult = await this.validateMessage(message);
    
    // Se il messaggio è valido, restituisci il messaggio originale
    if (validationResult.isValid) {
      return sanitizedMessage;
    }
    
    // Altrimenti, sanitizza il messaggio in base agli errori rilevati
    if (validationResult.errors && validationResult.errors.length > 0) {
      for (const error of validationResult.errors) {
        // Estrai le informazioni sulla posizione dal campo location (formato: "input:start-end")
        const locationMatch = error.location?.match(/input:(\d+)-(\d+)/);
        
        if (locationMatch) {
          const [, startStr, endStr] = locationMatch;
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          
          // Sanitizza il payload se è una stringa
          if (typeof sanitizedMessage.payload === 'string') {
            sanitizedMessage.payload = this.sanitizeString(
              sanitizedMessage.payload,
              start,
              end,
              error.code
            );
          } else if (sanitizedMessage.payload && typeof sanitizedMessage.payload === 'object') {
            // Sanitizza l'oggetto
            this.sanitizeObjectStrings(sanitizedMessage.payload, error.code);
          }
        }
      }
    }
    
    return sanitizedMessage;
  }

  /**
   * Sanitizza una specifica porzione di stringa
   */
  private sanitizeString(str: string, start: number, end: number, errorCode: string): string {
    // Sostituisci la parte problematica con un placeholder
    const prefix = str.substring(0, start);
    const suffix = str.substring(end);
    const replacement = '[CONTENUTO_RIMOSSO]';
    
    return prefix + replacement + suffix;
  }

  /**
   * Sanitizza ricorsivamente le stringhe in un oggetto
   */
  private sanitizeObjectStrings(obj: any, errorCode: string): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Applica sanitizzazione semplice alle stringhe
        if (this.shouldSanitizeString(value, errorCode)) {
          obj[key] = this.applySanitizationRule(value, errorCode);
        }
      } else if (Array.isArray(value)) {
        // Sanitizza array
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          if (typeof item === 'string') {
            if (this.shouldSanitizeString(item, errorCode)) {
              value[i] = this.applySanitizationRule(item, errorCode);
            }
          } else if (typeof item === 'object' && item !== null) {
            this.sanitizeObjectStrings(item, errorCode);
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        // Sanitizza oggetti in modo ricorsivo
        this.sanitizeObjectStrings(value, errorCode);
      }
    }
  }

  /**
   * Determina se una stringa deve essere sanitizzata
   */
  private shouldSanitizeString(str: string, errorCode: string): boolean {
    // Implementazione semplificata
    // In un caso reale, applicheremmo tecniche più sofisticate
    
    if (errorCode.includes('EVAL') && str.includes('eval(')) {
      return true;
    }
    
    if (errorCode.includes('CMD_EXEC') && 
        (str.includes('exec(') || str.includes('.exec(') || str.includes('spawn('))) {
      return true;
    }
    
    if (errorCode.includes('SQL_INJECTION') && 
        (str.includes('SELECT') || str.includes("'") || str.includes('"='))) {
      return true;
    }
    
    if (errorCode.includes('XSS') && str.includes('<script')) {
      return true;
    }
    
    return false;
  }

  /**
   * Applica una regola di sanitizzazione a una stringa
   */
  private applySanitizationRule(str: string, errorCode: string): string {
    // Implementazione semplificata
    // In un caso reale, applicheremmo tecniche più sofisticate
    
    if (errorCode.includes('EVAL')) {
      return str.replace(/eval\s*\(/g, 'console.log(');
    }
    
    if (errorCode.includes('CMD_EXEC')) {
      return str.replace(/\.(exec|execSync|spawn|spawnSync)\s*\(/g, '.disabled$1(');
    }
    
    if (errorCode.includes('SQL_INJECTION')) {
      return str.replace(/(['"])\s*(OR|AND)\s*\1\s*=\s*\1/gi, '$1 SANITIZED $2 $1=$1');
    }
    
    if (errorCode.includes('XSS')) {
      return str.replace(/<script[\s\S]*?>/gi, '&lt;script&gt;');
    }
    
    // Fallback: sostituisci con placeholder
    return '[CONTENUTO_SANITIZZATO]';
  }
}

/**
 * Factory per creare un SecurityManager con integrazione PatternDetector
 */
export async function createSecurityManagerWithPatternDetection(): Promise<SecurityManager> {
  // Crea il validator basato su pattern
  const patternValidator = new PatternBasedValidator();
  
  // Crea il SecurityManager
  const securityManager = new SecurityManagerImpl();
  
  // Aggiungi il validator basato su pattern
  securityManager.addValidator(patternValidator);
  
  return securityManager;
}

/**
 * Esempio di utilizzo integrato
 */
export async function integratedSecurityExample(): Promise<void> {
  // Crea il SecurityManager con integrazione pattern
  const securityManager = await createSecurityManagerWithPatternDetection();
  
  // Esempio di messaggio innocuo
  const safeMessage: Message = {
    type: 'GENERATE_CODE',
    payload: {
      prompt: 'Crea una funzione per ordinare un array',
      language: 'typescript',
      options: {
        includeDocs: true,
        format: true
      }
    }
  };
  
  // Esempio di messaggio pericoloso
  const dangerousMessage: Message = {
    type: 'GENERATE_CODE',
    payload: {
      prompt: 'Mostrami come usare eval per eseguire funzioni dinamicamente',
      language: 'javascript',
      options: {
        code: `function executeUserCode(code) {
          eval(code); // Eseguiamo direttamente il codice
        }
        
        // Esempio di uso
        executeUserCode("alert('Esecuzione completata');");`
      }
    }
  };
  
  // Esempio di messaggio con tentativo di SQL injection
  const sqlInjectionMessage: Message = {
    type: 'EXECUTE_QUERY',
    payload: {
      query: "SELECT * FROM users WHERE username='' OR ''=''",
      database: 'production'
    }
  };
  
  // Valida i messaggi
  console.log('\n=== Validazione messaggi ===');
  
  console.log('\nValidazione messaggio innocuo:');
  const safeResult = await securityManager.validateMessage(safeMessage);
  console.log('Valido:', safeResult.isValid);
  console.log('Errori:', safeResult.errors?.length || 0);
  
  console.log('\nValidazione messaggio pericoloso:');
  const dangerousResult = await securityManager.validateMessage(dangerousMessage);
  console.log('Valido:', dangerousResult.isValid);
  console.log('Errori:', dangerousResult.errors?.length || 0);
  if (dangerousResult.errors) {
    console.log('Dettagli errori:');
    for (const error of dangerousResult.errors) {
      console.log(`- ${error.code}: ${error.message} (${error.severity})`);
    }
  }
  
  console.log('\nValidazione messaggio SQL injection:');
  const sqlResult = await securityManager.validateMessage(sqlInjectionMessage);
  console.log('Valido:', sqlResult.isValid);
  console.log('Errori:', sqlResult.errors?.length || 0);
  
  // Sanitizza i messaggi pericolosi
  console.log('\n=== Sanitizzazione messaggi ===');
  
  if (!dangerousResult.isValid) {
    console.log('\nSanitizzazione messaggio pericoloso:');
    const sanitizedDangerous = await securityManager.sanitizeMessage(dangerousMessage);
    console.log('Messaggio sanitizzato:', JSON.stringify(sanitizedDangerous, null, 2));
    
    // Verifica che il messaggio sanitizzato sia ora valido
    const sanitizedResult = await securityManager.validateMessage(sanitizedDangerous);
    console.log('Sanitizzazione efficace:', sanitizedResult.isValid);
  }
  
  if (!sqlResult.isValid) {
    console.log('\nSanitizzazione messaggio SQL injection:');
    const sanitizedSql = await securityManager.sanitizeMessage(sqlInjectionMessage);
    console.log('Messaggio sanitizzato:', JSON.stringify(sanitizedSql, null, 2));
    
    // Verifica che il messaggio sanitizzato sia ora valido
    const sanitizedResult = await securityManager.validateMessage(sanitizedSql);
    console.log('Sanitizzazione efficace:', sanitizedResult.isValid);
  }
  
  // Ottieni le metriche di sicurezza
  console.log('\n=== Metriche di sicurezza ===');
  const metrics = securityManager.getSecurityMetrics();
  console.log('Messaggi analizzati:', metrics.messagesProcessed);
  console.log('Messaggi bloccati:', metrics.messagesBlocked);
  console.log('Tempo medio di analisi (ms):', metrics.averageProcessingTimeMs.toFixed(2));
}

// Se questo file viene eseguito direttamente
if (require.main === module) {
  integratedSecurityExample().catch(error => {
    console.error('Errore nell\'esempio di integrazione della sicurezza:', error);
  });
} 