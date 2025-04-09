import type { ContextItem } from '../types/ContextItem.js.js';
import type { getMemoryContexts } from '../utils/memoryUtils.js.js';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

interface ContextLink {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  bidirectional: boolean;
  strength: number;
  metadata: {
    confidence?: number;
    source?: string;
    timestamp: string;
  };
}

interface LinkOptions {
  sourceId: string;
  targetId: string;
  relation: string;
  bidirectional?: boolean;
  strength?: number;
  metadata?: {
    confidence?: number;
    source?: string;
  };
}

const LINKS_FILE = path.join(__dirname, '../../data/context_links.json');

async function getContextLinks(): Promise<ContextLink[]> {
  try {
    if (!fs.existsSync(LINKS_FILE)) {
      return [];
    }
    const data = await fs.promises.readFile(LINKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Errore nel caricamento dei link:', error);
    return [];
  }
}

async function saveContextLinks(links: ContextLink[]): Promise<void> {
  try {
    await fs.promises.writeFile(LINKS_FILE, JSON.stringify(links, null, 2));
  } catch (error) {
    console.error('Errore nel salvataggio dei link:', error);
    throw error;
  }
}

async function createLink(options: LinkOptions): Promise<ContextLink> {
  const { sourceId, targetId, relation, bidirectional = false, strength = 0.5, metadata = {} } = options;
  
  // Verifica esistenza dei contesti
  const contexts = await getMemoryContexts();
  const sourceExists = contexts.some(ctx => ctx.id === sourceId);
  const targetExists = contexts.some(ctx => ctx.id === targetId);
  
  if (!sourceExists || !targetExists) {
    throw new Error(`Contesto non trovato: ${!sourceExists ? sourceId : targetId}`);
  }
  
  // Crea il link
  const link: ContextLink = {
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
    const inverseLink: ContextLink = {
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

export async function contextLinkHandler(args: any): Promise<{ success: boolean; output?: any; error?: string }> {
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
  } catch (error) {
    return {
      success: false,
      error: `Errore durante la creazione del link: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 