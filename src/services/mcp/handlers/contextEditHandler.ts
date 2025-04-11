import { ContextItem } from '../types/ContextItem.js';
import { getMemoryContexts, saveMemoryContexts } from '../utils/memoryUtils.js';
import { normalizeTags } from '../utils/tagUtils.js';

interface EditOptions {
  id: string;
  text?: string;
  tags?: string[];
  scope?: 'chat' | 'project' | 'agent';
}

interface EditResult {
  id: string;
  original: ContextItem;
  updated: ContextItem;
  changes: {
    text?: boolean;
    tags?: boolean;
    scope?: boolean;
  };
}

export async function editContext(options: EditOptions): Promise<EditResult | null> {
  const { id, text, tags, scope } = options;
  
  // Carica i contesti esistenti
  const contexts = await getMemoryContexts();
  
  // Trova il contesto da modificare
  const contextIndex = contexts.findIndex(ctx => ctx.id === id);
  if (contextIndex === -1) {
    return null;
  }
  
  const originalContext = contexts[contextIndex];
  const updatedContext = { ...originalContext };
  const changes: EditResult['changes'] = {};
  
  // Applica le modifiche solo ai campi forniti
  if (text !== undefined) {
    updatedContext.text = text;
    changes.text = true;
  }
  
  if (tags !== undefined) {
    updatedContext.tags = normalizeTags(tags);
    changes.tags = true;
  }
  
  if (scope !== undefined) {
    updatedContext.scope = scope;
    changes.scope = true;
  }
  
  // Aggiorna il timestamp di modifica
  updatedContext.lastModified = new Date().toISOString();
  
  // Salva le modifiche
  contexts[contextIndex] = updatedContext;
  await saveMemoryContexts(contexts);
  
  return {
    id,
    original: originalContext,
    updated: updatedContext,
    changes
  };
}

export async function contextEditHandler(args: any): Promise<{ success: boolean; output?: any; error?: string }> {
  try {
    const { id, text, tags, scope } = args;
    
    if (!id) {
      return {
        success: false,
        error: "ID del contesto non fornito"
      };
    }
    
    const result = await editContext({ id, text, tags, scope });
    
    if (!result) {
      return {
        success: false,
        error: `Contesto con ID ${id} non trovato`
      };
    }
    
    return {
      success: true,
      output: {
        id: result.id,
        changes: result.changes,
        original: {
          text: result.original.text,
          tags: result.original.tags,
          scope: result.original.scope
        },
        updated: {
          text: result.updated.text,
          tags: result.updated.tags,
          scope: result.updated.scope
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Errore durante la modifica del contesto: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 