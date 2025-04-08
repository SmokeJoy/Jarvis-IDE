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
function escapeDotString(str) {
    return str.replace(/[{}"]/g, '\\$&');
}
function generateDotGraph(nodes, links, options) {
    let dot = 'digraph G {\n';
    dot += '  node [shape=box, style=filled, fillcolor=lightblue];\n';
    dot += '  edge [fontsize=10];\n\n';
    // Aggiungi nodi
    for (const node of nodes) {
        let label = node.id;
        if (options.includeNodeText) {
            label += `\\n${escapeDotString(node.text.substring(0, 50))}...`;
        }
        if (options.includeNodeTags && node.tags.length > 0) {
            label += `\\nTags: ${node.tags.join(', ')}`;
        }
        dot += `  "${node.id}" [label="${label}"];\n`;
    }
    // Aggiungi archi
    for (const link of links) {
        let label = link.relation;
        if (options.includeEdgeMetadata) {
            label += `\\nstrength: ${link.strength.toFixed(2)}`;
            label += `\\nconf: ${link.metadata.confidence.toFixed(2)}`;
        }
        dot += `  "${link.sourceId}" -> "${link.targetId}" [label="${label}"];\n`;
    }
    dot += '}\n';
    return dot;
}
function generateMermaidGraph(nodes, links, options) {
    let mermaid = 'graph TD\n';
    // Aggiungi nodi
    for (const node of nodes) {
        let label = node.id;
        if (options.includeNodeText) {
            label += `\\n${node.text.substring(0, 50)}...`;
        }
        if (options.includeNodeTags && node.tags.length > 0) {
            label += `\\nTags: ${node.tags.join(', ')}`;
        }
        mermaid += `  ${node.id}["${label}"]\n`;
    }
    // Aggiungi archi
    for (const link of links) {
        let label = link.relation;
        if (options.includeEdgeMetadata) {
            label += `\\nstrength: ${link.strength.toFixed(2)}`;
            label += `\\nconf: ${link.metadata.confidence.toFixed(2)}`;
        }
        mermaid += `  ${link.sourceId} -->|"${label}"| ${link.targetId}\n`;
    }
    return mermaid;
}
function generateGraphMLGraph(nodes, links, options) {
    let graphml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    graphml += '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n';
    graphml += '  <key id="text" for="node" attr.name="text" attr.type="string"/>\n';
    graphml += '  <key id="tags" for="node" attr.name="tags" attr.type="string"/>\n';
    graphml += '  <key id="relation" for="edge" attr.name="relation" attr.type="string"/>\n';
    graphml += '  <key id="strength" for="edge" attr.name="strength" attr.type="double"/>\n';
    graphml += '  <key id="confidence" for="edge" attr.name="confidence" attr.type="double"/>\n';
    graphml += '  <graph id="G" edgedefault="directed">\n';
    // Aggiungi nodi
    for (const node of nodes) {
        graphml += `    <node id="${node.id}">\n`;
        if (options.includeNodeText) {
            graphml += `      <data key="text">${node.text}</data>\n`;
        }
        if (options.includeNodeTags) {
            graphml += `      <data key="tags">${node.tags.join(',')}</data>\n`;
        }
        graphml += '    </node>\n';
    }
    // Aggiungi archi
    for (const link of links) {
        graphml += `    <edge source="${link.sourceId}" target="${link.targetId}">\n`;
        graphml += `      <data key="relation">${link.relation}</data>\n`;
        if (options.includeEdgeMetadata) {
            graphml += `      <data key="strength">${link.strength}</data>\n`;
            graphml += `      <data key="confidence">${link.metadata.confidence}</data>\n`;
        }
        graphml += '    </edge>\n';
    }
    graphml += '  </graph>\n';
    graphml += '</graphml>\n';
    return graphml;
}
function generateJsonLdGraph(nodes, links, options) {
    const graph = {
        '@context': {
            '@vocab': 'http://example.org/',
            'text': 'http://schema.org/text',
            'tags': 'http://schema.org/keywords',
            'relation': 'http://schema.org/relation',
            'strength': 'http://schema.org/weight',
            'confidence': 'http://schema.org/confidence'
        },
        '@graph': []
    };
    // Aggiungi nodi
    for (const node of nodes) {
        const nodeObj = {
            '@id': node.id,
            '@type': 'Context'
        };
        if (options.includeNodeText) {
            nodeObj.text = node.text;
        }
        if (options.includeNodeTags) {
            nodeObj.tags = node.tags;
        }
        graph['@graph'].push(nodeObj);
    }
    // Aggiungi archi
    for (const link of links) {
        const edgeObj = {
            '@id': link.id,
            '@type': 'Relation',
            'relation': link.relation,
            'source': link.sourceId,
            'target': link.targetId
        };
        if (options.includeEdgeMetadata) {
            edgeObj.strength = link.strength;
            edgeObj.confidence = link.metadata.confidence;
        }
        graph['@graph'].push(edgeObj);
    }
    return JSON.stringify(graph, null, 2);
}
export async function contextGraphExportHandler(args) {
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
        // Genera il grafo nel formato richiesto
        let output;
        switch (args.format || "dot") {
            case "dot":
                output = generateDotGraph(nodes, links, args);
                break;
            case "mermaid":
                output = generateMermaidGraph(nodes, links, args);
                break;
            case "graphml":
                output = generateGraphMLGraph(nodes, links, args);
                break;
            case "json-ld":
                output = generateJsonLdGraph(nodes, links, args);
                break;
            default:
                return {
                    success: false,
                    error: `Formato non supportato: ${args.format}`,
                };
        }
        return {
            success: true,
            output,
        };
    }
    catch (error) {
        return {
            success: false,
            error: `Errore durante l'esportazione del grafo: ${error.message}`,
        };
    }
}
//# sourceMappingURL=contextGraphExportHandler.js.map