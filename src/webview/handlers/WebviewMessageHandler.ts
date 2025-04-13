import { Webview, ExtensionContext } from 'vscode';
import {
  WebviewMessageType,
  WebviewMessageBase,
  ActionMessage,
  ResponseMessage,
  InstructionMessage,
  SendPromptMessage,
  StateUpdateMessage,
  WebviewMessage,
} from '../../shared/types/webview.types';
import { BaseWebviewMessageHandler } from './BaseWebviewMessageHandler';

export class WebviewMessageHandler extends BaseWebviewMessageHandler {
  constructor(webview: Webview, context: ExtensionContext) {
    super(webview, context);
  }

  handleMessage(message: WebviewMessageBase): void {
    if (!message || !message.type) {
      this._sendError({
        error: new Error('Invalid message format'),
        timestamp: Date.now(),
      });
      return;
    }

    switch (message.type) {
      case WebviewMessageType.SEND_PROMPT:
        this._handleSendPrompt(message as SendPromptMessage);
        break;
      case WebviewMessageType.ACTION:
        this._handleAction(message as ActionMessage);
        break;
      case WebviewMessageType.RESPONSE:
        this._handleResponse(message as ResponseMessage);
        break;
      case WebviewMessageType.STATE_UPDATE:
        this._handleStateUpdate(message as StateUpdateMessage);
        break;
      case WebviewMessageType.INSTRUCTION:
        this._handleInstruction(message as InstructionMessage);
        break;
      default:
        console.warn('Unhandled message type:', message.type);
    }
  }

  protected _handleSendPrompt(message: SendPromptMessage): void {
    if (!message.payload?.prompt) {
      this._sendError({
        error: new Error('Missing prompt in message payload'),
        timestamp: Date.now(),
      });
      return;
    }

    this._updateState({
      ...this.state,
      lastPrompt: message.payload.prompt,
      timestamp: Date.now(),
    });
  }

  protected _handleAction(message: ActionMessage): void {
    if (!message.payload?.action) {
      this._sendError({
        error: new Error('Missing action in message payload'),
        timestamp: Date.now(),
      });
      return;
    }

    this._updateState({
      ...this.state,
      lastAction: message.payload.action,
      timestamp: Date.now(),
    });
  }

  protected _handleResponse(message: ResponseMessage): void {
    if (!message.payload?.response) {
      this._sendError({
        error: new Error('Missing response in message payload'),
        timestamp: Date.now(),
      });
      return;
    }

    this._updateState({
      ...this.state,
      lastResponse: message.payload.response,
      timestamp: Date.now(),
    });
  }

  protected _handleStateUpdate(message: StateUpdateMessage): void {
    if (!message.payload) {
      this._sendError({
        error: new Error('Missing payload in state update message'),
        timestamp: Date.now(),
      });
      return;
    }

    this._updateState({
      ...this.state,
      ...message.payload,
      timestamp: Date.now(),
    });
  }

  protected _handleInstruction(message: InstructionMessage): void {
    if (!message.payload?.instruction) {
      this._sendError({
        error: new Error('Missing instruction in message payload'),
        timestamp: Date.now(),
      });
      return;
    }

    // Process instruction
    const response: WebviewMessage = {
      type: WebviewMessageType.INSTRUCTION,
      id: message.id,
      agentId: message.agentId,
      payload: {
        instruction: message.payload.instruction,
        result: 'Instruction processed successfully',
      },
      timestamp: Date.now(),
    };

    // Update state with instruction result
    this._updateState({
      ...this.state,
      lastInstructionResult: response.payload.result,
      timestamp: response.timestamp,
    });

    this._sendMessage(response);
  }
}
