import { Webview, ExtensionContext } from 'vscode';
import {
  WebviewMessageType,
  WebviewMessageBase,
  ActionMessage,
  ResponseMessage,
  InstructionMessage,
  StateMessage,
  ErrorMessage,
  ActionType,
  InstructionCompletedMessage,
} from '../../shared/types/webview.types';
import { BaseWebviewMessageHandler } from './BaseWebviewMessageHandler';

export class WebviewMessageHandler extends BaseWebviewMessageHandler {
  constructor(context: ExtensionContext) {
    super(context);
  }

  initialize(webview: Webview): void {
    super.initialize(webview);
  }

  handleMessage(message: WebviewMessageBase): void {
    if (!message || !message.type) {
      this._sendError({
        error: new Error('Invalid message format'),
      });
      return;
    }

    switch (message.type) {
      case WebviewMessageType.SEND_PROMPT:
        this._handleSendPrompt(message as any);
        break;
      case WebviewMessageType.ACTION:
        this._handleAction(message as ActionMessage);
        break;
      case WebviewMessageType.RESPONSE:
        this._handleResponse(message as ResponseMessage);
        break;
      case WebviewMessageType.STATE_UPDATE:
        this._handleStateUpdate(message as StateMessage);
        break;
      case WebviewMessageType.INSTRUCTION:
        this._handleInstruction(message as InstructionMessage);
        break;
      default:
        console.warn('Unhandled message type:', message.type);
    }
  }

  protected _handleSendPrompt(message: any): void {
    const payload = message.payload as { prompt?: string };
    if (!payload?.prompt) {
      this._sendError({
        error: new Error('Missing prompt in message payload'),
      });
      return;
    }

    this._updateState({
      ...this.state,
      lastPrompt: payload.prompt,
    });
  }

  protected _handleAction(message: ActionMessage): void {
    const payload = message.payload as { action?: ActionType };
    if (!payload?.action) {
      this._sendError({
        error: new Error('Missing action in message payload'),
      });
      return;
    }

    this._updateState({
      ...this.state,
      lastAction: payload.action,
    });
  }

  protected _handleResponse(message: ResponseMessage): void {
    const payload = message.payload;
    if (!payload) {
      this._sendError({
        error: new Error('Missing payload in response message'),
      });
      return;
    }

    this._updateState({
      ...this.state,
      lastResponse: payload,
    });
  }

  protected _handleStateUpdate(message: StateMessage): void {
    if (!message.state) {
      this._sendError({
        error: new Error('Missing state in state update message'),
      });
      return;
    }

    this._updateState({
      ...this.state,
      ...message.state,
    });
  }

  protected _handleInstruction(message: InstructionMessage): void {
    const payload = message.payload as { instruction?: string };
    if (!payload?.instruction) {
      this._sendError({
        error: new Error('Missing instruction in message payload'),
      });
      return;
    }

    const response: InstructionCompletedMessage = {
      type: WebviewMessageType.INSTRUCTION_COMPLETED,
      id: message.id || 'unknown-id',
      agentId: message.agentId || 'unknown-agent',
      instruction: payload.instruction,
      result: 'Instruction processed successfully',
    };

    this._updateState({
      ...this.state,
      lastInstructionResult: response.result,
    });

    this._sendMessage(response);
  }

  protected _sendError(errorDetails: { error: Error | string }): void {
    const errorToSend: ErrorMessage = {
      type: WebviewMessageType.ERROR,
      error: errorDetails.error instanceof Error ? errorDetails.error.message : errorDetails.error,
    };
    this._sendMessage(errorToSend);
  }
}
