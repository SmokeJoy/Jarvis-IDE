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
    media_type: string;
    data: string;
}
/**
 * Sorgente immagine basata su URL
 */
export interface URLImageSource {
    type: 'url';
    url: string;
    media_type?: string;
    data?: string | object;
}
/**
 * Tipo unione per le diverse sorgenti di immagini
 */
export type ImageSource = Base64ImageSource | URLImageSource;
//# sourceMappingURL=image.types.d.ts.map