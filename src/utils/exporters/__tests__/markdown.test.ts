import { vi } from 'vitest';
/**
 * Test per il modulo di esportazione Markdown
 * @jest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toMarkdown } from '../markdown';
import { ExportableSession } from '../types';
import { Logger } from '../../logger';
import { mockMessage } from '../../../../test/utils/factories';

// Mock del logger
vi.mock('../../logger', () => ({
  Logger: {
    getInstance: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

describe('toMarkdown', () => {
  const mockSession: ExportableSession = {
    messages: [
      mockMessage('system', 'Sei un assistente AI'),
      mockMessage('user', 'Ciao, come stai?'),
      mockMessage('assistant', 'Salve! Sto bene, grazie. Come posso aiutarti oggi?'),
      mockMessage(
        'user',
        'Potresti mostrarmi del codice?\n```javascript\nconst x = 10;\nconsole.log(x);\n```'
      ),
      mockMessage(
        'assistant',
        'Ecco un esempio:\n```python\ndef hello():\n    print("Hello world")\n```'
      ),
      mockMessage('function', "Risultato dell'esecuzione", { name: 'execute_code' }),
    ],
    settings: {
      temperature: 0.7,
      model: 'gpt-4',
      maxTokens: 2000,
    },
    systemPrompt: 'Sei un assistente AI disponibile per aiutare con vari compiti.',
    contextFiles: ['document1.md', 'code.js'],
    modelId: 'gpt-4',
    timestamp: 1617876123456,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dovrebbe convertire correttamente una sessione completa in Markdown', () => {
    const result = toMarkdown(mockSession);

    // Controlla l'intestazione
    expect(result).toContain('# Conversazione Esportata');
    expect(result).toContain('**Modello**: gpt-4');

    // Controlla il prompt di sistema
    expect(result).toContain('## 📝 Prompt di Sistema');
    expect(result).toContain('Sei un assistente AI disponibile per aiutare con vari compiti.');

    // Controlla la sezione delle impostazioni
    expect(result).toContain('## ⚙️ Impostazioni');
    expect(result).toContain('| temperature | 0.7 |');
    expect(result).toContain('| model | gpt-4 |');

    // Controlla i file di contesto
    expect(result).toContain('## 📄 File di Contesto');
    expect(result).toContain('- `document1.md`');
    expect(result).toContain('- `code.js`');

    // Controlla la formattazione dei messaggi
    expect(result).toContain('### 🔧 Sistema');
    expect(result).toContain('### 👤 Utente');
    expect(result).toContain('### 🤖 Assistente');
    expect(result).toContain('### ⚙️ Funzione');

    // Verifica che i blocchi di codice vengano gestiti correttamente
    expect(result).toContain('~~~python');
    expect(result).toContain('def hello():');
  });

  it('dovrebbe gestire una sessione minima senza errori', () => {
    const minimalSession: ExportableSession = {
      messages: [mockMessage('user', 'Test')],
    };

    const result = toMarkdown(minimalSession);

    // Verifica che ci sia almeno l'intestazione
    expect(result).toContain('# Conversazione Esportata');
    // E il messaggio utente
    expect(result).toContain('### 👤 Utente');
    expect(result).toContain('Test');

    // Verifica che le sezioni opzionali non siano presenti
    expect(result).not.toContain('## ⚙️ Impostazioni');
    expect(result).not.toContain('## 📄 File di Contesto');
    expect(result).not.toContain('## 📝 Prompt di Sistema');
  });

  it('dovrebbe gestire correttamente i contenuti Markdown nei messaggi', () => {
    const markdownSession: ExportableSession = {
      messages: [
        mockMessage(
          'user',
          '# Titolo\n**Grassetto** e *corsivo*\n- Lista 1\n- Lista 2\n\n```js\nconst x = 1;\n```'
        ),
      ],
    };

    const result = toMarkdown(markdownSession);

    // Verifica che il Markdown nei messaggi sia preservato
    expect(result).toContain('# Titolo');
    expect(result).toContain('**Grassetto** e *corsivo*');
    expect(result).toContain('- Lista 1');
    expect(result).toContain('- Lista 2');
    // I blocchi di codice vengono preservati ma trasformati in ~~~
    expect(result).toContain('~~~js');
    expect(result).toContain('const x = 1;');
  });

  it('dovrebbe gestire errori durante la conversione', () => {
    // Mock dell'errore
    const mockError = new Error('Errore di test');

    // Crea una sessione problematica che causerà un errore
    const problemSession = {
      get messages() {
        throw mockError;
      },
    } as unknown as ExportableSession;

    // La funzione dovrebbe lanciare un errore
    expect(() => toMarkdown(problemSession)).toThrow();

    // Verifica che l'errore sia stato loggato
    const loggerInstance = Logger.getInstance('markdownExporter');
    expect(loggerInstance.error).toHaveBeenCalled();
  });
});
