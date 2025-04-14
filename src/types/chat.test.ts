import { describe, expect, test } from 'vitest';
import {
  Message,
  WebviewMessage,
  ChatRequest,
  ChatResponse,
  StreamResponse,
  ErrorResponse,
} from './chat';
import { createChatMessage as createChatMessage } from "../src/shared/types/chat.types";

describe('Chat Types', () => {
  test('Message should have correct structure', () => {
    const message: Message = createChatMessage({role: 'user', content: 'test message', timestamp: Date.now(), streaming: false});
    expect(message).toMatchObject(createChatMessage({role: expect.stringMatching(/^(user|assistant)$/), content: expect.any(String), timestamp: expect.any(Number), streaming: expect.any(Boolean)}));
  });

  test('WebviewMessage should have correct structure', () => {
    const message: WebviewMessage = {
      type: 'test',
      payload: { data: 'test' },
    };
    expect(message).toMatchObject({
      type: expect.any(String),
      payload: expect.any(Object),
    });
  });

  test('ChatRequest should have correct structure', () => {
    const request: ChatRequest = {
      messages: [
        createChatMessage({role: 'user', content: 'test message', timestamp: Date.now()}),
      ],
      stream: true,
    };
    expect(request).toMatchObject({
      messages: expect.arrayContaining([
        expect.objectContaining(createChatMessage({role: expect.any(String), content: expect.any(String), timestamp: expect.any(Number)})),
      ]),
      stream: expect.any(Boolean),
    });
  });

  test('ChatResponse should have correct structure', () => {
    const response: ChatResponse = {
      message: createChatMessage({role: 'assistant', content: 'test response', timestamp: Date.now()}),
    };
    expect(response).toMatchObject({
      message: expect.objectContaining(createChatMessage({role: expect.stringMatching(/^assistant$/), content: expect.any(String), timestamp: expect.any(Number)})),
    });
  });

  test('StreamResponse should have correct structure', () => {
    const response: StreamResponse = {
      chunk: 'test chunk',
    };
    expect(response).toMatchObject({
      chunk: expect.any(String),
    });
  });

  test('ErrorResponse should have correct structure', () => {
    const response: ErrorResponse = {
      error: 'test error',
    };
    expect(response).toMatchObject({
      error: expect.any(String),
    });
  });
});
