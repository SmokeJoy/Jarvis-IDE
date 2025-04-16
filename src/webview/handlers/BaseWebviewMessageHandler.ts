import { Webview, ExtensionContext } from 'vscode';
import {
  WebviewMessage,
  WebviewMessageType,
  StateMessage,
  ErrorMessage,
  WebviewMessageBase,
  ExtensionState,
  ExtensionMessage,
} from '../../shared/types/webview.types';

export abstract class BaseWebviewMessageHandler {
  protected webview: Webview | undefined;
  protected context: ExtensionContext;
  protected state: Record<string, unknown>;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.state = {};
  }

  initialize(webview: Webview): void {
    this.webview = webview;
  }

  protected abstract handleMessage(message: WebviewMessageBase): void;

  // Added public method to process messages from outside
  public processMessage(message: WebviewMessageBase): void {
    // Basic validation could go here if needed
    this.handleMessage(message);
  }

  protected _sendStateUpdate(): void {
    if (!this.webview) {
      console.warn('Attempted to send state update before webview was initialized.');
      return;
    }
    const stateMessage: StateMessage = {
      type: 'state',
      state: this.state as ExtensionState,
    };
    this._sendMessage(stateMessage);
  }

  protected _sendError(error: unknown): void {
    if (!this.webview) {
      console.warn('Attempted to send error before webview was initialized.');
      return;
    }
    const errorMessage: ErrorMessage = {
      type: WebviewMessageType.ERROR,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
    this._sendMessage(errorMessage);
  }

  protected _sendMessage<T extends WebviewMessageBase | ExtensionMessage>(message: T): void {
    if (!this.webview) {
      console.warn('Attempted to send message before webview was initialized.');
      return;
    }
    this.webview.postMessage(message);
  }

  protected _updateState(newState: Partial<Record<string, unknown>>): void {
    this.state = { ...this.state, ...newState };
    this._sendStateUpdate();
  }

  dispose(): void {
    this.webview = undefined;
  }
}
