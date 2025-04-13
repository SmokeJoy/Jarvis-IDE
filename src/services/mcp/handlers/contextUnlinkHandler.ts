import { ContextItem, getMemoryContexts } from '../../memory/context';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';

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

interface UnlinkOptions {
  sourceId: string;
  targetId: string;
  relation?: string;
  bidirectional?: boolean;
}

async function getContextLinks(): Promise<ContextLink[]> {
  try {
    const linksPath = path.join(__dirname, '../../data/context_links.json');
    const data = await readFile(linksPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveContextLinks(links: ContextLink[]): Promise<void> {
  const linksPath = path.join(__dirname, '../../data/context_links.json');
  await writeFile(linksPath, JSON.stringify(links, null, 2));
}

export async function contextUnlinkHandler(
  args: UnlinkOptions
): Promise<{ success: boolean; output?: { removed: number }; error?: string }> {
  try {
    // Recupera i link esistenti
    const links = await getContextLinks();

    // Filtra i link da rimuovere
    const linksToRemove = links.filter((link) => {
      // Verifica se il link corrisponde ai criteri
      const matchesSourceTarget =
        (link.sourceId === args.sourceId && link.targetId === args.targetId) ||
        (args.bidirectional && link.sourceId === args.targetId && link.targetId === args.sourceId);

      const matchesRelation = !args.relation || link.relation === args.relation;

      return matchesSourceTarget && matchesRelation;
    });

    if (linksToRemove.length === 0) {
      return {
        success: true,
        output: { removed: 0 },
      };
    }

    // Rimuovi i link
    const remainingLinks = links.filter(
      (link) => !linksToRemove.some((toRemove) => toRemove.id === link.id)
    );

    // Salva i link aggiornati
    await saveContextLinks(remainingLinks);

    return {
      success: true,
      output: { removed: linksToRemove.length },
    };
  } catch (error) {
    return {
      success: false,
      error: `Errore durante la rimozione delle relazioni: ${error.message}`,
    };
  }
}
