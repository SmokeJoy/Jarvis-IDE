import { render, screen, waitFor } from '@testing-library/react';
import { PromptHistory } from '../PromptHistory';
import { useExtensionMessage } from '../../../../hooks/useExtensionMessage';
import { PromptHistoryMessageType } from '../../../../../webview/messages/prompt-history-message';
import { isPromptHistoryLoadedMessage } from '../../../../../webview/messages/prompt-history-message-guards';

jest.mock('../../../../hooks/useExtensionMessage');

const mockPostMessage = jest.fn();
const mockOnMessage = jest.fn();

describe('PromptHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useExtensionMessage as jest.Mock).mockReturnValue({
      postMessage: mockPostMessage,
      onMessage: (callback: any) => {
        mockOnMessage(callback);
        return () => {};
      }
    });
  });

  it('dovrebbe richiedere la cronologia al mount', () => {
    render(<PromptHistory />);
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: PromptHistoryMessageType.REQUEST_HISTORY
    });
  });

  it('dovrebbe gestire il caricamento della cronologia', async () => {
    const testHistory = [
      { id: '1', prompt: 'Test prompt', timestamp: Date.now() }
    ];
    
    render(<PromptHistory />);
    
    mockOnMessage({
      type: PromptHistoryMessageType.HISTORY_LOADED,
      payload: { history: testHistory }
    });

    await waitFor(() => {
      expect(screen.getByText('Test prompt')).toBeInTheDocument();
    });
  });

  it('dovrebbe gestire gli errori di caricamento', async () => {
    render(<PromptHistory />);
    
    mockOnMessage({
      type: PromptHistoryMessageType.HISTORY_ERROR,
      payload: { error: 'Errore di rete', errorCode: 500 }
    });

    await waitFor(() => {
      expect(screen.getByText(/Errore cronologia/)).toBeInTheDocument();
    });
  });

  it('dovrebbe validare i messaggi con le guardie type-safe', () => {
    const validMessage = {
      type: PromptHistoryMessageType.HISTORY_LOADED,
      payload: { history: [] }
    };
    
    expect(isPromptHistoryLoadedMessage(validMessage)).toBe(true);
  });
});