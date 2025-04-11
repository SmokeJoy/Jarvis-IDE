import type { ContextItem, getMemoryContexts } from "../../memory/context.js";
import { readFile } from "fs/promises";
import path from "path";

interface ContextLink {
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

interface LinksOfOptions {
  id: string;
  direction?: "incoming" | "outgoing" | "both";
  relation?: string;
  minStrength?: number;
  minConfidence?: number;
}

interface LinksOfResult {
  incoming: ContextLink[];
  outgoing: ContextLink[];
}

async function getContextLinks(): Promise<ContextLink[]> {
  try {
    const linksPath = path.join(__dirname, "../../data/context_links.json");
    const data = await readFile(linksPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function filterLinks(
  links: ContextLink[],
  options: LinksOfOptions
): ContextLink[] {
  return links.filter((link) => {
    // Filtra per direzione
    const isIncoming = link.targetId === options.id;
    const isOutgoing = link.sourceId === options.id;
    if (options.direction === "incoming" && !isIncoming) return false;
    if (options.direction === "outgoing" && !isOutgoing) return false;
    if (options.direction === "both" && !isIncoming && !isOutgoing) return false;

    // Filtra per tipo di relazione
    if (options.relation && link.relation !== options.relation) return false;

    // Filtra per forza minima
    if (options.minStrength && link.strength < options.minStrength) return false;

    // Filtra per confidenza minima
    if (
      options.minConfidence &&
      link.metadata.confidence < options.minConfidence
    ) return false;

    return true;
  });
}

export async function contextLinksOfHandler(
  args: LinksOfOptions
): Promise<{ success: boolean; output?: LinksOfResult; error?: string }> {
  try {
    // Verifica che il contesto esista
    const contexts = await getMemoryContexts();
    const contextExists = contexts.some((ctx) => ctx.id === args.id);
    if (!contextExists) {
      return {
        success: false,
        error: `Contesto con ID ${args.id} non trovato`,
      };
    }

    // Recupera e filtra i link
    const allLinks = await getContextLinks();
    const filteredLinks = filterLinks(allLinks, args);

    // Separa i link in incoming e outgoing
    const result: LinksOfResult = {
      incoming: filteredLinks.filter((link) => link.targetId === args.id),
      outgoing: filteredLinks.filter((link) => link.sourceId === args.id),
    };

    return {
      success: true,
      output: result,
    };
  } catch (error) {
    return {
      success: false,
      error: `Errore durante il recupero dei link: ${error.message}`,
    };
  }
} 