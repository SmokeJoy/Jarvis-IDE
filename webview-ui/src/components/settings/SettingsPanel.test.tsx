import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPanel } from './SettingsPanel';
import { useExtensionMessage } from '../../hooks/useExtensionMessage';
import { SettingsMessageType } from '../../types/settings-message';

// Mock del hook useExtensionMessage
jest.mock('../../hooks/useExtensionMessage', () => ({
  useExtensionMessage: jest.fn()
}));

// Mock del contesto ExtensionState
jest.mock('../../context/ExtensionStateContext', () => ({
  useExtensionState: jest.fn().mockReturnValue({
    darkMode: true,
    setDarkMode: jest.fn()
  })
}));

describe('SettingsPanel', () => {
  // Mock per postMessage
  const mockPostMessage = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurazione del mock per useExtensionMessage
    (useExtensionMessage as jest.Mock).mockReturnValue({
      postMessage: mockPostMessage
    });
    
    // Mock per MessageEvent
    Object.defineProperty(window, 'addEventListener', {
      value: jest.fn().mockImplementation((event, cb) => {
        if (event === 'message') {
          // Simulazione di un messaggio di impostazioni caricate
          cb({
            data: {
              type: SettingsMessageType.SETTINGS_LOADED,
              settings: {
                use_docs: true,
                coder_mode: true,
                contextPrompt: 'Test prompt',
                selectedModel: 'gpt-4',
                availableModels: ['gpt-3.5-turbo', 'gpt-4']
              }
            }
          });
        }
      }),
      configurable: true
    });
    
    Object.defineProperty(window, 'removeEventListener', {
      value: jest.fn(),
      configurable: true
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('dovrebbe renderizzare correttamente', () => {
    render(<SettingsPanel />);
    
    expect(screen.getByText('Impostazioni Jarvis IDE')).toBeInTheDocument();
    expect(screen.getByText('Modalità di funzionamento')).toBeInTheDocument();
    expect(screen.getByText('Modalità Sviluppatore')).toBeInTheDocument();
    expect(screen.getByText('Usa Documentazione')).toBeInTheDocument();
    expect(screen.getByText('Modello AI')).toBeInTheDocument();
    expect(screen.getByText('Prompt Contestuale')).toBeInTheDocument();
    expect(screen.getByText('System Prompt')).toBeInTheDocument();
  });
  
  it('dovrebbe richiedere le impostazioni all\'avvio', () => {
    render(<SettingsPanel />);
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: SettingsMessageType.GET_SETTINGS
    });
  });
  
  it('dovrebbe aggiornare un\'impostazione quando cambia', () => {
    render(<SettingsPanel />);
    
    // Mock del checkbox per "Usa Documentazione"
    const checkbox = screen.getByLabelText('Usa Documentazione', { exact: false }) as HTMLInputElement;
    
    // Simula il cambiamento del checkbox
    fireEvent.change(checkbox, { target: { checked: false } });
    
    // Verifica che postMessage sia stato chiamato con il messaggio corretto
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: SettingsMessageType.UPDATE_SETTING,
      key: 'use_docs',
      value: false
    });
  });
  
  it('dovrebbe salvare tutte le impostazioni', () => {
    render(<SettingsPanel />);
    
    // Trova il pulsante "Salva Tutte le Impostazioni"
    const saveButton = screen.getByText('Salva Tutte le Impostazioni');
    
    // Simula il click sul pulsante
    fireEvent.click(saveButton);
    
    // Verifica che postMessage sia stato chiamato con il messaggio corretto
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: SettingsMessageType.SAVE_ALL_SETTINGS,
      settings: expect.objectContaining({
        use_docs: expect.any(Boolean),
        coder_mode: expect.any(Boolean),
        contextPrompt: expect.any(String),
        selectedModel: expect.any(String)
      })
    });
  });
  
  it('dovrebbe ripristinare le impostazioni predefinite', () => {
    render(<SettingsPanel />);
    
    // Trova il pulsante "Ripristina Default"
    const resetButton = screen.getByText('Ripristina Default');
    
    // Simula il click sul pulsante
    fireEvent.click(resetButton);
    
    // Verifica che postMessage sia stato chiamato con il messaggio corretto
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: SettingsMessageType.RESET_ALL_SETTINGS
    });
  });
  
  it('dovrebbe salvare il prompt contestuale', () => {
    render(<SettingsPanel />);
    
    // Trova il textarea per il prompt contestuale
    const textarea = screen.getByPlaceholderText('Inserisci informazioni contestuali', { exact: false });
    
    // Simula l'input nel textarea
    fireEvent.change(textarea, { target: { value: 'Nuovo prompt contestuale' } });
    
    // Trova il pulsante "Salva Prompt Contestuale"
    const savePromptButton = screen.getByText('Salva Prompt Contestuale');
    
    // Simula il click sul pulsante
    fireEvent.click(savePromptButton);
    
    // Verifica che postMessage sia stato chiamato con il messaggio corretto
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: SettingsMessageType.UPDATE_SETTING,
      key: 'contextPrompt',
      value: 'Nuovo prompt contestuale'
    });
  });
}); 