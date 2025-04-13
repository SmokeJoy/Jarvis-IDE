/**
 * @file test-utils.ts
 * @description Utility per i test delle funzionalità MAS
 * @version 1.0.0
 */

import { vi } from 'vitest';

/**
 * Tipo per gli agenti che rispecchia l'interfaccia usata dai test
 */
export interface Agent {
  status: {
    id: string;
    name: string;
    mode: string;
    isActive: boolean;
    enabled: boolean;
    warnings: string[];
  };
  initialize: ReturnType<typeof vi.fn>;
  activate: ReturnType<typeof vi.fn>;
  deactivate: ReturnType<typeof vi.fn>;
  getStatus: ReturnType<typeof vi.fn>;
  setEnabled: ReturnType<typeof vi.fn>;
  handleMessage: ReturnType<typeof vi.fn>;
}

/**
 * Crea un agente mock per i test
 *
 * @param id ID dell'agente
 * @param name Nome dell'agente
 * @param mode Modalità dell'agente (default: 'assistant')
 * @returns Un oggetto agente mock con metodi simulati
 */
export const createMockAgent = (id: string, name: string, mode = 'assistant'): Agent => {
  // Creiamo un oggetto con la struttura di stato desiderata
  const mockStatus = {
    id,
    name,
    mode,
    isActive: true,
    enabled: true,
    warnings: [],
  };

  // Creiamo i mock delle funzioni
  const mockSetEnabled = vi.fn().mockImplementation((value: boolean) => {
    mockStatus.enabled = value;
  });

  // Creiamo l'oggetto agent con i mock
  return {
    status: mockStatus,
    initialize: vi.fn().mockResolvedValue(true),
    activate: vi.fn().mockResolvedValue(true),
    deactivate: vi.fn().mockResolvedValue(true),
    getStatus: vi.fn().mockReturnValue(mockStatus),
    setEnabled: mockSetEnabled,
    handleMessage: vi.fn().mockResolvedValue(true),
  };
};
