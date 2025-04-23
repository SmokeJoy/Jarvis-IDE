import { z } from 'zod';
import React from 'react';
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Webview } from './webview';
import { ApiConfiguration } from '../shared/types/global';
import { ChatMessage } from '../shared/types';
import { ExtensionMessage } from '../shared/ExtensionMessage';
import { Webview } from './webview';
import { createChatMessage as createChatMessage } from "../shared/types/chat.types";
import { VSCodeAPI } from '../../src/types/vscode-webview.d';
import { Message } from '../types/messages';

vi.mock('@vscode/webview-ui-toolkit/react');

// Mock delle funzioni necessarie
const mockPostMessage = vi.fn();
const vscodeApi = {
  postMessage: mockPostMessage,
  getState: vi.fn(),
  setState: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (global as any).acquireVsCodeApi = vi.fn(() => vscodeApi);
  // Reset window.vscode before each test
  window.vscode = {
    postMessage: vi.fn(),
    getState: vi.fn(),
    setState: vi.fn(),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

const mockConfig: ApiConfiguration = {
  apiKey: 'test-key',
  temperature: 0.7,
};

describe('Webview', () => {
  test('should render initial state', () => {
    render(<Webview config={mockConfig} />);
    expect(screen.getByText('Jarvis IDE')).toBeInTheDocument();
  });

  test('should handle message input', () => {
    render(<Webview config={mockConfig} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test message' } });
    expect(input).toHaveValue('test message');
  });

  test('should handle send button click', async () => {
    render(<Webview config={mockConfig} />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'test message' } });
      fireEvent.click(button);
    });

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Sending...');
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'chat',
        messages: expect.any(Array),
      })
    );
  });

  test('should display response', async () => {
    render(<Webview config={mockConfig} />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'test message' } });
      fireEvent.click(button);

      // Simula la risposta
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'response',
            response: createChatMessage({role: 'assistant', content: 'test response', timestamp: Date.now()}),
          },
        })
      );
    });

    expect(screen.getByText('test response')).toBeInTheDocument();
  });

  test('should toggle MCP view', async () => {
    render(<Webview config={mockConfig} />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'mcpConnected',
          },
        })
      );
    });

    expect(screen.getByText('MCP View')).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'mcpDisconnected',
          },
        })
      );
    });

    expect(screen.queryByText('MCP View')).not.toBeInTheDocument();
  });

  test('handles message events correctly', async () => {
    render(<Webview config={mockConfig} />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'response',
            response: createChatMessage({role: 'assistant', content: 'test response', timestamp: Date.now()}),
          },
        })
      );
    });

    expect(screen.getByText('test response')).toBeInTheDocument();
  });

  test('handles error events correctly', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Webview config={mockConfig} />);

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'error',
          error: 'test error',
        },
      })
    );

    expect(consoleSpy).toHaveBeenCalledWith('test error');
    consoleSpy.mockRestore();
  });

  test('handles MCP connection events correctly', async () => {
    render(<Webview config={mockConfig} />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'mcpConnected',
          },
        })
      );
    });

    expect(screen.getByText('MCP View')).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'mcpDisconnected',
          },
        })
      );
    });

    expect(screen.queryByText('MCP View')).not.toBeInTheDocument();
  });

  test('handles Enter key correctly', async () => {
    render(<Webview config={mockConfig} />);
    const input = screen.getByPlaceholderText('Type your message...');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'test message' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 });
    });

    expect(input).toHaveValue('');
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'chat',
        messages: expect.any(Array),
      })
    );
  });

  test('handles Shift+Enter correctly', async () => {
    render(<Webview config={mockConfig} />);
    const input = screen.getByPlaceholderText('Type your message...');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'test message' } });
      fireEvent.keyPress(input, {
        key: 'Enter',
        code: 13,
        charCode: 13,
        shiftKey: true,
      });
    });

    expect(input).toHaveValue('test message');
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  // import './index'; // Temporaneamente commentato per evitare errore TS2307
});

describe('WebView', () => {
  test('should render webview', () => {
    const settings = {
      provider: 'openai',
      apiKey: 'test-key',
      temperature: 0.7,
    };

    render(<Webview settings={settings} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('should update settings', () => {
    const settings = {
      provider: 'openai',
      apiKey: 'test-key',
      temperature: 0.7,
    };

    render(<Webview settings={settings} />);
    const checkbox = screen.getByRole('checkbox', { name: 'Use Documentation' });
    checkbox.click();
    expect(window.vscode.postMessage).toHaveBeenCalledWith({
      type: 'settingUpdated',
      key: 'use_docs',
      value: true,
    });
  });
});
