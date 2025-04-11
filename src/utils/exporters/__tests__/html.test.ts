/**
 * Test per il modulo di esportazione HTML
 * @jest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toHTML } from '../html.js';
import type { ExportableSession } from '../types.js';
import { Logger } from '../../logger.js';
import { toMarkdown } from '../markdown.js';

// Mock delle dipendenze
vi.mock('../../logger', () => ({
  Logger: {
    getInstance: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

vi.mock('../markdown', () => ({
  toMarkdown: vi.fn().mockReturnValue('# Markdown Content\n\nContenuto di test')
}));

describe('HTML Exporter', () => {
  const mockSession: ExportableSession = {
    messages: [
      { role: 'system', content: 'Sei un assistente AI' },
      { role: 'user', content: 'Ciao, come stai?' },
      { role: 'assistant', content: 'Sto bene, grazie!\n\n```python\nprint("Hello")\n```' },
      { role: 'user', content: 'Testo con <tag> e "virgolette"' },
    ],
    settings: {
      temperature: 0.7,
      model: 'gpt-4',
    },
    systemPrompt: 'Sei un assistente AI disponibile per aiutare con vari compiti.',
    contextFiles: ['document1.md', 'code.js'],
    modelId: 'gpt-4',
    timestamp: 1617876123456
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('dovrebbe generare un documento HTML completo', () => {
    const result = toHTML(mockSession);
    
    // Verifica la struttura HTML di base
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html lang="it">');
    expect(result).toContain('<meta charset="UTF-8">');
    expect(result).toContain('<title>Conversazione Esportata</title>');
    expect(result).toContain('<style>');
    expect(result).toContain('</body>');
    expect(result).toContain('</html>');
    
    // Verifica il contenuto
    expect(result).toContain('<h1>Conversazione Esportata</h1>');
    expect(result).toContain('<strong>Modello:</strong> gpt-4');
    
    // Verifica le intestazioni delle sezioni
    expect(result).toContain('<h2>📝 Prompt di Sistema</h2>');
    expect(result).toContain('<h2>⚙️ Impostazioni</h2>');
    expect(result).toContain('<h2>📄 File di Contesto</h2>');
    expect(result).toContain('<h2>💬 Conversazione</h2>');
    
    // Verifica la formattazione dei messaggi
    expect(result).toContain('<div class="message system">');
    expect(result).toContain('<div class="message user">');
    expect(result).toContain('<div class="message assistant">');
    
    // Verifica la sanitizzazione HTML
    expect(result).toContain('Testo con &lt;tag&gt; e &quot;virgolette&quot;');
    
    // Verifica che il Markdown nei messaggi venga convertito
    expect(result).toContain('<pre><code class="language-python">');
    expect(result).toContain('print("Hello")');
    
    // Verifica la tabella delle impostazioni
    expect(result).toContain('<table>');
    expect(result).toContain('<tr>');
    expect(result).toContain('<th>Parametro</th>');
    expect(result).toContain('<td>temperature</td>');
    expect(result).toContain('<td>0.7</td>');
    
    // Verifica la lista dei file di contesto
    expect(result).toContain('<ul class="context-files">');
    expect(result).toContain('<li><code>document1.md</code></li>');
    expect(result).toContain('<li><code>code.js</code></li>');
  });
  
  it('dovrebbe rispettare l\'opzione convertMarkdown', () => {
    // Con convertMarkdown = true (default)
    toHTML(mockSession, { convertMarkdown: true });
    expect(toMarkdown).toHaveBeenCalled();
    
    vi.clearAllMocks();
    
    // Con convertMarkdown = false
    const result = toHTML(mockSession, { convertMarkdown: false });
    expect(toMarkdown).not.toHaveBeenCalled();
    expect(result).toContain('<div class="message system">');
  });
  
  it('dovrebbe rispettare l\'opzione includeStyles', () => {
    // Con includeStyles = false
    const result = toHTML(mockSession, { includeStyles: false });
    expect(result).not.toContain('<style>');
  });
  
  it('dovrebbe rispettare l\'opzione includeMetadata', () => {
    // Con includeMetadata = false
    const result = toHTML(mockSession, { includeMetadata: false });
    expect(result).not.toContain('<div class="metadata">');
  });
  
  it('dovrebbe rispettare l\'opzione title', () => {
    const customTitle = 'Titolo Personalizzato';
    const result = toHTML(mockSession, { title: customTitle });
    expect(result).toContain(`<title>${customTitle}</title>`);
    expect(result).toContain(`<h1>${customTitle}</h1>`);
  });
  
  it('dovrebbe gestire una sessione minima', () => {
    const minimalSession: ExportableSession = {
      messages: [{ role: 'user', content: 'Test' }]
    };
    
    const result = toHTML(minimalSession);
    
    // Verifica che il documento sia comunque completo
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<h1>Conversazione Esportata</h1>');
    
    // Verifica che le sezioni opzionali non siano presenti
    expect(result).not.toContain('<h2>⚙️ Impostazioni</h2>');
    expect(result).not.toContain('<h2>📄 File di Contesto</h2>');
    expect(result).not.toContain('<h2>📝 Prompt di Sistema</h2>');
    
    // Verifica che il messaggio sia presente
    expect(result).toContain('<div class="message user">');
    expect(result).toContain('Test');
  });
  
  it('dovrebbe gestire errori durante la conversione', () => {
    // Mock di una sessione che causa errore
    const errorSession = {
      get messages() {
        throw new Error('Errore di test');
      }
    } as unknown as ExportableSession;
    
    // La funzione dovrebbe lanciare un errore
    expect(() => toHTML(errorSession)).toThrow();
    
    // Verifica che l'errore sia stato loggato
    const loggerInstance = Logger.getInstance('htmlExporter');
    expect(loggerInstance.error).toHaveBeenCalled();
  });
}); 