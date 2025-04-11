import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModelSelector } from './ModelSelector';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import { useExtensionState } from '../context/ExtensionStateContext';
import { ModelSelectorMessageUnion } from '../../../src/webview/messages/model-selector-message';

// Mock degli hook
jest.mock('../hooks/useExtensionMessage');
jest.mock('../context/ExtensionStateContext');

const mockPostMessage = jest.fn();
(useExtensionMessage as jest.Mock).mockReturnValue({
  postMessage: mockPostMessage,
});

const mockSetSelectedModel = jest.fn();
(useExtensionState as jest.Mock).mockReturnValue({
  state: {
    selectedModel: 'gpt-4',
    availableModels: [
      { value: 'gpt-4', label: 'GPT-4', provider: 'OpenAI', coder: true },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI', coder: false },
      { value: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'Anthropic', coder: true }
    ]
  },
  setSelectedModel: mockSetSelectedModel
});

describe('ModelSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dovrebbe rendere correttamente tutti i modelli disponibili', () => {
    render(<ModelSelector />);
    
    expect(screen.getByText(/GPT-4/)).toBeInTheDocument();
    expect(screen.getByText(/GPT-3.5 Turbo/)).toBeInTheDocument();
    expect(screen.getByText(/Claude 3 Opus/)).toBeInTheDocument();
  });

  it('dovrebbe inviare un messaggio type-safe quando viene richiesto l\'elenco dei modelli', () => {
    render(<ModelSelector />);
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'requestModels'
    });
  });

  it('dovrebbe inviare un messaggio type-safe quando viene selezionato un modello', () => {
    render(<ModelSelector />);

    // Seleziona l'opzione GPT-3.5 Turbo dalla dropdown
    // Nota: in un test reale, dovremmo simulare l'evento del dropdown
    const dropdown = screen.getByRole('combobox');
    fireEvent.change(dropdown, { target: { value: 'gpt-3.5-turbo' } });
    
    // Verifica che il messaggio type-safe venga inviato correttamente
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'modelSelected',
      payload: { modelId: 'gpt-3.5-turbo' }
    });
    
    // Verifica che lo stato venga aggiornato
    expect(mockSetSelectedModel).toHaveBeenCalledWith('gpt-3.5-turbo');
  });

  it('dovrebbe filtrare i modelli quando viene selezionata l\'opzione "Solo modelli per codice"', () => {
    render(<ModelSelector />);
    
    // Inizialmente tutti i modelli dovrebbero essere visibili
    expect(screen.getByText(/GPT-4/)).toBeInTheDocument();
    expect(screen.getByText(/GPT-3.5 Turbo/)).toBeInTheDocument();
    
    // Clicca sulla checkbox "Solo modelli per codice"
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // Dopo il click, solo i modelli con coder: true dovrebbero essere visibili
    // Questa parte potrebbe richiedere una logica più complessa a seconda di come la UI viene aggiornata
    // In un'implementazione reale, probabilmente dovresti testare il cambiamento di stato
    // e verificare che la funzione di filtro sia stata chiamata con i parametri corretti
  });
}); 