import { Webview, ExtensionContext } from 'vscode';
import {
  WebviewMessage,
  WebviewMessageType,
  StateMessage,
  ErrorMessage,
  WebviewMessageBase,
} from '../../shared/types/webview.types';

export abstract class BaseWebviewMessageHandler {
  protected webview: Webview;
  protected context: ExtensionContext;
  protected state: Record<string, unknown>;

  constructor(webview: Webview, context: ExtensionContext) {
    this.webview = webview;
    this.context = context;
    this.state = {};
  }

  protected abstract handleMessage(message: WebviewMessageBase): void;

  protected _sendStateUpdate(): void {
    const stateMessage: StateMessage = {
      type: WebviewMessageType.STATE_UPDATE,
      payload: {
        state: this.state,
        timestamp: Date.now(),
      },
    };
    this._sendMessage(stateMessage);
  }

  protected _sendError(error: unknown): void {
    const errorMessage: ErrorMessage = {
      type: WebviewMessageType.ERROR,
      payload: {
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        timestamp: Date.now(),
      },
    };
    this._sendMessage(errorMessage);
  }

  protected _sendMessage<T extends WebviewMessage>(message: T): void {
    this.webview.postMessage(message);
  }

  protected _updateState(newState: Partial<Record<string, unknown>>): void {
    this.state = { ...this.state, ...newState };
    this._sendStateUpdate();
  }
}
