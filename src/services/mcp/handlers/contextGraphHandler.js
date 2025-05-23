import { ContextItem, getMemoryContexts } from "../../memory/context";
import { readFile } from "fs/promises";
import path from "path";
async function getContextLinks() {
    try {
        const linksPath = path.join(__dirname, "../../data/context_links.json");
        const data = await readFile(linksPath, "utf-8");
        return JSON.parse(data);
    }
    catch (error) {
        return [];
    }
}
function filterLinks(links, options) {
    return links.filter((link) => {
        // Filtra per direzione
        const isIncoming = link.targetId === options.rootId;
        const isOutgoing = link.sourceId === options.rootId;
        if (options.direction === "incoming" && !isIncoming)
            return false;
        if (options.direction === "outgoing" && !isOutgoing)
            return false;
        if (options.direction === "both" && !isIncoming && !isOutgoing)
            return false;
        // Filtra per tipo di relazione
        if (options.relation && link.relation !== options.relation)
            return false;
        // Filtra per forza minima
        if (options.minStrength && link.strength < options.minStrength)
            return false;
        // Filtra per confidenza minima
        if (options.minConfidence &&
            link.metadata.confidence < options.minConfidence)
            return false;
        return true;
    });
}
async function exploreGraph(rootId, depth, visited, allLinks, options) {
    if (depth === 0)
        return { nodes: new Set(), links: [] };
    const nodes = new Set();
    const links = [];
    // Trova tutti i link rilevanti per il nodo corrente
    const relevantLinks = allLinks.filter(link => link.sourceId === rootId || link.targetId === rootId);
    for (const link of relevantLinks) {
        const otherId = link.sourceId === rootId ? link.targetId : link.sourceId;
        if (!visited.has(otherId)) {
            visited.add(otherId);
            nodes.add(otherId);
            links.push(link);
            // Esplora ricorsivamente
            const { nodes: childNodes, links: childLinks } = await exploreGraph(otherId, depth - 1, visited, allLinks, options);
            childNodes.forEach(node => nodes.add(node));
            childLinks.forEach(link => links.push(link));
        }
    }
    return { nodes, links };
}
export async function contextGraphHandler(args) {
    try {
        // Verifica che il contesto radice esista
        const contexts = await getMemoryContexts();
        const rootContext = contexts.find((ctx) => ctx.id === args.rootId);
        if (!rootContext) {
            return {
                success: false,
                error: `Contesto con ID ${args.rootId} non trovato`,
            };
        }
        // Recupera e filtra i link
        const allLinks = await getContextLinks();
        const filteredLinks = filterLinks(allLinks, args);
        // Esplora il grafo
        const visited = new Set();
        if (args.includeRoot !== false) {
            visited.add(args.rootId);
        }
        const { nodes: nodeIds, links } = await exploreGraph(args.rootId, args.depth || 1, visited, filteredLinks, args);
        // Recupera i contesti per i nodi trovati
        const nodes = contexts.filter(ctx => nodeIds.has(ctx.id));
        // Aggiungi contesti isolati se richiesto
        if (args.includeIsolated) {
            const connectedNodeIds = new Set([...nodeIds, args.rootId]);
            const isolatedNodes = contexts.filter(ctx => !connectedNodeIds.has(ctx.id));
            nodes.push(...isolatedNodes);
        }
        return {
            success: true,
            output: {
                nodes,
                links,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: `Errore durante la generazione del grafo: ${error.message}`,
        };
    }
}
//# sourceMappingURL=contextGraphHandler.js.map