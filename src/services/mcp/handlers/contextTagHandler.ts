import { McpToolHandler, McpToolResult } from "../../../shared/types/mcp.types.js";
import { ContextItem } from '../types/ContextItem';
import { ContextTagArgs } from '../types/handler.types';
import * as memoryUtils from '../contextInjectHandler';

interface TagOperationResult {
  success: boolean;
  context?: ContextItem;
  scope?: string;
  addedTags?: string[];
  allTags?: string[];
  error?: string;
}

interface TagOperationOutput {
  success: boolean;
  id: string;
  scope: string;
  addedTags: string[];
  allTags: string[];
  replace: boolean;
  textPreview: string;
  summary: string;
}

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 50;

/**
 * Normalizza un tag (lowercase, rimuove spazi non necessari, ecc.)
 * @param tag - Il tag da normalizzare
 * @returns Il tag normalizzato o stringa vuota se invalido
 */
function normalizeTag(tag: string): string {
  if (!tag) return '';
  
  // Rimuove spazi all'inizio e alla fine
  let normalized = tag.trim();
  
  // Converti in lowercase per evitare duplicati case-insensitive
  normalized = normalized.toLowerCase();
  
  // Sostituisci spazi multipli con un singolo trattino
  normalized = normalized.replace(/\s+/g, '-');
  
  // Rimuovi caratteri non validi (mantenendo solo alfanumerici, trattini e underscores)
  normalized = normalized.replace(/[^a-z0-9\-_]/g, '');
  
  // Limita lunghezza
  return normalized.slice(0, MAX_TAG_LENGTH);
}

/**
 * Normalizza un array di tag e rimuove i duplicati
 * @param tags - Array di tag da normalizzare
 * @returns Array di tag normalizzati, deduplicati e limitati
 */
function normalizeAndDeduplicateTags(tags: string[]): string[] {
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return [];
  }
  
  // Normalizza tutti i tag
  const normalizedTags = tags.map(tag => normalizeTag(tag));
  
  // Rimuovi tag vuoti
  const filteredTags = normalizedTags.filter(tag => tag.length > 0);
  
  // Rimuovi duplicati
  const uniqueTags = [...new Set(filteredTags)];
  
  // Limita a un massimo di MAX_TAGS tag
  return uniqueTags.slice(0, MAX_TAGS);
}

/**
 * Aggiunge tag a un contesto specifico
 * @param id - ID del contesto
 * @param tags - Array di tag da aggiungere
 * @param replace - Se true, sostituisce i tag esistenti invece di aggiungerli
 * @returns Oggetto con informazioni sul risultato dell'operazione
 */
function addTagsToContext(id: string, tags: string[], replace: boolean = false): TagOperationResult {
  const contextInfo = memoryUtils.findContextById(id);
  
  if (!contextInfo) {
    return {
      success: false,
      error: `Contesto con ID ${id} non trovato`
    };
  }

  const allMemory = memoryUtils.getAllMemory();
  
  // Filtra per scope se specificato
  if (contextInfo.scope) {
    result = allMemory.filter(item => item.scope === contextInfo.scope);
  } else {
    result = allMemory;
  }
  
  // Salva la memoria su disco
  await memoryUtils.persistMemoryToDisk();
  
  return {
    success: true,
    context: contextInfo
  };
}

/**
 * Restituisce contesti che contengono specifici tag
 * @param tags - Array di tag da cercare
 * @param specificScope - Scope opzionale in cui cercare
 * @returns Array di contesti che contengono tutti i tag specificati
 */
export function getContextsByTags(tags: string[], specificScope?: string): ContextItem[] {
  const normalizedSearchTags = normalizeAndDeduplicateTags(tags);
  
  if (normalizedSearchTags.length === 0) {
    return [];
  }
  
  let result: ContextItem[] = [];
  const allMemory = memoryUtils.getAllMemory();
  
  // Filtra per scope se specificato
  const scopesToSearch = specificScope ? [specificScope] : Object.keys(allMemory);
  
  for (const scope of scopesToSearch) {
    const items = allMemory[scope] || [];
    
    // Filtra gli item che hanno tutti i tag specificati
    const matchingItems = items.filter(item => {
      // Se l'item non ha tag, non corrisponde
      if (!item.tags || !Array.isArray(item.tags) || item.tags.length === 0) {
        return false;
      }
      
      // Verifica che tutti i tag di ricerca siano presenti nell'item
      return normalizedSearchTags.every(searchTag => item.tags.includes(searchTag));
    });
    
    // Aggiungi gli item corrispondenti al risultato
    result = [...result, ...matchingItems.map(item => ({...item, scope}))];
  }
  
  return result;
}

/**
 * Handler principale per context.tag
 * @param args - Argomenti per l'operazione di tagging
 * @returns Risultato dell'operazione
 */
export const contextTagHandler: McpToolHandler = async (args: ContextTagArgs): Promise<McpToolResult> => {
  // Estrai i parametri
  const id = args?.id;
  const tags = args?.tags;
  const replace = args?.replace === true;
  
  // Valida i parametri
  if (!id) {
    return {
      success: false,
      output: null,
      error: "Il parametro 'id' è obbligatorio"
    };
  }
  
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return {
      success: false,
      output: null,
      error: "Il parametro 'tags' è obbligatorio e deve essere un array non vuoto di stringhe"
    };
  }
  
  try {
    // Aggiungi i tag al contesto
    const result = addTagsToContext(id, tags, replace);
    
    if (!result.success) {
      return {
        success: false,
        output: null,
        error: result.error
      };
    }
    
    // Salva la memoria su disco
    await memoryUtils.persistMemoryToDisk();
    
    // Prepara l'output
    const outputResult: TagOperationOutput = {
      success: true,
      id: id,
      scope: result.scope!,
      addedTags: result.addedTags!,
      allTags: result.allTags!,
      replace: replace,
      textPreview: result.context!.text.length > 50 
        ? result.context!.text.substring(0, 50) + '...' 
        : result.context!.text,
      summary: replace 
        ? `Tag sostituiti per il contesto con ID '${id}'` 
        : `Tag aggiunti al contesto con ID '${id}'`
    };
    
    return {
      success: true,
      output: JSON.stringify(outputResult)
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    console.error("Errore nell'aggiunta di tag al contesto:", error);
    return {
      success: false,
      output: null,
      error: `Errore nell'aggiunta di tag al contesto: ${errorMessage}`
    };
  }
}; 