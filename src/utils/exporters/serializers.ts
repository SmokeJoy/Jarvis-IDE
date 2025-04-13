/**
 * Modulo di serializzazione per i formati di esportazione
 * @module utils/exporters/serializers
 */

import yaml from 'js-yaml';
import { ExportOptions } from './types';

/**
 * Converte un oggetto in formato YAML
 *
 * @param data - L'oggetto da serializzare in YAML
 * @param options - Opzioni di esportazione
 * @returns Una stringa contenente la rappresentazione YAML dell'oggetto
 */
export function toYAML(data: any, options?: Pick<ExportOptions, 'indent'>): string {
  const indent = options?.indent ?? 2;

  try {
    return yaml.dump(data, {
      indent,
      lineWidth: -1, // Disable line wrapping
      noRefs: true, // Don't use reference tags for repeated nodes
      sortKeys: true, // Sort keys alphabetically
    });
  } catch (error) {
    console.error('Errore durante la serializzazione YAML:', error);
    // Fallback: tentiamo una versione più semplice
    return yaml.dump(JSON.parse(JSON.stringify(data)), {
      indent,
      noRefs: true,
    });
  }
}

/**
 * Converte un oggetto in formato JSON
 *
 * @param data - L'oggetto da serializzare in JSON
 * @param options - Opzioni di esportazione
 * @returns Una stringa contenente la rappresentazione JSON dell'oggetto
 */
export function toJSON(data: any, options?: Pick<ExportOptions, 'indent'>): string {
  const indent = options?.indent ?? 2;

  try {
    return JSON.stringify(data, null, indent);
  } catch (error) {
    console.error('Errore durante la serializzazione JSON:', error);
    // Fallback per oggetti circolari
    const cache = new Set();
    return JSON.stringify(
      data,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.has(value)) {
            return '[Circular]';
          }
          cache.add(value);
        }
        return value;
      },
      indent
    );
  }
}

/**
 * Analizza una stringa YAML e la converte in un oggetto
 *
 * @param yamlString - La stringa YAML da analizzare
 * @returns L'oggetto deserializzato
 * @throws {Error} Se l'analisi fallisce
 */
export function fromYAML(yamlString: string): any {
  try {
    return yaml.load(yamlString);
  } catch (error) {
    throw new Error(
      `Errore durante l'analisi YAML: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Analizza una stringa JSON e la converte in un oggetto
 *
 * @param jsonString - La stringa JSON da analizzare
 * @returns L'oggetto deserializzato
 * @throws {Error} Se l'analisi fallisce
 */
export function fromJSON(jsonString: string): any {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(
      `Errore durante l'analisi JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
