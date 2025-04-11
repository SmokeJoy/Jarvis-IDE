/**
 * Definizione del sistema di sicurezza per Jarvis-IDE
 * Questo file contiene le interfacce e le implementazioni base per il SecurityManager
 */

/**
 * Rappresenta un messaggio generico che deve essere validato
 */
export interface Message {
  type: string;
  payload: any;
  metadata?: Record<string, any>;
}

/**
 * Rappresenta un errore di validazione
 */
export interface ValidationError {
  code: string;          // Codice identificativo dell'errore
  message: string;       // Messaggio descrittivo dell'errore
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';  // Livello di gravità
  location?: string;     // Posizione dell'errore nel messaggio (formato: "input:start-end")
  details?: any;         // Dettagli aggiuntivi specifici per l'errore
}

/**
 * Risultato di una validazione
 */
export interface ValidationResult {
  isValid: boolean;                   // Il messaggio è valido o no
  errors?: ValidationError[];         // Eventuali errori di validazione
  metadata?: Record<string, any>;     // Metadati aggiuntivi
}

/**
 * Metriche di sicurezza
 */
export interface SecurityMetrics {
  messagesProcessed: number;          // Numero totale di messaggi processati
  messagesBlocked: number;            // Numero di messaggi bloccati
  messagesModified: number;           // Numero di messaggi modificati
  averageProcessingTimeMs: number;    // Tempo medio di elaborazione in ms
  topBlockedPatterns: Array<{         // Pattern bloccati più frequentemente
    pattern: string;
    count: number;
  }>;
}

/**
 * Interfaccia per un validatore di messaggi
 */
export interface MessageValidator {
  validateMessage(message: Message): Promise<ValidationResult>;
  sanitizeMessage?(message: Message): Promise<Message>;  // Opzionale: implementa se supporta la sanitizzazione
}

/**
 * Interfaccia per il SecurityManager
 */
export interface SecurityManager {
  /**
   * Valida un messaggio utilizzando tutti i validatori registrati
   */
  validateMessage(message: Message): Promise<ValidationResult>;

  /**
   * Sanitizza un messaggio se non è valido
   */
  sanitizeMessage(message: Message): Promise<Message>;

  /**
   * Aggiunge un nuovo validatore
   */
  addValidator(validator: MessageValidator): void;

  /**
   * Rimuove un validatore
   */
  removeValidator(validator: MessageValidator): boolean;

  /**
   * Restituisce le metriche di sicurezza
   */
  getSecurityMetrics(): SecurityMetrics;
}

/**
 * Implementazione base del SecurityManager
 */
export class SecurityManagerImpl implements SecurityManager {
  private validators: MessageValidator[] = [];
  private metrics: SecurityMetrics = {
    messagesProcessed: 0,
    messagesBlocked: 0,
    messagesModified: 0,
    averageProcessingTimeMs: 0,
    topBlockedPatterns: []
  };

  private totalProcessingTime = 0;

  /**
   * Valida un messaggio utilizzando tutti i validatori registrati
   */
  async validateMessage(message: Message): Promise<ValidationResult> {
    this.metrics.messagesProcessed++;
    
    const startTime = Date.now();
    
    let isValid = true;
    const allErrors: ValidationError[] = [];
    const metadata: Record<string, any> = {};
    
    // Esegui ogni validatore
    for (const validator of this.validators) {
      try {
        const result = await validator.validateMessage(message);
        
        // Se il validatore trova un errore, il messaggio non è valido
        if (!result.isValid) {
          isValid = false;
          
          // Registra il pattern bloccato nelle metriche
          if (result.metadata?.detectedPatterns) {
            this.updateBlockedPatterns(result.metadata.detectedPatterns);
          }
        }
        
        // Aggiungi gli errori trovati
        if (result.errors && result.errors.length > 0) {
          allErrors.push(...result.errors);
        }
        
        // Unisci i metadati
        if (result.metadata) {
          Object.assign(metadata, result.metadata);
        }
      } catch (error) {
        console.error('Errore durante la validazione:', error);
        // In caso di errore, considera il messaggio non valido
        isValid = false;
        allErrors.push({
          code: 'VALIDATOR_ERROR',
          message: `Errore nel validatore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
          severity: 'MEDIUM'
        });
      }
    }
    
    // Aggiorna le metriche
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    this.totalProcessingTime += processingTime;
    this.metrics.averageProcessingTimeMs = this.totalProcessingTime / this.metrics.messagesProcessed;
    
    if (!isValid) {
      this.metrics.messagesBlocked++;
    }
    
    return {
      isValid,
      errors: allErrors.length > 0 ? allErrors : undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
  }

  /**
   * Sanitizza un messaggio se non è valido
   */
  async sanitizeMessage(message: Message): Promise<Message> {
    let sanitizedMessage = JSON.parse(JSON.stringify(message));
    let wasModified = false;
    
    // Applica ogni validatore che supporta la sanitizzazione
    for (const validator of this.validators) {
      if (validator.sanitizeMessage) {
        try {
          const result = await validator.sanitizeMessage(sanitizedMessage);
          
          // Verifica se il messaggio è stato modificato
          if (JSON.stringify(result) !== JSON.stringify(sanitizedMessage)) {
            wasModified = true;
            sanitizedMessage = result;
          }
        } catch (error) {
          console.error('Errore durante la sanitizzazione:', error);
        }
      }
    }
    
    // Aggiorna le metriche se il messaggio è stato modificato
    if (wasModified) {
      this.metrics.messagesModified++;
    }
    
    return sanitizedMessage;
  }

  /**
   * Aggiunge un nuovo validatore
   */
  addValidator(validator: MessageValidator): void {
    this.validators.push(validator);
  }

  /**
   * Rimuove un validatore
   */
  removeValidator(validator: MessageValidator): boolean {
    const index = this.validators.indexOf(validator);
    if (index !== -1) {
      this.validators.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Restituisce le metriche di sicurezza
   */
  getSecurityMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  /**
   * Aggiorna le metriche dei pattern bloccati
   */
  private updateBlockedPatterns(patterns: string[]): void {
    for (const pattern of patterns) {
      const existingPattern = this.metrics.topBlockedPatterns.find(p => p.pattern === pattern);
      
      if (existingPattern) {
        existingPattern.count++;
      } else {
        this.metrics.topBlockedPatterns.push({
          pattern,
          count: 1
        });
      }
      
      // Mantieni ordinato per conteggio
      this.metrics.topBlockedPatterns.sort((a, b) => b.count - a.count);
      
      // Limita a 10 elementi
      if (this.metrics.topBlockedPatterns.length > 10) {
        this.metrics.topBlockedPatterns = this.metrics.topBlockedPatterns.slice(0, 10);
      }
    }
  }
}

/**
 * Validatore di base per implementare regole semplici
 */
export class BasicValidator implements MessageValidator {
  /**
   * Lista di tipi di messaggi consentiti (whitelist)
   */
  private allowedTypes: string[] = [
    'GENERATE_CODE',
    'COMPLETE_CODE',
    'ANALYZE_CODE',
    'FORMAT_CODE',
    'EXECUTE_QUERY',
    'CHAT_MESSAGE'
  ];

  /**
   * Lista di pattern non consentiti (blacklist)
   */
  private dangerousPatterns: Array<{
    pattern: RegExp;
    code: string;
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }> = [
    {
      pattern: /eval\s*\(/g,
      code: 'DANGEROUS_EVAL',
      message: 'Uso diretto di eval() rilevato',
      severity: 'HIGH'
    },
    {
      pattern: /process\.exit/g,
      code: 'PROCESS_EXIT',
      message: 'Tentativo di chiudere il processo',
      severity: 'MEDIUM'
    },
    {
      pattern: /require\s*\(['"]child_process['"]\)/g,
      code: 'CHILD_PROCESS_IMPORT',
      message: 'Importazione di child_process rilevata',
      severity: 'HIGH'
    },
    {
      pattern: /exec\s*\(/g,
      code: 'CMD_EXEC',
      message: 'Tentativo di esecuzione di comando',
      severity: 'CRITICAL'
    }
  ];

  /**
   * Massima dimensione del payload
   */
  private maxPayloadSize = 1024 * 1024; // 1MB

  async validateMessage(message: Message): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    // Verifica il tipo del messaggio
    if (!this.isValidType(message.type)) {
      errors.push({
        code: 'INVALID_TYPE',
        message: `Tipo di messaggio non consentito: ${message.type}`,
        severity: 'MEDIUM'
      });
    }
    
    // Verifica la dimensione del payload
    const payloadSize = this.getPayloadSize(message.payload);
    if (payloadSize > this.maxPayloadSize) {
      errors.push({
        code: 'PAYLOAD_TOO_LARGE',
        message: `Dimensione del payload (${payloadSize} byte) supera il limite massimo (${this.maxPayloadSize} byte)`,
        severity: 'MEDIUM'
      });
    }
    
    // Controlla pattern pericolosi
    const contentErrors = this.checkForDangerousPatterns(message);
    errors.push(...contentErrors);
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async sanitizeMessage(message: Message): Promise<Message> {
    // Clona il messaggio
    const sanitizedMessage = JSON.parse(JSON.stringify(message));
    
    // Se il tipo non è valido, imposta un tipo predefinito sicuro
    if (!this.isValidType(sanitizedMessage.type)) {
      sanitizedMessage.type = 'CHAT_MESSAGE';
    }
    
    // Sanitizza il payload se è una stringa
    if (typeof sanitizedMessage.payload === 'string') {
      // Rimuovi i pattern pericolosi
      for (const { pattern } of this.dangerousPatterns) {
        sanitizedMessage.payload = sanitizedMessage.payload.replace(pattern, '[RIMOSSO]');
      }
    } else if (typeof sanitizedMessage.payload === 'object' && sanitizedMessage.payload !== null) {
      // Sanitizza ricorsivamente le stringhe nell'oggetto
      this.sanitizeObject(sanitizedMessage.payload);
    }
    
    return sanitizedMessage;
  }

  /**
   * Verifica se il tipo di messaggio è valido
   */
  private isValidType(type: string): boolean {
    return this.allowedTypes.includes(type);
  }

  /**
   * Calcola la dimensione in byte del payload
   */
  private getPayloadSize(payload: any): number {
    return new TextEncoder().encode(JSON.stringify(payload)).length;
  }

  /**
   * Controlla la presenza di pattern pericolosi nel messaggio
   */
  private checkForDangerousPatterns(message: Message): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Controlla nel payload se è una stringa
    if (typeof message.payload === 'string') {
      this.checkStringForPatterns(message.payload, errors);
    } 
    // Controlla nelle proprietà dell'oggetto
    else if (typeof message.payload === 'object' && message.payload !== null) {
      this.checkObjectForPatterns(message.payload, errors);
    }
    
    return errors;
  }

  /**
   * Controlla una stringa per pattern pericolosi
   */
  private checkStringForPatterns(content: string, errors: ValidationError[]): void {
    for (const { pattern, code, message, severity } of this.dangerousPatterns) {
      // Reset il RegExp per evitare problemi con lastIndex
      pattern.lastIndex = 0;
      
      let match;
      while ((match = pattern.exec(content)) !== null) {
        errors.push({
          code,
          message,
          severity,
          location: `input:${match.index}-${match.index + match[0].length}`
        });
      }
    }
  }

  /**
   * Controlla ricorsivamente un oggetto per pattern pericolosi
   */
  private checkObjectForPatterns(obj: any, errors: ValidationError[]): void {
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        this.checkStringForPatterns(value, errors);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string') {
            this.checkStringForPatterns(item, errors);
          } else if (typeof item === 'object' && item !== null) {
            this.checkObjectForPatterns(item, errors);
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        this.checkObjectForPatterns(value, errors);
      }
    }
  }

  /**
   * Sanitizza ricorsivamente un oggetto
   */
  private sanitizeObject(obj: any): void {
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Sanitizza la stringa
        let sanitized = value;
        for (const { pattern } of this.dangerousPatterns) {
          pattern.lastIndex = 0; // Reset per sicurezza
          sanitized = sanitized.replace(pattern, '[RIMOSSO]');
        }
        obj[key] = sanitized;
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          if (typeof item === 'string') {
            // Sanitizza la stringa nell'array
            let sanitized = item;
            for (const { pattern } of this.dangerousPatterns) {
              pattern.lastIndex = 0;
              sanitized = sanitized.replace(pattern, '[RIMOSSO]');
            }
            value[i] = sanitized;
          } else if (typeof item === 'object' && item !== null) {
            this.sanitizeObject(item);
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        this.sanitizeObject(value);
      }
    }
  }
}

/**
 * Factory per creare un SecurityManager con validatori di base
 */
export function createBasicSecurityManager(): SecurityManager {
  const securityManager = new SecurityManagerImpl();
  
  // Aggiungi il validatore base
  securityManager.addValidator(new BasicValidator());
  
  return securityManager;
}

/**
 * Esempio di utilizzo
 */
export async function securityExample(): Promise<void> {
  // Crea il SecurityManager
  const securityManager = createBasicSecurityManager();
  
  // Esempio di messaggio valido
  const validMessage: Message = {
    type: 'GENERATE_CODE',
    payload: {
      prompt: 'Genera una funzione che calcola il fattoriale',
      language: 'javascript'
    }
  };
  
  // Esempio di messaggio non valido (contiene eval)
  const invalidMessage: Message = {
    type: 'EXECUTE_QUERY',
    payload: `
      function rischiosa() {
        eval("alert('Codice pericoloso')");
      }
    `
  };
  
  // Valida il messaggio valido
  console.log('Validazione messaggio valido:');
  const validResult = await securityManager.validateMessage(validMessage);
  console.log('Valido:', validResult.isValid);
  console.log('Errori:', validResult.errors || 'Nessuno');
  
  // Valida il messaggio non valido
  console.log('\nValidazione messaggio non valido:');
  const invalidResult = await securityManager.validateMessage(invalidMessage);
  console.log('Valido:', invalidResult.isValid);
  console.log('Errori:', invalidResult.errors);
  
  // Sanitizza il messaggio non valido
  console.log('\nSanitizzazione messaggio non valido:');
  const sanitized = await securityManager.sanitizeMessage(invalidMessage);
  console.log('Messaggio sanitizzato:', sanitized);
  
  // Verifica che il messaggio sanitizzato sia ora valido
  const sanitizedResult = await securityManager.validateMessage(sanitized);
  console.log('Messaggio sanitizzato valido:', sanitizedResult.isValid);
  
  // Mostra le metriche
  console.log('\nMetriche di sicurezza:');
  console.log(securityManager.getSecurityMetrics());
}

// Se questo file viene eseguito direttamente
if (require.main === module) {
  securityExample().catch(error => {
    console.error('Errore nell\'esempio di sicurezza:', error);
  });
} 