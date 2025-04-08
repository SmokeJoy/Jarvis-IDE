import { getContextById } from '../../../memory/context';
import { getContextLinks } from '../../../memory/context_links';
import { ContextLink } from '../../types';
import { NavigationOptions, NodeResult, EdgeResult, calculateSemanticScore, buildNodeResult, buildEdgeResult, filterLinksByOptions } from '../../utils/navigationGraph';
export async function findExploratoryPath(startId, options = {}, includeContent = false, includeMetadata = false, format = 'graph') {
    // Verifica esistenza contesto iniziale
    const startContext = await getContextById(startId);
    if (!startContext) {
        throw new Error(`Contesto con ID ${startId} non trovato`);
    }
    // Recupera e filtra i link
    const allLinks = await getContextLinks();
    const links = filterLinksByOptions(allLinks, options);
    // Inizializza strutture dati
    const visited = new Set();
    const queue = [];
    const parentMap = new Map();
    const resultNodes = [];
    const resultEdges = [];
    // Aggiungi il nodo iniziale
    visited.add(startId);
    queue.push({ id: startId, depth: 0, score: 1 });
    resultNodes.push(buildNodeResult(startContext, includeContent, includeMetadata));
    // BFS con punteggio semantico
    while (queue.length > 0) {
        const current = queue.shift();
        // Raggiunto limite di profondità
        if (options.maxSteps !== undefined && current.depth >= options.maxSteps) {
            continue;
        }
        // Trova link uscenti
        const outgoingLinks = links.filter(link => link.sourceId === current.id ||
            (options.bidirectional && link.targetId === current.id));
        // Calcola punteggi e ordina
        const scoredLinks = outgoingLinks.map(link => ({
            link,
            score: calculateSemanticScore(link, options)
        })).filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score);
        // Visita i vicini in ordine di punteggio
        for (const { link } of scoredLinks) {
            const nextId = link.sourceId === current.id ? link.targetId : link.sourceId;
            if (!visited.has(nextId)) {
                visited.add(nextId);
                parentMap.set(nextId, current.id);
                const nextContext = await getContextById(nextId);
                if (!nextContext)
                    continue;
                resultNodes.push(buildNodeResult(nextContext, includeContent, includeMetadata));
                resultEdges.push(buildEdgeResult(link, includeMetadata));
                queue.push({
                    id: nextId,
                    depth: current.depth + 1,
                    score: current.score * calculateSemanticScore(link, options)
                });
            }
        }
    }
    // Filtra gli archi per formato tree se necessario
    if (format === 'tree') {
        const treeEdges = resultEdges.filter(edge => edge.sourceId === startId ||
            parentMap.get(edge.sourceId) === edge.targetId);
        return {
            success: true,
            path: {
                nodes: resultNodes,
                edges: treeEdges
            }
        };
    }
    return {
        success: true,
        path: {
            nodes: resultNodes,
            edges: resultEdges
        }
    };
}
//# sourceMappingURL=exploratory.js.map