/**
 * @file setupTests.ts
 * @description Configurazione globale per i test Vitest con React Testing Library
 */

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Esegui cleanup automatico dopo ogni test
afterEach(() => {
  cleanup();
});

// Import setup dei mock per WebView
import './__tests__/setupWebviewMocks';

// Configurazione personalizzata di matchers aggiuntivi qui se necessario 