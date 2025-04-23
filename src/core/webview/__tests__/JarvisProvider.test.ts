import { vi } from 'vitest';
import { z } from 'zod';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as vscode from 'vscode';
import { JarvisProvider } from '../JarvisProvider';
import {
  ExtensionMessageType,
  ExtensionMessage,
  isExtensionMessage,
} from '@/shared/types/extensionMessageUnion';
import {
  mockModelInfo,
  mockExtensionSettings,
  mockChatMessages,
  mockMessageCreator,
} from './testUtils';
import { MockedContext } from '../../../shared/types/test-utils.types';
import { WebviewMessage, WebviewMessageType } from '../../../shared/types/webview.types';

// Mock di vscode usando MockedContext
vi.mock('vscode', () => ({
  window: {
    createOutputChannel: vi.fn().mockReturnValue({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    }),
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showInformationMessage: vi.fn(),
  },
  ExtensionContext: vi.fn().mockImplementation(
    (): MockedContext => ({
      subscriptions: [],
      workspaceState: {
        get: vi.fn(),
        update: vi.fn(),
      },
      globalState: {
        get: vi.fn(),
        update: vi.fn(),
      },
      secrets: {
        get: vi.fn(),
        store: vi.fn(),
        delete: vi.fn(),
      },
      extensionPath: '/mock/path',
      storagePath: '/mock/storage',
      logPath: '/mock/log',
      // Aggiungi altre proprietà richieste dall'interfaccia vscode.ExtensionContext se necessario
      // o usa un cast più specifico se MockedContext è sufficiente
    })
  ),
}));

describe('JarvisProvider', () => {
  let provider: JarvisProvider;
  let mockContext: vscode.ExtensionContext;
  let mockOutputChannel: vscode.OutputChannel;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = new vscode.ExtensionContext();
    mockOutputChannel = vscode.window.createOutputChannel('test');
    provider = new JarvisProvider(mockContext, mockOutputChannel);

    // Mocka la webview per i test
    provider.webview = {
      postMessage: vi.fn(),
      onDidReceiveMessage: vi.fn(),
      asWebviewUri: vi.fn(),
      cspSource: 'mock-csp-source',
    } as any; // Usa 'as any' solo per il mock
  });

  describe('Gestione messaggi con type guard', () => {
    test('dovrebbe usare isExtensionMessage per validare i messaggi', async () => {
      // Patch di isExtensionMessage per poter spyare sulla funzione
      const isExtensionMessageSpy = vi.spyOn({ isExtensionMessage }, 'isExtensionMessage');

      const message = mockMessageCreator.createLogMessage('info', 'Test log message', {
        test: true,
      });
      await provider.handleWebviewMessage(message);

      expect(isExtensionMessageSpy).toHaveBeenCalledWith(message, 'log.update');
    });

    test('dovrebbe rilevare messaggi non validi', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      // Creiamo un messaggio non valido intenzionalmente
      const invalidMessage = {
        type: 'unknown-type',
        payload: {},
        timestamp: Date.now(),
      };

      await provider.handleWebviewMessage(invalidMessage);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tipo di messaggio non supportato: unknown-type')
      );

      consoleWarnSpy.mockRestore();
    });

    test('dovrebbe creare un messaggio di errore quando si verifica un errore durante la gestione', async () => {
      // Creiamo uno spy sul metodo handleError
      const handleErrorSpy = vi.spyOn(provider as any, 'handleError');

      // Creiamo un messaggio che causerà un errore (per esempio, con un payload malformato)
      const malformedMessage = {
        type: 'log.update',
        timestamp: Date.now(),
        payload: null, // Payload malformato che causerà un errore
      };

      // Proviamo a gestire il messaggio malformato
      await provider.handleWebviewMessage(malformedMessage);

      // Verifichiamo che handleError sia stato chiamato con un messaggio di errore
      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({
            code: 'MESSAGE_HANDLER_ERROR',
          }),
        })
      );

      handleErrorSpy.mockRestore();
    });
  });

  describe('Dispatcher type-safe', () => {
    test('dovrebbe dispatchare correttamente i messaggi di log', async () => {
      const handleLogUpdateSpy = vi.spyOn(provider as any, 'handleLogUpdate');

      const message = mockMessageCreator.createLogMessage('info', 'Test log message', {
        test: true,
      });
      await provider.handleWebviewMessage(message);

      expect(handleLogUpdateSpy).toHaveBeenCalledWith(message);

      handleLogUpdateSpy.mockRestore();
    });

    test('dovrebbe dispatchare correttamente i messaggi di errore', async () => {
      const handleErrorSpy = vi.spyOn(provider as any, 'handleError');

      const error = new Error('Test error message');
      const message = mockMessageCreator.createError(error);
      await provider.handleWebviewMessage(message);

      expect(handleErrorSpy).toHaveBeenCalledWith(message);

      handleErrorSpy.mockRestore();
    });

    test('dovrebbe dispatchare correttamente i messaggi informativi', async () => {
      const handleInfoSpy = vi.spyOn(provider as any, 'handleInfo');

      const message = mockMessageCreator.createInfoMessage('Test info message', 'warning');
      await provider.handleWebviewMessage(message);

      expect(handleInfoSpy).toHaveBeenCalledWith(message);

      handleInfoSpy.mockRestore();
    });

    test('dovrebbe dispatchare correttamente gli aggiornamenti del modello', async () => {
      const handleModelUpdateSpy = vi.spyOn(provider as any, 'handleModelUpdate');

      const message = mockMessageCreator.createModelUpdate(
        mockModelInfo.id,
        mockModelInfo,
        'ready'
      );
      await provider.handleWebviewMessage(message);

      expect(handleModelUpdateSpy).toHaveBeenCalledWith(message);

      handleModelUpdateSpy.mockRestore();
    });

    test('dovrebbe dispatchare correttamente gli aggiornamenti delle impostazioni', async () => {
      const handleSettingsUpdateSpy = vi.spyOn(provider as any, 'handleSettingsUpdate');

      const message = mockMessageCreator.createSettingsUpdate(mockExtensionSettings);
      await provider.handleWebviewMessage(message);

      expect(handleSettingsUpdateSpy).toHaveBeenCalledWith(message);

      handleSettingsUpdateSpy.mockRestore();
    });

    test('dovrebbe dispatchare correttamente gli aggiornamenti della chat', async () => {
      const handleChatUpdateSpy = vi.spyOn(provider as any, 'handleChatUpdate');

      const message = mockMessageCreator.createChatUpdate(
        'test-thread',
        mockChatMessages,
        'active'
      );
      await provider.handleWebviewMessage(message);

      expect(handleChatUpdateSpy).toHaveBeenCalledWith(message);

      handleChatUpdateSpy.mockRestore();
    });
  });

  describe('Handler specifici', () => {
    test('handleLogUpdate dovrebbe loggare il messaggio', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const message = mockMessageCreator.createLogMessage('info', 'Test log message', {
        test: true,
      });
      (provider as any).handleLogUpdate(message);

      expect(consoleSpy).toHaveBeenCalledWith('[info] Test log message', { test: true });

      consoleSpy.mockRestore();
    });

    test("handleError dovrebbe loggare l'errore e mostrare un messaggio", () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');

      const error = new Error('Test error message');
      const message = mockMessageCreator.createError(error);
      (provider as any).handleError(message);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Test error message');

      consoleErrorSpy.mockRestore();
    });

    test('handleInfo dovrebbe loggare il messaggio e mostrare una notifica di tipo info', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const message = mockMessageCreator.createInfoMessage('Test info message', 'info');
      (provider as any).handleInfo(message);

      expect(consoleSpy).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Test info message');

      consoleSpy.mockRestore();
    });

    test('handleInfo dovrebbe mostrare una notifica di warning per messaggi con severity warning', () => {
      const message = mockMessageCreator.createInfoMessage('Test warning message', 'warning');
      (provider as any).handleInfo(message);

      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('Test warning message');
    });

    test('handleInfo dovrebbe mostrare una notifica di errore per messaggi con severity error', () => {
      const message = mockMessageCreator.createInfoMessage('Test error notification', 'error');
      (provider as any).handleInfo(message);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Test error notification');
    });
  });

  describe('postMessageToWebview', () => {
    test('dovrebbe inviare il messaggio alla webview', () => {
      const postMessageSpy = vi.spyOn(provider.webview, 'postMessage');

      const message = mockMessageCreator.createInfoMessage('Test message', 'info');
      (provider as any).postMessageToWebview(message);

      expect(postMessageSpy).toHaveBeenCalledWith(message);

      postMessageSpy.mockRestore();
    });

    test("dovrebbe gestire l'errore se l'invio fallisce", () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const postMessageSpy = vi.spyOn(provider.webview, 'postMessage');

      // Facciamo fallire intenzionalmente il postMessage
      postMessageSpy.mockImplementation(() => {
        throw new Error('Failed to post message');
      });

      const message = mockMessageCreator.createInfoMessage('Test message', 'info');
      (provider as any).postMessageToWebview(message);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Errore durante invio messaggio a Webview:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
      postMessageSpy.mockRestore();
    });

    test('dovrebbe loggare un warning se la webview non è disponibile', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      // Eliminiamo temporaneamente la webview
      const tempWebview = provider.webview;
      provider.webview = undefined as any;

      const message = mockMessageCreator.createInfoMessage('Test message', 'info');
      (provider as any).postMessageToWebview(message);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'WebView non disponibile, impossibile inviare il messaggio'
      );

      // Ripristiniamo la webview
      provider.webview = tempWebview;
      consoleWarnSpy.mockRestore();
    });
  });
});
