import { jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { configLinter } from './configLinter';

// Mock del modulo fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

// Mock del modulo path
jest.mock('path', () => ({
  extname: jest.fn(),
}));

describe('configLinter', () => {
  // Resetta tutti i mock prima di ogni test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dovrebbe validare correttamente un file JSON valido', async () => {
    // Arrange
    const args = {
      configPath: '/path/to/config.json',
      configType: 'json' as const,
    };

    const validJson = JSON.stringify({
      version: '1.0.0',
      name: 'test-config',
      dependencies: {
        test: '1.0.0',
      },
    });

    (fs.readFile as jest.Mock).mockResolvedValue(validJson);
    (path.extname as jest.Mock).mockReturnValue('.json');

    // Act
    const result = await configLinter(args);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.isValid).toBe(true);
    expect(result.data?.errors.length).toBe(0);
    expect(fs.readFile).toHaveBeenCalledWith('/path/to/config.json', 'utf-8');
  });

  it('dovrebbe rilevare mancanza di version in JSON', async () => {
    // Arrange
    const args = {
      configPath: '/path/to/config.json',
      configType: 'json' as const,
    };

    const jsonWithoutVersion = JSON.stringify({
      name: 'test-config',
      dependencies: {},
    });

    (fs.readFile as jest.Mock).mockResolvedValue(jsonWithoutVersion);
    (path.extname as jest.Mock).mockReturnValue('.json');

    // Act
    const result = await configLinter(args);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.isValid).toBe(true);
    expect(result.data?.warnings.length).toBeGreaterThan(0);
    expect(result.data?.warnings[0].code).toBe('MISSING_VERSION');
  });

  it('dovrebbe rilevare valori vuoti in JSON', async () => {
    // Arrange
    const args = {
      configPath: '/path/to/config.json',
      configType: 'json' as const,
    };

    const jsonWithEmptyValues = JSON.stringify({
      version: '1.0.0',
      name: '',
      description: null,
    });

    (fs.readFile as jest.Mock).mockResolvedValue(jsonWithEmptyValues);
    (path.extname as jest.Mock).mockReturnValue('.json');

    // Act
    const result = await configLinter(args);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.warnings.some((w) => w.code === 'EMPTY_VALUE')).toBe(true);
    expect(result.data?.warnings.some((w) => w.code === 'NULL_VALUE')).toBe(true);
  });

  it('dovrebbe rilevare JSON non valido', async () => {
    // Arrange
    const args = {
      configPath: '/path/to/config.json',
      configType: 'json' as const,
    };

    const invalidJson = '{name:"test",version:1.0.0}'; // JSON non valido (mancano le virgolette)

    (fs.readFile as jest.Mock).mockResolvedValue(invalidJson);
    (path.extname as jest.Mock).mockReturnValue('.json');

    // Act
    const result = await configLinter(args);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.isValid).toBe(false);
    expect(result.data?.errors.length).toBeGreaterThan(0);
    expect(result.data?.errors[0].code).toBe('INVALID_JSON');
  });

  it('dovrebbe validare correttamente un file .env', async () => {
    // Arrange
    const args = {
      configPath: '/path/to/.env',
      configType: 'env' as const,
    };

    const validEnv = `
      # Variabili di ambiente
      NODE_ENV=development
      PORT=3000
      DEBUG=true
    `;

    (fs.readFile as jest.Mock).mockResolvedValue(validEnv);
    (path.extname as jest.Mock).mockReturnValue('.env');

    // Act
    const result = await configLinter(args);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.isValid).toBe(true);
    expect(result.data?.errors.length).toBe(0);
  });

  it('dovrebbe rilevare errori in file .env', async () => {
    // Arrange
    const args = {
      configPath: '/path/to/.env',
      configType: 'env' as const,
    };

    const invalidEnv = `
      # Variabili di ambiente
      NODE_ENV=development
      PORT 3000
      =valore
      API_KEY=
    `;

    (fs.readFile as jest.Mock).mockResolvedValue(invalidEnv);
    (path.extname as jest.Mock).mockReturnValue('.env');

    // Act
    const result = await configLinter(args);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.errors.length).toBeGreaterThan(0);
    expect(result.data?.warnings.length).toBeGreaterThan(0);
  });

  it('dovrebbe suggerire sicurezza per chiavi sensibili', async () => {
    // Arrange
    const args = {
      configPath: '/path/to/.env',
      configType: 'env' as const,
    };

    const envWithSensitiveKeys = `
      API_KEY=abcdef12345
      SECRET_TOKEN=very-secret
      PASSWORD=unsafe-password
    `;

    (fs.readFile as jest.Mock).mockResolvedValue(envWithSensitiveKeys);
    (path.extname as jest.Mock).mockReturnValue('.env');

    // Act
    const result = await configLinter(args);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.suggestions.length).toBe(3); // Una per ogni chiave sensibile
  });

  it('dovrebbe rilevare errore se il file non esiste', async () => {
    // Arrange
    const args = {
      configPath: '/path/non-esistente/config.json',
      configType: 'json' as const,
    };

    (fs.readFile as jest.Mock).mockRejectedValue(new Error('File non trovato'));

    // Act
    const result = await configLinter(args);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.isValid).toBe(false);
    expect(result.data?.errors[0].code).toBe('FILE_READ_ERROR');
  });

  it('dovrebbe rilevare che YAML non è ancora implementato', async () => {
    // Arrange
    const args = {
      configPath: '/path/to/config.yaml',
      configType: 'yaml' as const,
    };

    (fs.readFile as jest.Mock).mockResolvedValue('key: value');
    (path.extname as jest.Mock).mockReturnValue('.yaml');

    // Act
    const result = await configLinter(args);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.warnings[0].code).toBe('YAML_NOT_IMPLEMENTED');
  });

  it('dovrebbe auto-rilevare il tipo di configurazione dal file extension', async () => {
    // Arrange
    const args = {
      configPath: '/path/to/config.env',
      configType: 'auto' as const,
    };

    const validEnv = 'KEY=VALUE';

    (fs.readFile as jest.Mock).mockResolvedValue(validEnv);
    (path.extname as jest.Mock).mockReturnValue('.env');

    // Act
    const result = await configLinter(args);

    // Assert
    expect(result.success).toBe(true);
    expect(fs.readFile).toHaveBeenCalled();
  });

  it('dovrebbe supportare retrocompatibilità con filePath', async () => {
    // Arrange
    const args = {
      filePath: '/path/to/config.json', // Vecchio nome parametro
      configType: 'json' as const,
    };

    const validJson = '{"version":"1.0.0"}';
    (fs.readFile as jest.Mock).mockResolvedValue(validJson);
    (path.extname as jest.Mock).mockReturnValue('.json');

    // Act
    const result = await configLinter(args as any);

    // Assert
    expect(result.success).toBe(true);
    expect(fs.readFile).toHaveBeenCalledWith('/path/to/config.json', 'utf-8');
  });
});
