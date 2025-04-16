/// <reference types="vitest" />
// Import Vitest APIs since globals are not enabled
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PromptHistory } from '../PromptHistory';
import { useExtensionMessage } from '../../../hooks/useExtensionMessage';
import { PromptHistoryMessageType } from '../../../../../webview/messages/prompt-history-message';
import { isPromptHistoryLoadedMessage } from '../../../../../webview/messages/prompt-history-message-guards';

vi.mock('../../../hooks/useExtensionMessage', () => ({
  postMessage: mockPostMessage,
  onMessage: (callback: any) => {
    mockOnMessage(callback);
    return () => {};
  },
}));

const mockPostMessage = vi.fn();
const mockOnMessage = vi.fn();

describe('PromptHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useExtensionMessage).mockReturnValue({
      postMessage: mockPostMessage,
      onMessage: (callback: any) => {
        mockOnMessage(callback);
        return () => {};
      },
    });
  });

  it('dovrebbe richiedere la cronologia al mount', () => {
    render(<PromptHistory />);
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: PromptHistoryMessageType.REQUEST_HISTORY,
    });
  });

  it('dovrebbe gestire il caricamento della cronologia', async () => {
    const testHistory = [{ id: '1', prompt: 'Test prompt', timestamp: Date.now() }];

    render(<PromptHistory />);

    const messageCallback = mockOnMessage.mock.calls[0][0];
    messageCallback({
      type: PromptHistoryMessageType.HISTORY_LOADED,
      payload: testHistory,
    });

    await waitFor(() => {
      expect(screen.getByText(testHistory[0].prompt)).toBeInTheDocument();
    });
  });

  it('dovrebbe gestire gli errori di caricamento', async () => {
    render(<PromptHistory />);

    const messageCallback = mockOnMessage.mock.calls[0][0];
    messageCallback({
      type: PromptHistoryMessageType.HISTORY_ERROR,
      payload: { error: 'Errore di rete' },
    });

    await waitFor(() => {
      expect(screen.getByText(/Errore cronologia: Errore di rete/)).toBeInTheDocument();
    });
  });

  it('dovrebbe validare i messaggi con le guardie type-safe', () => {
    const validMessage = {
      type: PromptHistoryMessageType.HISTORY_LOADED,
      payload: [],
    };
    const invalidMessage = {
      type: 'someOtherType',
      payload: {},
    };

    expect(isPromptHistoryLoadedMessage(validMessage)).toBe(true);
    expect(isPromptHistoryLoadedMessage(invalidMessage)).toBe(false);
  });
});
