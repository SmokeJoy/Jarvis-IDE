import { ContextItem } from '../types/ContextItem';
import { getMemoryContexts } from '../utils/memoryUtils';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
const LINKS_FILE = path.join(__dirname, '../../data/context_links.json');
async function getContextLinks() {
    try {
        if (!fs.existsSync(LINKS_FILE)) {
            return [];
        }
        const data = await fs.promises.readFile(LINKS_FILE, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error('Errore nel caricamento dei link:', error);
        return [];
    }
}
async function saveContextLinks(links) {
    try {
        await fs.promises.writeFile(LINKS_FILE, JSON.stringify(links, null, 2));
    }
    catch (error) {
        console.error('Errore nel salvataggio dei link:', error);
        throw error;
    }
}
async function createLink(options) {
    const { sourceId, targetId, relation, bidirectional = false, strength = 0.5, metadata = {} } = options;
    // Verifica esistenza dei contesti
    const contexts = await getMemoryContexts();
    const sourceExists = contexts.some(ctx => ctx.id === sourceId);
    const targetExists = contexts.some(ctx => ctx.id === targetId);
    if (!sourceExists || !targetExists) {
        throw new Error(`Contesto non trovato: ${!sourceExists ? sourceId : targetId}`);
    }
    // Crea il link
    const link = {
        id: uuidv4(),
        sourceId,
        targetId,
        relation,
        bidirectional,
        strength,
        metadata: {
            ...metadata,
            timestamp: new Date().toISOString()
        }
    };
    // Salva il link
    const links = await getContextLinks();
    links.push(link);
    // Se bidirezionale, crea il link inverso
    if (bidirectional) {
        const inverseLink = {
            ...link,
            id: uuidv4(),
            sourceId: targetId,
            targetId: sourceId
        };
        links.push(inverseLink);
    }
    await saveContextLinks(links);
    return link;
}
export async function contextLinkHandler(args) {
    try {
        const { sourceId, targetId, relation, bidirectional, strength, metadata } = args;
        if (!sourceId || !targetId || !relation) {
            return {
                success: false,
                error: "Parametri mancanti: sourceId, targetId e relation sono obbligatori"
            };
        }
        const link = await createLink({
            sourceId,
            targetId,
            relation,
            bidirectional,
            strength,
            metadata
        });
        return {
            success: true,
            output: {
                link,
                bidirectional
            }
        };
    }
    catch (error) {
        return {
            success: false,
            error: `Errore durante la creazione del link: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
//# sourceMappingURL=contextLinkHandler.js.map