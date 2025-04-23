/**
 * @file message-payloads.ts
 * @description Definizione delle interfacce per i payload dei messaggi scambiati tra WebView ed Extension
 */

import { MessageType } from './message-type';

/**
 * Interfaccia base vuota per i payload che non contengono dati
 */
export interface EmptyPayload {}

/**
 * Interfacce per i payload dei messaggi inviati dalla WebView all'Extension
 */
export namespace ToExtension {
  /**
   * Payload per richiesta impostazioni (GET_SETTINGS)
   */
  export interface GetSettingsPayload extends EmptyPayload {}

  /**
   * Payload per salvataggio impostazioni (SAVE_SETTINGS)
   */
  export interface SaveSettingsPayload {
    /** Le impostazioni da salvare */
    settings: Record<string, unknown>;
  }

  /**
   * Payload per invio messaggio di chat (SEND_CHAT_MESSAGE)
   */
  export interface SendChatMessagePayload {
    /** Contenuto del messaggio di testo */
    content: string;
    /** Informazioni di contesto opzionali */
    context?: {
      /** File selezionati o aperti */
      selectedFiles?: string[];
      /** Altri dati di contesto */
      [key: string]: unknown;
    };
    /** Modello LLM selezionato */
    model?: string;
  }

  /**
   * Payload per interruzione richiesta (ABORT_REQUEST)
   */
  export interface AbortRequestPayload extends EmptyPayload {}

  /**
   * Payload per richiesta contenuto file (GET_WORKSPACE_FILE)
   */
  export interface GetWorkspaceFilePayload {
    /** Percorso del file */
    path: string;
  }

  /**
   * Payload per salvataggio file (SAVE_FILE)
   */
  export interface SaveFilePayload {
    /** Percorso del file */
    path: string;
    /** Contenuto del file */
    content: string;
  }

  /**
   * Payload per esecuzione comando (EXECUTE_COMMAND)
   */
  export interface ExecuteCommandPayload {
    /** Nome del comando da eseguire */
    command: string;
    /** Argomenti opzionali del comando */
    args?: unknown[];
  }

  /**
   * Payload per esecuzione codice nel terminale (RUN_CODE)
   */
  export interface RunCodePayload {
    /** Codice da eseguire */
    code: string;
    /** Linguaggio del codice */
    language?: string;
    /** Se eseguire in un nuovo terminale */
    newTerminal?: boolean;
  }
}

/**
 * Interfacce per i payload dei messaggi inviati dall'Extension alla WebView
 */
export namespace FromExtension {
  /**
   * Payload per dati impostazioni (SETTINGS_DATA)
   */
  export interface SettingsDataPayload {
    /** Le impostazioni */
    settings: Record<string, unknown>;
  }

  /**
   * Payload per risposta del modello (MODEL_RESPONSE)
   */
  export interface ModelResponsePayload {
    /** ID del messaggio */
    id: string;
    /** Contenuto della risposta */
    content: string;
    /** Metadati della risposta */
    metadata?: {
      /** Modello usato */
      model?: string;
      /** Timestamp */
      timestamp?: number;
      /** Tokens generati */
      tokens?: number;
      /** Altri metadati */
      [key: string]: unknown;
    };
  }

  /**
   * Payload per errore del modello (MODEL_ERROR)
   */
  export interface ModelErrorPayload {
    /** Messaggio di errore */
    message: string;
    /** Codice di errore */
    code?: string;
    /** Dettagli aggiuntivi */
    details?: unknown;
  }

  /**
   * Payload per stato thinking del modello (MODEL_THINKING)
   */
  export interface ModelThinkingPayload {
    /** Stato thinking (true = thinking, false = not thinking) */
    thinking: boolean;
  }

  /**
   * Payload per token stream dal modello (MODEL_STREAM_TOKEN)
   */
  export interface ModelStreamTokenPayload {
    /** Token generato */
    token: string;
    /** Flag che indica se è l'ultimo token */
    done: boolean;
    /** ID del messaggio a cui appartiene il token */
    messageId?: string;
  }

  /**
   * Payload per contenuto file (FILE_CONTENT)
   */
  export interface FileContentPayload {
    /** Percorso del file */
    path: string;
    /** Contenuto del file */
    content: string;
    /** Linguaggio del file (per syntax highlighting) */
    language?: string;
  }

  /**
   * Payload per risultato comando (COMMAND_RESULT)
   */
  export interface CommandResultPayload {
    /** Comando eseguito */
    command: string;
    /** Risultato dell'esecuzione */
    result: unknown;
    /** Flag che indica se il comando ha avuto successo */
    success: boolean;
  }

  /**
   * Payload per risultato esecuzione codice (CODE_EXECUTION_RESULT)
   */
  export interface CodeExecutionResultPayload {
    /** Output dell'esecuzione */
    output: string;
    /** Flag che indica se l'esecuzione ha avuto successo */
    success: boolean;
    /** Codice di uscita */
    exitCode?: number;
  }

  /**
   * Payload per errore generico (ERROR)
   */
  export interface ErrorPayload {
    /** Messaggio di errore */
    message: string;
    /** Codice di errore */
    code?: string;
    /** Stacktrace */
    stack?: string;
  }

  /**
   * Payload per notifica (NOTIFICATION)
   */
  export interface NotificationPayload {
    /** Tipo di notifica */
    type: 'info' | 'warning' | 'error' | 'success';
    /** Messaggio della notifica */
    message: string;
  }
}

/**
 * Tipo che associa ogni tipo di messaggio alla sua interfaccia di payload
 */
export interface PayloadTypeMap {
  // Messaggi da WebView a Extension
  [MessageType.GET_SETTINGS]: ToExtension.GetSettingsPayload;
  [MessageType.SAVE_SETTINGS]: ToExtension.SaveSettingsPayload;
  [MessageType.SEND_CHAT_MESSAGE]: ToExtension.SendChatMessagePayload;
  [MessageType.ABORT_REQUEST]: ToExtension.AbortRequestPayload;
  [MessageType.GET_WORKSPACE_FILE]: ToExtension.GetWorkspaceFilePayload;
  [MessageType.SAVE_FILE]: ToExtension.SaveFilePayload;
  [MessageType.EXECUTE_COMMAND]: ToExtension.ExecuteCommandPayload;
  [MessageType.RUN_CODE]: ToExtension.RunCodePayload;

  // Messaggi da Extension a WebView
  [MessageType.SETTINGS_DATA]: FromExtension.SettingsDataPayload;
  [MessageType.MODEL_RESPONSE]: FromExtension.ModelResponsePayload;
  [MessageType.MODEL_ERROR]: FromExtension.ModelErrorPayload;
  [MessageType.MODEL_THINKING]: FromExtension.ModelThinkingPayload;
  [MessageType.MODEL_STREAM_TOKEN]: FromExtension.ModelStreamTokenPayload;
  [MessageType.FILE_CONTENT]: FromExtension.FileContentPayload;
  [MessageType.COMMAND_RESULT]: FromExtension.CommandResultPayload;
  [MessageType.CODE_EXECUTION_RESULT]: FromExtension.CodeExecutionResultPayload;
  [MessageType.ERROR]: FromExtension.ErrorPayload;
  [MessageType.NOTIFICATION]: FromExtension.NotificationPayload;
}

/**
 * Ottiene il tipo di payload in base al tipo di messaggio
 */
export type PayloadType<T extends MessageType> = PayloadTypeMap[T]; 