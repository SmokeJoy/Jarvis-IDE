import { ContextItem } from '../types/ContextItem';
import { getMemoryContexts, saveMemoryContexts } from '../utils/memoryUtils';
import { normalizeTags } from '../utils/tagUtils';
export async function editContext(options) {
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
    const changes = {};
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
export async function contextEditHandler(args) {
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
    }
    catch (error) {
        return {
            success: false,
            error: `Errore durante la modifica del contesto: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
//# sourceMappingURL=contextEditHandler.js.map