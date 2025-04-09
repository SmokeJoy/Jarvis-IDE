/**
 * @deprecated Questo file è stato deprecato.
 * Tutti i tipi relativi alle immagini sono stati spostati in src/types/chat.types.ts
 * Utilizzare i tipi ImageBlock e le funzioni di utilità da chat.types.ts.
 */

/**
 * Definizioni dei tipi relative alle immagini utilizzate nelle API
 */

/**
 * Sorgente immagine codificata in base64
 */
export interface Base64ImageSource {
  type: 'base64';
  media_type: string;  // ad es. "image/jpeg", "image/png"
  data: string;        // dati codificati in base64
}

/**
 * Sorgente immagine basata su URL
 */
export interface URLImageSource {
  type: 'url';
  url: string;         // URL dell'immagine
  media_type?: string; // opzionale per URL
  data?: string | object;       // opzionale per URL, può essere stringa o oggetto
}

/**
 * Tipo unione per le diverse sorgenti di immagini
 */
export type ImageSource = Base64ImageSource | URLImageSource; 

// Importazione per riferimento
// import { ImageBlock, isImageBlock } from '../../types/chat.types.js.js'; 