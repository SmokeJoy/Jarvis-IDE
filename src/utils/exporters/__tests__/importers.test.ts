/**
 * Test per le funzionalità di importazione
 * @jest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  importFromString,
  importFromBuffer,
  detectFormatFromExtension,
  ImportOptions,
  validateExportableSession,
  ExportableSession,
} from '../importers';
import * as serializers from '../serializers';
import { ExportFormat, ExportError } from '../types';
import { Logger } from '../../logger';
import * as fs from 'fs';
import * as path from 'path';
import { mockMessage } from '../../../../test/utils/factories';
import { createChatMessage } from "../../../src/shared/types/chat.types";

// Mock delle dipendenze
vi.mock('../serializers', () => ({
  fromJSON: vi.fn().mockImplementation((content) => {
    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error('Mock JSON parse error');
    }
  }),
  fromYAML: vi.fn().mockImplementation((content) => {
    if (!content || content.includes('invalid')) {
      throw new Error('Mock YAML parse error');
    }
    return { messages: [mockMessage('user', 'Messaggio da YAML')] };
  }),
}));

vi.mock('../../logger', () => ({
  Logger: {
    getInstance: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  readFileSync: vi.fn().mockReturnValue('{"mocked":"content"}'),
  promises: {
    readFile: vi.fn().mockResolvedValue('{"mocked":"content"}'),
  },
}));

describe('Importers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectFormatFromExtension', () => {
    it('dovrebbe rilevare correttamente il formato dai vari tipi di file', () => {
      expect(detectFormatFromExtension('file.json')).toBe('JSON');
      expect(detectFormatFromExtension('file.yaml')).toBe('YAML');
      expect(detectFormatFromExtension('file.yml')).toBe('YAML');
      expect(detectFormatFromExtension('file.md')).toBe('Markdown');
      expect(detectFormatFromExtension('file.markdown')).toBe('Markdown');
      expect(detectFormatFromExtension('file.csv')).toBe('CSV');
      expect(detectFormatFromExtension('file.html')).toBe('HTML');
      expect(detectFormatFromExtension('file.htm')).toBe('HTML');
    });

    it('dovrebbe restituire null per estensioni sconosciute', () => {
      expect(detectFormatFromExtension('file.unknown')).toBeNull();
      expect(detectFormatFromExtension('file')).toBeNull();
    });

    it('dovrebbe gestire nomi di file con percorsi complessi', () => {
      expect(detectFormatFromExtension('/path/to/file.json')).toBe('JSON');
      expect(detectFormatFromExtension('C:\\path\\to\\file.yaml')).toBe('YAML');
    });

    it('dovrebbe essere insensibile alle maiuscole/minuscole', () => {
      expect(detectFormatFromExtension('file.JSON')).toBe('JSON');
      expect(detectFormatFromExtension('file.Yaml')).toBe('YAML');
    });
  });

  describe('importFromString', () => {
    it('dovrebbe importare correttamente da JSON', () => {
      const jsonContent = '{"messages":[{"role":"user","content":"Test","timestamp":1617876123000}]}';
      const result = importFromString(jsonContent, 'JSON');

      expect(serializers.fromJSON).toHaveBeenCalledWith(jsonContent);
      expect(result).toHaveProperty('messages');
      expect((result.messages ?? [])[0]?.content).toBe('Test');
    });

    it('dovrebbe importare correttamente da YAML', () => {
      const yamlContent = 'messages:\n  - role: user\n    content: Test';
      const result = importFromString(yamlContent, 'YAML');

      expect(serializers.fromYAML).toHaveBeenCalledWith(yamlContent);
      expect(result).toHaveProperty('messages');
    });

    it('dovrebbe importare correttamente da Markdown', () => {
      const markdownContent = `# Conversazione Esportata

**Modello**: gpt-4  
**Data**: 12/04/2023  

## 📝 Prompt di Sistema

Sei un assistente AI.

## ⚙️ Impostazioni

| Parametro | Valore |
|-----------|--------|
| temperature | 0.7 |
| model | gpt-4 |

## 💬 Conversazione

### 👤 Utente

Ciao, come stai?

### 🤖 Assistente

Ciao! Sto bene, grazie. Come posso aiutarti oggi?
`;

      const result = importFromString(markdownContent, 'Markdown');

      expect(result).toHaveProperty('messages');
      expect((result.messages ?? []).length).toBe(2);
      expect((result.messages ?? [])[0]?.role).toBe('user');
      expect((result.messages ?? [])[0]?.content).toBe('Ciao, come stai?');
      expect((result.messages ?? [])[1]?.role).toBe('assistant');
      expect(result.systemPrompt).toBe('Conversazione Esportata');
      expect(result.settings).toHaveProperty('temperature');
      expect(result.settings.temperature).toBe(0.7);
    });

    it('dovrebbe importare correttamente da CSV', () => {
      const csvContent = `timestamp,role,content
2023-04-12T10:00:00Z,system,Sei un assistente
2023-04-12T10:01:00Z,user,Ciao
2023-04-12T10:02:00Z,assistant,"Ciao, come posso aiutarti?"`;

      const result = importFromString(csvContent, 'CSV');

      expect(result).toHaveProperty('messages');
      expect((result.messages ?? []).length).toBe(3);
      expect((result.messages ?? [])[0]?.role).toBe('system');
      expect((result.messages ?? [])[1]?.role).toBe('user');
      expect((result.messages ?? [])[2]?.role).toBe('assistant');
      expect((result.messages ?? [])[2]?.content).toBe('Ciao, come posso aiutarti?');
    });

    it('dovrebbe gestire CSV con virgolette e caratteri speciali', () => {
      const csvContent = `role,content
user,"Testo con virgola, e ""virgolette"""
assistant,"Risposta
su più righe"`;

      const result = importFromString(csvContent, 'CSV');

      expect((result.messages ?? []).length).toBe(2);
      expect((result.messages ?? [])[0]?.content).toBe('Testo con virgola, e "virgolette"');
      expect((result.messages ?? [])[1]?.content).toBe('Risposta\nsu più righe');
    });

    it('dovrebbe importare correttamente da HTML', () => {
      const htmlContent = `<!DOCTYPE html>
<html>
<head><title>Conversazione</title></head>
<body>
  <h1>Test Conversation</h1>
  <div class="message user">
    <div class="role">👤 Utente</div>
    <div class="content"><p>Ciao!</p></div>
  </div>
  <div class="message assistant">
    <div class="role">🤖 Assistente</div>
    <div class="content"><p>Ciao, come posso aiutarti?</p></div>
  </div>
</body>
</html>`;

      const result = importFromString(htmlContent, 'HTML');

      expect(result).toHaveProperty('messages');
      expect((result.messages ?? []).length).toBe(2);
      expect((result.messages ?? [])[0]?.role).toBe('user');
      expect((result.messages ?? [])[0]?.content).toBe('Ciao!');
      expect((result.messages ?? [])[1]?.role).toBe('assistant');
      expect(result.systemPrompt).toBe('Test Conversation');
    });

    it('dovrebbe gestire HTML con formattazione', () => {
      const htmlContent = `<!DOCTYPE html>
<html>
<body>
  <div class="message user">
    <div class="role">👤 Utente</div>
    <div class="content"><p>Testo con <strong>grassetto</strong> e <em>corsivo</em></p></div>
  </div>
  <div class="message assistant">
    <div class="role">🤖 Assistente</div>
    <div class="content"><p>Ecco del codice: <pre><code>console.log("hello");</code></pre></p></div>
  </div>
</body>
</html>`;

      const result = importFromString(htmlContent, 'HTML');

      expect((result.messages ?? [])[0]?.content).toBe('Testo con **grassetto** e *corsivo*');
      expect((result.messages ?? [])[1]?.content).toContain('```\nconsole.log("hello");\n```');
    });

    it('dovrebbe lanciare un errore per formati non supportati', () => {
      expect(() => importFromString('content', 'PDF' as ExportFormat)).toThrow(ExportError);
    });

    it("dovrebbe gestire errori durante l'importazione", () => {
      expect(() => importFromString('invalid', 'JSON')).toThrow(ExportError);
      expect(() => importFromString('invalid', 'YAML')).toThrow(ExportError);
    });
  });

  describe('importFromBuffer', () => {
    it('dovrebbe convertire correttamente un buffer in stringa', () => {
      const jsonContent = '{"messages":[{"role":"user","content":"Test","timestamp":1617876123000}]}';
      const buffer = Buffer.from(jsonContent);

      const result = importFromBuffer(buffer, 'JSON');

      expect(result).toHaveProperty('messages');
      expect((result.messages ?? [])[0]?.content).toBe('Test');
    });

    it("dovrebbe usare l'encoding specificato", () => {
      const jsonContent = '{"messages":[{"role":"user","content":"Test","timestamp":1617876123000}]}';
      const buffer = Buffer.from(jsonContent);

      importFromBuffer(buffer, 'JSON', { encoding: 'utf8' });

      // Verifica che sia stato chiamato con l'encoding corretto
      expect(serializers.fromJSON).toHaveBeenCalled();
    });
  });
});

describe('validateExportableSession', () => {
  it('dovrebbe validare una sessione corretta', () => {
    const validSession = {
      messages: [
        mockMessage('user', 'Ciao'),
        mockMessage('assistant', 'Come posso aiutarti?'),
      ],
      settings: { model: 'gpt-4' },
      contextFiles: [{ name: 'test.txt', content: 'Contenuto di test' }],
    };

    expect(validateExportableSession(validSession)).toBe(true);
  });

  it('dovrebbe validare una sessione minimale con solo messaggi', () => {
    const validSession = {
      messages: [mockMessage('user', 'Ciao')],
    };

    expect(validateExportableSession(validSession)).toBe(true);
  });

  it('dovrebbe rifiutare sessioni null o undefined', () => {
    expect(validateExportableSession(null)).toBe(false);
    expect(validateExportableSession(undefined)).toBe(false);
  });

  it('dovrebbe rifiutare sessioni non oggetto', () => {
    expect(validateExportableSession('stringa')).toBe(false);
    expect(validateExportableSession(123)).toBe(false);
    expect(validateExportableSession([])).toBe(false);
  });

  it('dovrebbe rifiutare sessioni senza array di messaggi', () => {
    const invalidSession = { settings: {} };
    expect(validateExportableSession(invalidSession)).toBe(false);
  });

  it('dovrebbe rifiutare sessioni con messaggi non array', () => {
    const invalidSession = { messages: 'non un array' };
    expect(validateExportableSession(invalidSession)).toBe(false);
  });

  it('dovrebbe rifiutare messaggi non oggetto', () => {
    const invalidSession = { messages: ['non un oggetto'] };
    expect(validateExportableSession(invalidSession)).toBe(false);
  });

  it('dovrebbe rifiutare messaggi senza ruolo', () => {
    const invalidSession = {
      messages: [{ content: 'Solo contenuto', timestamp: Date.now() }],
    };
    expect(validateExportableSession(invalidSession)).toBe(false);
  });

  it('dovrebbe rifiutare messaggi con ruolo non stringa', () => {
    const invalidSession = {
      messages: [createChatMessage({role: 123, content: 'Contenuto', timestamp: Date.now()})],
    };
    expect(validateExportableSession(invalidSession)).toBe(false);
  });

  it('dovrebbe rifiutare messaggi con ruolo vuoto', () => {
    const invalidSession = {
      messages: [createChatMessage({role: '', content: 'Contenuto', timestamp: Date.now()})],
    };
    expect(validateExportableSession(invalidSession)).toBe(false);
  });

  it('dovrebbe rifiutare messaggi con contenuto non stringa', () => {
    const invalidSession = {
      messages: [createChatMessage({role: 'user', content: 123, timestamp: Date.now()})],
    };
    expect(validateExportableSession(invalidSession)).toBe(false);
  });

  it('dovrebbe rifiutare settings non oggetto', () => {
    const invalidSession = {
      messages: [mockMessage('user', 'Contenuto')],
      settings: 'non oggetto',
    };
    expect(validateExportableSession(invalidSession)).toBe(false);
  });

  it('dovrebbe rifiutare contextFiles non array', () => {
    const invalidSession = {
      messages: [mockMessage('user', 'Contenuto')],
      contextFiles: 'non array',
    };
    expect(validateExportableSession(invalidSession)).toBe(false);
  });

  it('dovrebbe rifiutare file di contesto non validi', () => {
    const invalidSession = {
      messages: [mockMessage('user', 'Contenuto')],
      contextFiles: [
        { content: 'Manca il nome' },
        { name: '', content: 'Nome vuoto' },
        { name: 'test.txt', content: 123 }, // contenuto non stringa
      ],
    };
    expect(validateExportableSession(invalidSession)).toBe(false);
  });
});

describe('importFromString con validazione', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dovrebbe importare e validare JSON valido', () => {
    const validJson = JSON.stringify({
      messages: [mockMessage('user', 'Messaggio')],
    });

    const result = importFromString(validJson, 'JSON');
    expect(result).toHaveProperty('messages');
    expect((result.messages ?? []).length).toBe(1);
  });

  it('dovrebbe lanciare errore su JSON invalido con validation=true', () => {
    const invalidJson = JSON.stringify({
      messages: [createChatMessage({role: 123, content: null, timestamp: Date.now()})],
    });

    expect(() => {
      importFromString(invalidJson, 'JSON', { validate: true });
    }).toThrow(ExportError);
  });

  it('non dovrebbe validare con validation=false', () => {
    // Questo JSON è valido come struttura ma invalido secondo le nostre regole
    const invalidJson = JSON.stringify({
      messages: [createChatMessage({role: 123, content: 'test', timestamp: Date.now()})],
    });

    // Passerà perché stiamo disattivando la validazione
    const result = importFromString(invalidJson, 'JSON', { validate: false });
    expect(result).toHaveProperty('messages');
  });

  it('dovrebbe usare validate=true come default', () => {
    vi.spyOn(console, 'debug').mockImplementation();

    const invalidJson = JSON.stringify({
      messages: [createChatMessage({role: '', content: 123, timestamp: Date.now()})],
    });

    expect(() => {
      importFromString(invalidJson, 'JSON');
    }).toThrow(ExportError);
  });
});
