import { render, screen, fireEvent } from '@testing-library/react';
import { ModelSelector } from '../ModelSelector';
import { useExtensionMessage } from '../../../../hooks/useExtensionMessage';
import { ModelSelectorMessageType, ModelSelectorMessageUnion } from '../../../../../webview/messages/model-selector-message';
import { isModelListUpdatedMessage } from '../../../../../webview/messages/model-selector-message-guards';

jest.mock('../../../../hooks/useExtensionMessage');

const mockPostMessage = jest.fn();
(useExtensionMessage as jest.Mock).mockReturnValue({
  postMessage: mockPostMessage,
});

describe('ModelSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('invia messaggio modelSelected alla selezione', () => {
    render(<ModelSelector />);
    fireEvent.click(screen.getByTestId('model-1'));
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: ModelSelectorMessageType.MODEL_SELECTED,
      payload: { modelId: 'model-1' }
    });
  });

  it('richiede lista modelli al mount', () => {
    render(<ModelSelector />);
    expect(mockPostMessage).toHaveBeenCalledWith({ type: ModelSelectorMessageType.REQUEST_MODELS });
  });

  it('gestisce aggiornamento lista modelli', () => {
    const testModels = [{ id: 'model-1', name: 'Test Model' }];
    render(<ModelSelector />);
    
    // Simula ricezione messaggio dall'estensione
    const messageHandler = (useExtensionMessage as jest.Mock).mock.calls[0][0];
    messageHandler({
      type: ModelSelectorMessageType.MODEL_LIST_UPDATED,
      payload: testModels
    });

    expect(isModelListUpdatedMessage({
      type: ModelSelectorMessageType.MODEL_LIST_UPDATED,
      payload: testModels
    })).toBe(true);
    expect(screen.getByText('Test Model')).toBeInTheDocument();
  });

  it('gestisce errori nel caricamento modelli', () => {
    render(<ModelSelector />);
    
    const messageHandler = (useExtensionMessage as jest.Mock).mock.calls[0][0];
    messageHandler({
      type: ModelSelectorMessageType.MODEL_LOAD_ERROR,
      payload: { error: 'Errore di connessione' }
    });

    expect(screen.getByText(/Errore di caricamento modelli/)).toBeInTheDocument();
  });

  it('valida i modelli con SecurityManager prima della selezione', () => {
    render(<ModelSelector />);
    
    const testModels = [{ 
      id: 'model-1', 
      name: 'Test Model',
      securityLevel: 'trusted',
      provider: 'approved-vendor'
    }];
    
    const messageHandler = (useExtensionMessage as jest.Mock).mock.calls[0][0];
    messageHandler({
      type: ModelSelectorMessageType.MODEL_LIST_UPDATED,
      payload: testModels
    });

    fireEvent.click(screen.getByTestId('model-1'));
    
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ModelSelectorMessageType.MODEL_SELECTED,
        payload: expect.objectContaining({
          securityCheck: true
        })
      })
    );
  });

  it('implementa fallback automatico su modelli compatibili', () => {
    const testModels = [
      { id: 'model-1', name: 'Primary Model', status: 'unavailable' },
      { id: 'model-2', name: 'Fallback Model', status: 'active' }
    ];
    
    render(<ModelSelector />);
    
    const messageHandler = (useExtensionMessage as jest.Mock).mock.calls[0][0];
    messageHandler({
      type: ModelSelectorMessageType.MODEL_LIST_UPDATED,
      payload: testModels
    });

    fireEvent.click(screen.getByTestId('model-1'));
    
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ModelSelectorMessageType.MODEL_SELECTED,
        payload: { modelId: 'model-2' }
      })
    );
  });
});