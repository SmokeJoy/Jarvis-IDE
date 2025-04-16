/**
 * @file contextValidator.ts
 * @description Validatori per i dati di contesto
 */

import { getLogger } from '../logging';
import { ContextData, ContextValidationResult, ContextMetadata } from '../types';

const logger = getLogger('contextValidator');

const SUPPORTED_TYPES = ['text', 'code', 'image', 'file'] as const;
const MAX_CONTENT_LENGTH = 1000000; // 1MB
const CONTEXT_ID_REGEX = /^ctx_[a-zA-Z0-9_]+$/;

/**
 * Valida un oggetto ContextData
 */
export function validateContextData(data: ContextData): ContextValidationResult {
  const errors: string[] = [];

  // Validazione ID
  if (!isValidContextId(data.id)) {
    errors.push('ID mancante o non valido');
  }

  // Validazione content
  if (!data.content) {
    errors.push('Contenuto mancante');
  } else if (data.content.length > MAX_CONTENT_LENGTH) {
    errors.push('Contenuto troppo lungo');
    logger.warn(`Contenuto troppo lungo: ${data.content.length} bytes`);
  }

  // Validazione type
  if (!data.type || !SUPPORTED_TYPES.includes(data.type)) {
    errors.push(`Tipo di contesto non supportato: ${data.type}`);
  }

  // // Validazione metadata (rimossa, gestita dove usata)
  // if (data.metadata) {
  //   const metadataResult = validateContextMetadata(data.metadata);
  //   if (!metadataResult.isValid) {
  //     errors.push(...(metadataResult.errors || []));
  //   }
  // }

  if (errors.length > 0) {
    logger.error('Validazione contesto fallita:', errors);
    return { isValid: false, errors };
  }

  return { isValid: true };
}

/**
 * Valida un ID di contesto
 */
export function isValidContextId(id: unknown): id is string {
  return typeof id === 'string' && CONTEXT_ID_REGEX.test(id);
}

/**
 * Valida un array di contesti
 */
export function validateContextArray(contexts: ContextData[]): ContextValidationResult {
  if (!Array.isArray(contexts)) {
    logger.error('Input non è un array');
    return { isValid: false, errors: ['Input non è un array'] };
  }

  const errors: string[] = [];

  contexts.forEach((context, index) => {
    const result = validateContextData(context);
    if (!result.isValid) {
      errors.push(`Contesto non valido all'indice ${index}`);
      if (result.errors) {
        errors.push(...result.errors.map((err) => `  - ${err}`));
      }
    }
  });

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true };
}
