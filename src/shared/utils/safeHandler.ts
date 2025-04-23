/**
 * @file safeHandler.ts
 * @description Wrapper di sicurezza per gestire eccezioni nei handler di messaggi
 * @version 1.0.0
 */

import { logger } from './outputLogger';

/**
 * Interfaccia per le opzioni del safe handler
 */
export interface SafeHandlerOptions {
  /** Nome dell'handler per il logging */
  handlerName?: string;
  /** Gestione personalizzata degli errori */
  onError?: (error: Error, args: any[]) => void;
  /** Se true, rilancia l'errore dopo il logging */
  rethrow?: boolean;
  /** Se true, loggherà ogni chiamata (anche se non fallisce) */
  verbose?: boolean;
  /** Se true, include il trace dello stack negli errori */
  includeStack?: boolean;
  /** Contesto per il logging */
  context?: Record<string, any>;
}

/**
 * Tipo per qualsiasi funzione
 */
type AnyFunction = (...args: any[]) => any;

/**
 * Tipo per i metodi async
 */
type AsyncFunction = (...args: any[]) => Promise<any>;

/**
 * Wrappa una funzione con gestione sicura delle eccezioni
 * 
 * @param fn Funzione da wrappare
 * @param options Opzioni di configurazione
 * @returns Funzione wrappata che non lancerà mai eccezioni non gestite
 */
export function safeHandler<T extends AnyFunction>(
  fn: T,
  options: SafeHandlerOptions = {}
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  const {
    handlerName = fn.name || 'anonymous',
    onError,
    rethrow = false,
    verbose = false,
    includeStack = true,
    context = {}
  } = options;

  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    try {
      if (verbose) {
        const sanitizedArgs = sanitizeArgsForLogging(args);
        logger.debug(`${handlerName} chiamato`, { args: sanitizedArgs, ...context });
      }

      return fn(...args);
    } catch (error) {
      const errorObject = error instanceof Error ? error : new Error(String(error));
      
      // Log dell'errore
      const logContext = {
        handler: handlerName,
        args: sanitizeArgsForLogging(args),
        ...context
      };

      if (includeStack && errorObject.stack) {
        logContext['stack'] = errorObject.stack;
      }

      logger.error(`Errore nel handler ${handlerName}: ${errorObject.message}`, logContext);
      
      // Callback personalizzata
      if (onError) {
        try {
          onError(errorObject, args);
        } catch (callbackError) {
          logger.error(`Errore nel callback onError di ${handlerName}: ${String(callbackError)}`);
        }
      }
      
      // Rilancia l'errore se richiesto
      if (rethrow) {
        throw errorObject;
      }
      
      return undefined as unknown as ReturnType<T>;
    }
  };
}

/**
 * Wrappa una funzione asincrona con gestione sicura delle eccezioni
 * 
 * @param fn Funzione asincrona da wrappare
 * @param options Opzioni di configurazione
 * @returns Funzione wrappata che gestisce le eccezioni in modo sicuro
 */
export function safeAsyncHandler<T extends AsyncFunction>(
  fn: T,
  options: SafeHandlerOptions = {}
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | undefined> {
  const {
    handlerName = fn.name || 'anonymous',
    onError,
    rethrow = false,
    verbose = false,
    includeStack = true,
    context = {}
  } = options;

  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | undefined> => {
    try {
      if (verbose) {
        const sanitizedArgs = sanitizeArgsForLogging(args);
        logger.debug(`${handlerName} async chiamato`, { args: sanitizedArgs, ...context });
      }

      return await fn(...args);
    } catch (error) {
      const errorObject = error instanceof Error ? error : new Error(String(error));
      
      // Log dell'errore
      const logContext = {
        handler: handlerName,
        args: sanitizeArgsForLogging(args),
        ...context
      };

      if (includeStack && errorObject.stack) {
        logContext['stack'] = errorObject.stack;
      }

      logger.error(`Errore asincrono nel handler ${handlerName}: ${errorObject.message}`, logContext);
      
      // Callback personalizzata
      if (onError) {
        try {
          onError(errorObject, args);
        } catch (callbackError) {
          logger.error(`Errore nel callback onError asincrono di ${handlerName}: ${String(callbackError)}`);
        }
      }
      
      // Rilancia l'errore se richiesto
      if (rethrow) {
        throw errorObject;
      }
      
      return undefined;
    }
  };
}

/**
 * Higher-order function per creare handler sicuri per messaggi tipizzati
 * 
 * @param typeGuard Guard per verificare il tipo del messaggio
 * @param handler Handler del messaggio
 * @param options Opzioni di configurazione
 * @returns Handler sicuro per il messaggio
 */
export function createTypedMessageHandler<T, R = void>(
  typeGuard: (msg: unknown) => msg is T,
  handler: (msg: T) => R,
  options: SafeHandlerOptions = {}
): (msg: unknown) => R | undefined {
  const safeMessageHandler = (msg: unknown): R | undefined => {
    // Verifica il tipo prima di processare
    if (!typeGuard(msg)) {
      throw new Error(`Tipo di messaggio non valido: ${JSON.stringify(msg)}`);
    }
    return handler(msg);
  };
  
  // Applica il wrapper di sicurezza
  return safeHandler(safeMessageHandler, {
    handlerName: options.handlerName || handler.name || 'typedMessageHandler',
    ...options
  });
}

/**
 * Higher-order function per creare handler sicuri per messaggi asincroni tipizzati
 * 
 * @param typeGuard Guard per verificare il tipo del messaggio
 * @param handler Handler asincrono del messaggio
 * @param options Opzioni di configurazione
 * @returns Handler sicuro per il messaggio asincrono
 */
export function createAsyncTypedMessageHandler<T, R = void>(
  typeGuard: (msg: unknown) => msg is T,
  handler: (msg: T) => Promise<R>,
  options: SafeHandlerOptions = {}
): (msg: unknown) => Promise<R | undefined> {
  const safeAsyncMessageHandler = async (msg: unknown): Promise<R> => {
    // Verifica il tipo prima di processare
    if (!typeGuard(msg)) {
      throw new Error(`Tipo di messaggio asincrono non valido: ${JSON.stringify(msg)}`);
    }
    return await handler(msg);
  };
  
  // Applica il wrapper di sicurezza
  return safeAsyncHandler(safeAsyncMessageHandler, {
    handlerName: options.handlerName || handler.name || 'asyncTypedMessageHandler',
    ...options
  });
}

/**
 * Sanitizza gli argomenti per il logging in modo sicuro
 * 
 * @param args Argomenti da sanitizzare
 * @returns Argomenti sanitizzati
 */
function sanitizeArgsForLogging(args: any[]): any[] {
  return args.map(arg => {
    if (arg === null || arg === undefined) {
      return arg;
    }
    
    if (arg instanceof Error) {
      return {
        name: arg.name,
        message: arg.message,
        stack: arg.stack
      };
    }
    
    if (typeof arg === 'function') {
      return `[Function: ${arg.name || 'anonymous'}]`;
    }
    
    if (typeof arg === 'object') {
      try {
        // Rimuovi proprietà sensibili
        const sanitized = { ...arg };
        
        // Rimuovi proprietà potenzialmente sensibili
        const sensitiveProps = ['password', 'token', 'secret', 'key', 'apiKey', 'credential', 'auth'];
        sensitiveProps.forEach(prop => {
          if (prop in sanitized) {
            sanitized[prop] = '***REDACTED***';
          }
        });
        
        return sanitized;
      } catch (e) {
        return '[Oggetto non serializzabile]';
      }
    }
    
    return arg;
  });
}

/**
 * Funzione di utilità per wrappare un intero oggetto di handlers
 * 
 * @param handlers Oggetto di funzioni handler
 * @param globalOptions Opzioni globali per tutti gli handler
 * @returns Oggetto con tutti gli handler wrappati
 */
export function wrapAllHandlers<T extends Record<string, AnyFunction>>(
  handlers: T,
  globalOptions: Omit<SafeHandlerOptions, 'handlerName'> = {}
): T {
  const result = { ...handlers };
  
  for (const key in handlers) {
    if (Object.prototype.hasOwnProperty.call(handlers, key)) {
      const handler = handlers[key];
      if (typeof handler === 'function') {
        const isAsync = handler.constructor.name === 'AsyncFunction';
        
        result[key] = isAsync
          ? safeAsyncHandler(handler as AsyncFunction, {
              handlerName: key,
              ...globalOptions
            })
          : safeHandler(handler, {
              handlerName: key,
              ...globalOptions
            });
      }
    }
  }
  
  return result;
}

/**
 * Decorator per metodi di classe che devono essere protetti da errori
 * Nota: richiede TypeScript con decoratori abilitati (experimentalDecorators: true)
 * 
 * @param options Opzioni per il safe handler
 */
export function Safe(options: SafeHandlerOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    if (typeof originalMethod !== 'function') {
      throw new Error('Il decoratore @Safe può essere applicato solo a metodi');
    }
    
    const isAsync = originalMethod.constructor.name === 'AsyncFunction';
    
    descriptor.value = isAsync
      ? safeAsyncHandler(originalMethod, {
          handlerName: `${target.constructor.name}.${propertyKey}`,
          ...options
        })
      : safeHandler(originalMethod, {
          handlerName: `${target.constructor.name}.${propertyKey}`,
          ...options
        });
    
    return descriptor;
  };
}

export default {
  safeHandler,
  safeAsyncHandler,
  createTypedMessageHandler,
  createAsyncTypedMessageHandler,
  wrapAllHandlers,
  Safe
}; 