import { describe, it, expect } from 'vitest';
import { isWebSocketMessage, WebSocketMessageType } from '../websocketMessageUnion';

describe('WebSocketMessage guards', () => {
  it('recognizes valid WS_PONG message', () => {
    const msg = { type: WebSocketMessageType.WS_PONG } as const;
    expect(isWebSocketMessage(msg)).toBe(true);
  });

  it('rejects unknown type', () => {
    const msg = { type: 'UNKNOWN_TYPE' } as const;
    // @ts-expect-error testing unknown type
    expect(isWebSocketMessage(msg)).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(isWebSocketMessage(null)).toBe(false);
    expect(isWebSocketMessage({})).toBe(false);
  });
});