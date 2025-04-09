// import { mentionRegex } from "../shared/context-mentions.js.js"; // Rimuovi import e correggi percorso

export enum ContextMenuOptionType {
  File = 'file',
  Folder = 'folder',
  NoResults = 'no-results'
}

export interface ContextMenuQueryItem {
  type: ContextMenuOptionType;
  value: string;
}

export function searchFiles(/* query: string */): ContextMenuQueryItem[] { // Rimuovi parametro non utilizzato
  const files: ContextMenuQueryItem[] = []; // Implementazione della ricerca file
  return files.length > 0 
    ? files 
    : [{ type: ContextMenuOptionType.NoResults, value: 'No results found' }];
}

export function searchFolders(/* query: string */): ContextMenuQueryItem[] { // Rimuovi parametro non utilizzato
  const folders: ContextMenuQueryItem[] = []; // Implementazione della ricerca cartelle
  return folders.length > 0
    ? folders
    : [{ type: ContextMenuOptionType.NoResults, value: 'No results found' }];
} 