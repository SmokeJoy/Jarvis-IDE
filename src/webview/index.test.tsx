import React from 'react';
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ApiConfiguration } from '../shared/types/global';
import { Webview } from './webview';
// import './index'; // Temporaneamente commentato per evitare errore TS2307

describe('Webview Entry Point', () => {
  let config: ApiConfiguration;

  beforeEach(() => {
    config = {
      provider: 'openai',
      apiKey: 'test-key',
    };

    window.initialConfig = config;
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    delete window.initialConfig;
    document.body.innerHTML = '';
  });

  test('renders Webview with initial config', async () => {
    await import('./index');
    expect(screen.getByText('Jarvis IDE')).toBeInTheDocument();
  });
});
