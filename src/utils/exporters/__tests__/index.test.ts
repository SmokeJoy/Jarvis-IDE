/**
 * Test per le funzioni di esportazione unificate
 * @jest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportSession, exportSessionToFile, getFormatExtension, formatExtensions } from '../index.js';
import { ExportError } from '../types.js';
import { ExportableSession } from '../types.js';
import * as serializers from '../serializers.js';
import * as sanitize from '../sanitize.js';
import * as fs from 'fs';
import * as path from 'path';

// Mock delle dipendenze
vi.mock('../serializers', () => ({
  toJSON: vi.fn().mockReturnValue('{"mocked":"json"}'),
  toYAML: vi.fn().mockReturnValue('mocked: yaml'),
}));

vi.mock('../sanitize', () => ({
  sanitizeExportObject: vi.fn(data => data),
  extractSanitizeOptions: vi.fn(),
}));

vi.mock('../../logger', () => ({
  Logger: {
    getInstance: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock del filesystem
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  promises: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('util', () => ({
  promisify: vi.fn((fn) => fn),
}));

describe('exportSession', () => {
  const mockSession: ExportableSession = {
    messages: [
      { role: 'user', content: 'Test message' },
    ],
    settings: {
      temperature: 0.7,
      model: 'test-model',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dovrebbe esportare in formato JSON come predefinito', () => {
    const result = exportSession(mockSession);
    
    expect(sanitize.sanitizeExportObject).toHaveBeenCalledWith(mockSession, {});
    expect(serializers.toJSON).toHaveBeenCalled();
    expect(result.format).toBe('JSON');
    expect(result.content).toBe('{"mocked":"json"}');
    expect(result.timestamp).toBeTypeOf('number');
  });

  it('dovrebbe esportare in formato YAML quando specificato', () => {
    const result = exportSession(mockSession, 'YAML');
    
    expect(sanitize.sanitizeExportObject).toHaveBeenCalledWith(mockSession, {});
    expect(serializers.toYAML).toHaveBeenCalled();
    expect(result.format).toBe('YAML');
    expect(result.content).toBe('mocked: yaml');
  });

  it('dovrebbe passare le opzioni di pretty printing ai serializer', () => {
    exportSession(mockSession, 'JSON', { pretty: true });
    expect(serializers.toJSON).toHaveBeenCalledWith(expect.anything(), { indent: 2 });
    
    exportSession(mockSession, 'JSON', { pretty: false });
    expect(serializers.toJSON).toHaveBeenCalledWith(expect.anything(), { indent: 0 });
  });

  it('dovrebbe lanciare un errore per formati non supportati', () => {
    expect(() => exportSession(mockSession, 'CSV')).toThrow(ExportError);
    expect(() => exportSession(mockSession, 'HTML')).toThrow(ExportError);
    expect(() => exportSession(mockSession, 'Markdown')).toThrow(ExportError);
  });

  it('dovrebbe gestire errori durante la sanitizzazione', () => {
    vi.mocked(sanitize.sanitizeExportObject).mockImplementationOnce(() => {
      throw new Error('Errore durante la sanitizzazione');
    });

    expect(() => exportSession(mockSession)).toThrow(ExportError);
  });

  it('dovrebbe gestire errori durante la serializzazione', () => {
    vi.mocked(serializers.toJSON).mockImplementationOnce(() => {
      throw new Error('Errore durante la serializzazione');
    });

    expect(() => exportSession(mockSession)).toThrow(ExportError);
  });
});

describe('exportSessionToFile', () => {
  const mockSession: ExportableSession = {
    messages: [
      { role: 'user', content: 'Test message' },
    ],
  };
  
  const testFilePath = '/path/to/export.json';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('dovrebbe salvare correttamente il file con impostazioni predefinite', async () => {
    // Configure mock
    vi.mocked(fs.existsSync).mockReturnValue(true);
    
    // Execute
    const result = await exportSessionToFile(mockSession, testFilePath);
    
    // Verify
    expect(result).toBe(testFilePath);
    expect(fs.writeFile).toHaveBeenCalledWith(
      testFilePath,
      '{"mocked":"json"}',
      { encoding: 'utf-8' }
    );
  });
  
  it('dovrebbe creare la directory se non esiste', async () => {
    // Configure mock
    vi.mocked(fs.existsSync).mockReturnValue(false);
    
    // Execute
    await exportSessionToFile(mockSession, testFilePath);
    
    // Verify
    expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(testFilePath), { recursive: true });
  });
  
  it('dovrebbe utilizzare l\'encoding specificato nelle opzioni', async () => {
    // Execute
    await exportSessionToFile(mockSession, testFilePath, 'JSON', { encoding: 'ascii' });
    
    // Verify
    expect(fs.writeFile).toHaveBeenCalledWith(
      testFilePath,
      '{"mocked":"json"}',
      { encoding: 'ascii' }
    );
  });
  
  it('dovrebbe propagare gli errori come ExportError', async () => {
    // Configure mock
    vi.mocked(fs.writeFile).mockImplementationOnce(() => {
      throw new Error('Errore di scrittura file');
    });
    
    // Verify
    await expect(exportSessionToFile(mockSession, testFilePath))
      .rejects
      .toThrow(ExportError);
  });
});

describe('getFormatExtension', () => {
  it('dovrebbe restituire le estensioni corrette per ogni formato', () => {
    expect(getFormatExtension('JSON')).toBe('.json');
    expect(getFormatExtension('YAML')).toBe('.yaml');
    expect(getFormatExtension('Markdown')).toBe('.md');
    expect(getFormatExtension('CSV')).toBe('.csv');
    expect(getFormatExtension('HTML')).toBe('.html');
  });
  
  it('dovrebbe avere mappature per tutti i formati supportati', () => {
    const supportedFormats = ['JSON', 'YAML', 'Markdown', 'CSV', 'HTML'];
    
    for (const format of supportedFormats) {
      expect(formatExtensions).toHaveProperty(format);
    }
  });
}); 