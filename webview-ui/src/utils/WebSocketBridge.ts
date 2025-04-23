/**
 * @file WebSocketBridge.ts
 * @description Bridge di comunicazione WebSocket tra la webview e l'estensione VS Code
 * @version 2.0.0
 */

import type { WebviewApi } from 'vscode-webview';
import type { WebSocketMessage, WebSocketMessageUnion, PingMessage, PongMessage } from '@shared/types/websocket.types';
import { WebSocketMessageType } from '@shared/types/websocket.types';
import { isAnyWebSocketMessage } from '@shared/messages/guards/websocketMessageGuards';

type MessageHandler<T extends WebSocketMessageUnion> = (message: T) => void;

export class WebSocketBridge {
  private static instance: WebSocketBridge | null = null;
  private listeners: Map<WebSocketMessageType, MessageHandler<WebSocketMessageUnion>[]>;
  private pingInterval: NodeJS.Timeout | null;
  private vscode: WebviewApi<unknown>;

  private constructor() {
    // Check if vscode API is available
    const vscode = acquireVsCodeApi();
    if (!vscode) {
      throw new Error('VSCode API not available');
    }
    this.vscode = vscode;
    
    this.listeners = new Map();
    this.pingInterval = null;
    
    this.setupMessageHandling();
    this.setupPingInterval();
  }

  public static getInstance(): WebSocketBridge {
    if (!WebSocketBridge.instance) {
      WebSocketBridge.instance = new WebSocketBridge();
    }
    return WebSocketBridge.instance;
  }

  private setupPingInterval() {
    this.pingInterval = setInterval(() => {
      const pingMessage: PingMessage = {
        type: WebSocketMessageType.PING,
        timestamp: Date.now()
      };
      this.sendMessage(pingMessage);
    }, 30000);
  }

  private setupMessageHandling() {
    window.addEventListener('message', event => {
      const message = event.data;
      
      if (!isAnyWebSocketMessage(message)) {
        return;
      }

      if (message.type === WebSocketMessageType.PING) {
        this.handlePing(message as PingMessage);
        return;
      }

      this.notifyListeners(message as WebSocketMessageUnion);
    });
  }

  private handlePing(message: PingMessage) {
    const pongMessage: PongMessage = {
      type: WebSocketMessageType.PONG,
      timestamp: Date.now()
    };
    this.sendMessage(pongMessage);
  }

  public sendMessage(message: WebSocketMessageUnion): void {
    this.vscode.postMessage(message);
  }

  public addMessageHandler<T extends WebSocketMessageUnion>(
    type: WebSocketMessageType,
    handler: MessageHandler<T>
  ): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)?.push(handler as MessageHandler<WebSocketMessageUnion>);
  }

  public removeMessageHandler<T extends WebSocketMessageUnion>(
    type: WebSocketMessageType,
    handler: MessageHandler<T>
  ): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler as MessageHandler<WebSocketMessageUnion>);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private notifyListeners(message: WebSocketMessageUnion): void {
    const handlers = this.listeners.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  public dispose(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.listeners.clear();
    WebSocketBridge.instance = null;
  }
}

export default WebSocketBridge;

