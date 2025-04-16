import type { ApiHandlerOptions } from '../api.types'; // Assumendo che ApiHandlerOptions sia definito in api.types.ts
 
export interface XaiHandlerOptions extends ApiHandlerOptions {
  xaiApiKey: string;
  apiModelId?: string; // Già presente implicitamente in ApiHandlerOptions?
  // Aggiungere altre opzioni specifiche per XAI se necessario
} 