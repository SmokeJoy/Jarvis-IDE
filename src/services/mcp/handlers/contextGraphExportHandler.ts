/**
 * @file contextGraphExportHandler.ts
 * @description Handler per l'esportazione del grafo del contesto in vari formati
 */

import { ContextItem, getMemoryContexts } from '../../memory/context';
import { readFile } from 'fs/promises';
import path from 'path';
import { getLogger } from '../../../shared/logging';

const logger = getLogger('contextGraphExportHandler');

// Costanti di configurazione
const DEFAULT_DEPTH = 1;
const DEFAULT_FORMAT = 'dot' as const;
const SUPPORTED_FORMATS = ['dot', 'mermaid', 'graphml', 'json-ld'] as const;
const MIN_STRENGTH = 0;
const MAX_STRENGTH = 1;
const MIN_CONFIDENCE = 0;
const MAX_CONFIDENCE = 1;

/**
 * Interfaccia per i link tra contesti
 */
export interface ContextLink {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  bidirectional: boolean;
  strength: number;
  metadata: {
    confidence: number;
    source: string;
    timestamp: string;
  };
}

/**
 * Opzioni per l'esportazione del grafo
 */
export interface GraphExportOptions {
  rootId: string;
  format?: (typeof SUPPORTED_FORMATS)[number];
  depth?: number;
  direction?: 'incoming' | 'outgoing' | 'both';
  relation?: string;
  minStrength?: number;
  minConfidence?: number;
  includeRoot?: boolean;
  includeIsolated?: boolean;
  includeNodeText?: boolean;
  includeNodeTags?: boolean;
  includeEdgeMetadata?: boolean;
}

/**
 * Risultato dell'esportazione del grafo
 */
export interface GraphExportResult {
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * Recupera i link tra contesti dal file di persistenza
 */
async function getContextLinks(): Promise<ContextLink[]> {
  try {
    const linksPath = path.join(__dirname, '../../data/context_links.json');
    const data = await readFile(linksPath, 'utf-8');
    return JSON.parse(data) as ContextLink[];
  } catch (error) {
    logger.error('Errore nel recupero dei link:', error);
    return [];
  }
}

/**
 * Filtra i link in base alle opzioni specificate
 */
function filterLinks(links: ContextLink[], options: GraphExportOptions): ContextLink[] {
  return links.filter((link) => {
    // Filtra per direzione
    if (options.direction === 'incoming' && link.targetId !== options.rootId) return false;
    if (options.direction === 'outgoing' && link.sourceId !== options.rootId) return false;

    // Filtra per relazione
    if (options.relation && link.relation !== options.relation) return false;

    // Filtra per forza e confidenza
    if (options.minStrength && link.strength < options.minStrength) return false;
    if (options.minConfidence && link.metadata.confidence < options.minConfidence) return false;

    return true;
  });
}

/**
 * Esplora il grafo a partire da un nodo radice
 */
async function exploreGraph(
  rootId: string,
  depth: number,
  visited: Set<string>,
  allLinks: ContextLink[],
  options: GraphExportOptions
): Promise<{ nodes: Set<string>; links: ContextLink[] }> {
  if (depth === 0) return { nodes: new Set(), links: [] };

  const nodes = new Set<string>();
  const links: ContextLink[] = [];

  // Trova tutti i link rilevanti per il nodo corrente
  const relevantLinks = allLinks.filter(
    (link) => link.sourceId === rootId || link.targetId === rootId
  );

  for (const link of relevantLinks) {
    const otherId = link.sourceId === rootId ? link.targetId : link.sourceId;

    if (!visited.has(otherId)) {
      visited.add(otherId);
      nodes.add(otherId);
      links.push(link);

      // Esplora ricorsivamente
      const { nodes: childNodes, links: childLinks } = await exploreGraph(
        otherId,
        depth - 1,
        visited,
        allLinks,
        options
      );

      childNodes.forEach((node) => nodes.add(node));
      childLinks.forEach((link) => links.push(link));
    }
  }

  return { nodes, links };
}

function escapeDotString(str: string): string {
  return str.replace(/[{}"]/g, '\\$&');
}

function generateDotGraph(
  nodes: ContextItem[],
  links: ContextLink[],
  options: GraphExportOptions
): string {
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

function generateMermaidGraph(
  nodes: ContextItem[],
  links: ContextLink[],
  options: GraphExportOptions
): string {
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

function generateGraphMLGraph(
  nodes: ContextItem[],
  links: ContextLink[],
  options: GraphExportOptions
): string {
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

function generateJsonLdGraph(
  nodes: ContextItem[],
  links: ContextLink[],
  options: GraphExportOptions
): string {
  const graph = {
    '@context': {
      '@vocab': 'http://example.org/',
      text: 'http://schema.org/text',
      tags: 'http://schema.org/keywords',
      relation: 'http://schema.org/relation',
      strength: 'http://schema.org/weight',
      confidence: 'http://schema.org/confidence',
    },
    '@graph': [] as any[],
  };

  // Aggiungi nodi
  for (const node of nodes) {
    const nodeObj: any = {
      '@id': node.id,
      '@type': 'Context',
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
    const edgeObj: any = {
      '@id': link.id,
      '@type': 'Relation',
      relation: link.relation,
      source: link.sourceId,
      target: link.targetId,
    };
    if (options.includeEdgeMetadata) {
      edgeObj.strength = link.strength;
      edgeObj.confidence = link.metadata.confidence;
    }
    graph['@graph'].push(edgeObj);
  }

  return JSON.stringify(graph, null, 2);
}

/**
 * Handler principale per l'esportazione del grafo
 */
export async function contextGraphExportHandler(
  args: GraphExportOptions
): Promise<GraphExportResult> {
  try {
    // Validazione input
    if (!args.rootId) {
      return {
        success: false,
        error: 'ID radice mancante',
      };
    }

    if (args.format && !SUPPORTED_FORMATS.includes(args.format)) {
      return {
        success: false,
        error: `Formato non supportato: ${args.format}`,
      };
    }

    if (args.minStrength && (args.minStrength < MIN_STRENGTH || args.minStrength > MAX_STRENGTH)) {
      return {
        success: false,
        error: `minStrength deve essere tra ${MIN_STRENGTH} e ${MAX_STRENGTH}`,
      };
    }

    if (
      args.minConfidence &&
      (args.minConfidence < MIN_CONFIDENCE || args.minConfidence > MAX_CONFIDENCE)
    ) {
      return {
        success: false,
        error: `minConfidence deve essere tra ${MIN_CONFIDENCE} e ${MAX_CONFIDENCE}`,
      };
    }

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
    const visited = new Set<string>();
    if (args.includeRoot !== false) {
      visited.add(args.rootId);
    }

    const { nodes: nodeIds, links } = await exploreGraph(
      args.rootId,
      args.depth || DEFAULT_DEPTH,
      visited,
      filteredLinks,
      args
    );

    // Recupera i contesti per i nodi trovati
    const nodes = contexts.filter((ctx) => nodeIds.has(ctx.id));

    // Aggiungi contesti isolati se richiesto
    if (args.includeIsolated) {
      const connectedNodeIds = new Set([...nodeIds, args.rootId]);
      const isolatedNodes = contexts.filter((ctx) => !connectedNodeIds.has(ctx.id));
      nodes.push(...isolatedNodes);
    }

    // Genera il grafo nel formato richiesto
    let output: string;
    const format = args.format || DEFAULT_FORMAT;

    switch (format) {
      case 'dot':
        output = generateDotGraph(nodes, links, args);
        break;
      case 'mermaid':
        output = generateMermaidGraph(nodes, links, args);
        break;
      case 'graphml':
        output = generateGraphMLGraph(nodes, links, args);
        break;
      case 'json-ld':
        output = generateJsonLdGraph(nodes, links, args);
        break;
      default:
        return {
          success: false,
          error: `Formato non supportato: ${format}`,
        };
    }

    return {
      success: true,
      output,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error("Errore durante l'esportazione del grafo:", error);
    return {
      success: false,
      error: `Errore durante l'esportazione del grafo: ${errorMessage}`,
    };
  }
}
