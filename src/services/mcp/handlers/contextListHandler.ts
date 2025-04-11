import type { McpToolHandler, McpToolResult } from "../../../shared/types/mcp.types.js";
import { getFromMemory, getAllMemory } from "./contextInjectHandler.js";
import type { getContextsByTags } from "./contextTagHandler.js";

/**
 * Crea una stringa di anteprima del testo (primi 50 caratteri)
 */
function createTextPreview(text: string, maxLength = 50): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * Handler principale per context.list
 */
export const contextListHandler: McpToolHandler = async (args): Promise<McpToolResult> => {
  // Estrai i parametri
  const scope = args?.scope;
  const limit = args?.limit && !isNaN(parseInt(args.limit)) ? parseInt(args.limit) : undefined;
  const filterText = args?.filterText;
  const sinceTimestamp = args?.sinceTimestamp && !isNaN(parseInt(args.sinceTimestamp)) 
    ? parseInt(args.sinceTimestamp) 
    : undefined;
  const tags = args?.tags && Array.isArray(args.tags) ? args.tags : undefined;
  
  try {
    // Ottieni la memoria in base allo scope
    let memoryItems;
    
    // Se sono specificati dei tag, usa il filtro per tag
    if (tags && tags.length > 0) {
      memoryItems = getContextsByTags(tags, scope);
    } else if (scope) {
      // Valida lo scope
      if (!['chat', 'project', 'agent'].includes(scope)) {
        return {
          success: false,
          output: null,
          error: `Scope '${scope}' non valido. Valori ammessi: chat, project, agent`
        };
      }
      
      memoryItems = getFromMemory(scope);
    } else {
      // Se non è specificato uno scope, restituisci tutto
      const allMemory = getAllMemory();
      memoryItems = [];
      
      for (const scopeKey in allMemory) {
        memoryItems = memoryItems.concat(allMemory[scopeKey].map(item => ({
          ...item,
          scope: scopeKey
        })));
      }
    }
    
    // Filtra per testo se specificato
    if (filterText) {
      memoryItems = memoryItems.filter(item => 
        item.text.toLowerCase().includes(filterText.toLowerCase())
      );
    }
    
    // Filtra per timestamp se specificato
    if (sinceTimestamp) {
      memoryItems = memoryItems.filter(item => 
        item.timestamp >= sinceTimestamp
      );
    }
    
    // Ordina per timestamp (più recenti prima)
    memoryItems = memoryItems.sort((a, b) => b.timestamp - a.timestamp);
    
    // Limita i risultati se specificato
    if (limit && limit > 0) {
      memoryItems = memoryItems.slice(0, limit);
    }
    
    // Prepara l'output formattato
    const formattedItems = memoryItems.map(item => ({
      id: item.id,
      scope: item.scope,
      timestamp: item.timestamp,
      date: new Date(item.timestamp).toISOString(),
      textPreview: createTextPreview(item.text),
      // Fornisci il testo completo, non solo l'anteprima
      text: item.text,
      // Includi i tag se presenti
      tags: item.tags || []
    }));
    
    // Prepara il risultato
    const result = {
      total: formattedItems.length,
      scope: scope || 'all',
      items: formattedItems,
      summary: `Trovati ${formattedItems.length} contesti in memoria${scope ? ` per lo scope '${scope}'` : ''}${tags ? ` con i tag specificati` : ''}`
    };
    
    return {
      success: true,
      output: JSON.stringify(result)
    };
  } catch (error: any) {
    console.error("Errore nell'elenco dei contesti:", error);
    return {
      success: false,
      output: null,
      error: `Errore nell'elenco dei contesti: ${error.message}`
    };
  }
}; 