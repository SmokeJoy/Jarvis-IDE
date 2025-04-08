/**
 * @file api.types.ts
 * @description File di reindirizzamento per le definizioni dei tipi API
 * @deprecated Per nuovi sviluppi, importare direttamente da llm.types.ts
 */
// Importo tutti i tipi dal file centralizzato
import * as LLMTypes from './llm.types';
import { ChatCompletionContentPart, ChatCompletionContentPartText, ChatCompletionContentPartImage } from './llm.types';
// Ri-esporto tutto per retrocompatibilità
export * from './llm.types';
export { TelemetrySetting };
//# sourceMappingURL=api.types.js.map