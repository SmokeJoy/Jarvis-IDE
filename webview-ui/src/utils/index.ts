/**
 * @file index.ts
 * @description Esporta utility e istanze singleton per la WebView
 */

import { WebviewDispatcher } from './WebviewDispatcher';
import { logger } from './Logger';

// Esporta l'istanza singleton di WebviewDispatcher
export const webviewDispatcher = new WebviewDispatcher();

// Esporta utility
export { logger };

// Esporta tipi e classi
export * from './validate';
export { WebviewDispatcher } from './WebviewDispatcher';

const logger = createComponentLogger('WebviewBridge');
export const webviewBridge = WebviewBridge.getInstance(logger);

export * from './WebviewBridge'; 