import { vi } from 'vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketMessageType } from '@shared/types/websocket.types';
import type { WebSocketMessageUnion, PingMessage, PongMessage } from '@shared/types/websocket.types';

// Mock modules
vi.mock('../../src/utils/vscode', () => {
  return {
    vscode: {
      postMessage: vi.fn()
    }
  };
});

vi.mock('@shared/utils/outputLogger', () => {
  return {
    default: {
      createComponentLogger: () => ({
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      })
    }
  };
});

// Import after mocks
import { WebSocketBridge } from '../../src/utils/WebSocketBridge';
import { vscode } from '../../src/utils/vscode';

describe('WebSocketBridge', () => {
  let bridge: WebSocketBridge;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    // Reset timers
    vi.useFakeTimers();
    // Get bridge instance
    bridge = WebSocketBridge.getInstance();
  });

  afterEach(() => {
    // Cleanup
    bridge.dispose();
    vi.useRealTimers();
  });

  it('should be a singleton', () => {
    const instance1 = WebSocketBridge.getInstance();
    const instance2 = WebSocketBridge.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should send ping message on interval', () => {
    // Advance timer by ping interval
    vi.advanceTimersByTime(30000);

    // Verify ping message was sent
    expect(vscode.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WebSocketMessageType.PING,
        timestamp: expect.any(Number)
      })
    );
  });

  it('should send pong in response to ping', () => {
    const pingMessage: PingMessage = {
      type: WebSocketMessageType.PING,
      timestamp: Date.now()
    };

    // Simulate receiving ping message
    window.dispatchEvent(new MessageEvent('message', {
      data: pingMessage
    }));

    // Verify pong was sent
    expect(vscode.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WebSocketMessageType.PONG,
        timestamp: expect.any(Number)
      })
    );
  });

  it('should notify registered listeners', () => {
    const mockListener = vi.fn();
    const testMessage: WebSocketMessageUnion = {
      type: WebSocketMessageType.STATUS,
      status: 'connected',
      timestamp: Date.now()
    };

    // Register listener
    bridge.on('message', mockListener);

    // Simulate receiving message
    window.dispatchEvent(new MessageEvent('message', {
      data: testMessage
    }));

    // Verify listener was called
    expect(mockListener).toHaveBeenCalledWith(testMessage);
  });

  it('should remove listeners correctly', () => {
    const mockListener = vi.fn();
    const testMessage: WebSocketMessageUnion = {
      type: WebSocketMessageType.STATUS,
      status: 'connected',
      timestamp: Date.now()
    };

    // Register and then remove listener
    const removeListener = bridge.on('message', mockListener);
    removeListener();

    // Simulate receiving message
    window.dispatchEvent(new MessageEvent('message', {
      data: testMessage
    }));

    // Verify listener was not called
    expect(mockListener).not.toHaveBeenCalled();
  });

  it('should cleanup resources on dispose', () => {
    const mockListener = vi.fn();
    bridge.on('message', mockListener);

    // Clear mock history from initialization
    vi.clearAllMocks();
    
    bridge.dispose();

    // Verify ping interval was cleared
    vi.advanceTimersByTime(30000);
    expect(vscode.postMessage).not.toHaveBeenCalled();

    // Verify listeners were cleared
    const testMessage: WebSocketMessageUnion = {
      type: WebSocketMessageType.STATUS,
      status: 'connected',
      timestamp: Date.now()
    };
    window.dispatchEvent(new MessageEvent('message', {
      data: testMessage
    }));
    expect(mockListener).not.toHaveBeenCalled();
  });
}); 