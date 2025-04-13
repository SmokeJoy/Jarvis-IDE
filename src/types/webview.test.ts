import { describe, expect, test } from 'vitest';
import {
  WebviewState,
  WebviewMessage,
  WebviewCommand,
  WebviewTheme,
  WebviewConfiguration,
} from './webview';

describe('Webview Types', () => {
  test('WebviewState should have correct structure', () => {
    const state: WebviewState = {
      messages: [],
      config: {
        provider: 'openai',
        apiKey: 'test-key',
      },
      isLoading: false,
      mcpConnected: false,
    };
    expect(state).toMatchObject({
      messages: expect.any(Array),
      config: expect.objectContaining({
        provider: expect.any(String),
        apiKey: expect.any(String),
      }),
      isLoading: expect.any(Boolean),
      mcpConnected: expect.any(Boolean),
    });
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

  test('WebviewCommand should have correct structure', () => {
    const command: WebviewCommand = {
      command: 'test.command',
      title: 'Test Command',
      icon: 'test-icon',
      when: 'test-condition',
    };
    expect(command).toMatchObject({
      command: expect.any(String),
      title: expect.any(String),
      icon: expect.any(String),
      when: expect.any(String),
    });
  });

  test('WebviewTheme should have correct structure', () => {
    const theme: WebviewTheme = {
      name: 'Test Theme',
      type: 'dark',
      colors: {
        background: '#000000',
        foreground: '#ffffff',
      },
    };
    expect(theme).toMatchObject({
      name: expect.any(String),
      type: expect.stringMatching(/^(light|dark)$/),
      colors: expect.any(Object),
    });
  });

  test('WebviewConfiguration should have correct structure', () => {
    const config: WebviewConfiguration = {
      theme: {
        name: 'Test Theme',
        type: 'dark',
        colors: {},
      },
      fontSize: 14,
      fontFamily: 'Consolas',
      showLineNumbers: true,
      wordWrap: true,
      tabSize: 2,
      renderWhitespace: 'none',
      scrollBeyondLastLine: false,
      minimap: {
        enabled: true,
        maxColumn: 120,
        renderCharacters: true,
        showSlider: 'always',
        side: 'right',
      },
    };
    expect(config).toMatchObject({
      theme: expect.any(Object),
      fontSize: expect.any(Number),
      fontFamily: expect.any(String),
      showLineNumbers: expect.any(Boolean),
      wordWrap: expect.any(Boolean),
      tabSize: expect.any(Number),
      renderWhitespace: expect.stringMatching(/^(none|boundary|all)$/),
      scrollBeyondLastLine: expect.any(Boolean),
      minimap: expect.objectContaining({
        enabled: expect.any(Boolean),
        maxColumn: expect.any(Number),
        renderCharacters: expect.any(Boolean),
        showSlider: expect.stringMatching(/^(always|mouseover)$/),
        side: expect.stringMatching(/^(right|left)$/),
      }),
    });
  });
});
