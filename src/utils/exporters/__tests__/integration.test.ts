import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sanitizeExportObject } from '../sanitize';
import fs from 'fs';
import path from 'path';
import { ExportOptions } from '../types';

// Mock di fs
vi.mock('fs', () => ({
  promises: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  },
  existsSync: vi.fn().mockReturnValue(false),
}));

// Mock di path
vi.mock('path', () => ({
  dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/')),
  join: vi.fn((...args) => args.join('/')),
}));

describe('Integrazione del sistema di esportazione', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("dovrebbe sanitizzare correttamente i dati prima dell'esportazione", () => {
    const testData = {
      name: 'Test User',
      createdAt: new Date('2023-01-01T12:00:00Z'),
      updatedAt: null,
      settings: {
        theme: 'dark',
        notifications: undefined,
        preferences: {
          veryDeepSetting: 'value',
        },
      },
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };

    const exportOptions: Partial<ExportOptions> = {
      removeNull: true,
      removeUndefined: true,
      maxDepth: 2,
      maxStringLength: 10,
      maxArrayLength: 5,
    };

    const sanitizedData = sanitizeExportObject(testData, exportOptions);

    // Verifica sanitizzazione
    expect(sanitizedData).toEqual({
      name: 'Test User',
      createdAt: '2023-01-01T12:00:00.000Z',
      settings: {
        theme: 'dark',
        preferences: '[Oggetto]',
      },
      items: [1, 2, 3, 4, 5, '... (5 elementi omessi)'],
    });
  });

  it('dovrebbe sanitizzare dati complessi in modo consistente', () => {
    // Caso d'uso più complesso con vari tipi di dati
    const complexData = {
      id: 123456789,
      name: 'Progetto molto lungo che verrà troncato',
      description: null,
      metadata: {
        owner: {
          id: 1,
          username: 'utente123',
          profile: {
            bio: 'Una biografia molto lunga che dovrebbe essere troncata in base alle impostazioni di sanitizzazione',
            socialLinks: ['link1', 'link2', 'link3', 'link4', 'link5', 'link6'],
          },
        },
        created: new Date('2023-05-15T08:30:00Z'),
        updated: new Date('2023-06-20T15:45:00Z'),
        tags: ['javascript', 'typescript', 'react', 'test', 'export', 'sanitize', 'data'],
      },
      config: undefined,
      stats: {
        views: 1000,
        likes: 250,
        shares: null,
      },
      specialFunction: function () {
        return 'test';
      },
    };

    // Funzione di esportazione che utilizza sanitizeExportObject
    const sanitizedComplexData = sanitizeExportObject(complexData, {
      removeNull: true,
      removeUndefined: true,
      maxDepth: 3,
      maxStringLength: 20,
      maxArrayLength: 3,
    });

    // Verifiche
    expect(sanitizedComplexData).toHaveProperty('id', 123456789);
    expect(sanitizedComplexData).toHaveProperty('name', 'Progetto molto lung...');
    expect(sanitizedComplexData).not.toHaveProperty('description'); // Rimosso perché null
    expect(sanitizedComplexData).not.toHaveProperty('config'); // Rimosso perché undefined
    expect(sanitizedComplexData).not.toHaveProperty('specialFunction'); // Rimosso perché funzione

    // Verifica oggetti annidati
    expect(sanitizedComplexData.metadata).toHaveProperty('owner');
    expect(sanitizedComplexData.metadata.owner).toHaveProperty('id', 1);
    expect(sanitizedComplexData.metadata.owner).toHaveProperty('username', 'utente123');
    expect(sanitizedComplexData.metadata.owner.profile.bio).toBe('Una biografia molto...');

    // Verifica array troncati
    expect(sanitizedComplexData.metadata.owner.profile.socialLinks).toHaveLength(4); // 3 elementi + messaggio
    expect(sanitizedComplexData.metadata.owner.profile.socialLinks[3]).toContain('elementi omessi');

    // Verifica date convertite
    expect(sanitizedComplexData.metadata.created).toBe('2023-05-15T08:30:00.000Z');
    expect(sanitizedComplexData.metadata.updated).toBe('2023-06-20T15:45:00.000Z');

    // Verifica rimozione dei null
    expect(sanitizedComplexData.stats).not.toHaveProperty('shares');
  });
});
