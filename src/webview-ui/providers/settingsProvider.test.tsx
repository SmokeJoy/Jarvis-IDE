import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SettingsProvider } from './settingsProvider.js';
import type { useSettings } from './settingsProvider.js';

// Mock di acquireVsCodeApi
(global as any).acquireVsCodeApi = () => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn()
});

const TestComponent = () => {
  const { settings, updateSetting } = useSettings();
  return (
    <div>
      <div data-testid="provider">{settings.provider}</div>
      <button onClick={() => updateSetting('provider', 'openai')}>
        Change Provider
      </button>
    </div>
  );
};

describe('SettingsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides default settings', () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    expect(screen.getByTestId('provider')).toHaveTextContent('local');
  });

  it('updates settings when receiving messages', () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'settings',
            payload: { provider: 'openai' }
          }
        })
      );
    });

    expect(screen.getByTestId('provider')).toHaveTextContent('openai');
  });

  it('sends message when updating settings', () => {
    const postMessage = vi.fn();
    (global as any).acquireVsCodeApi = () => ({
      postMessage,
      getState: vi.fn(),
      setState: vi.fn()
    });

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    fireEvent.click(screen.getByText('Change Provider'));

    expect(postMessage).toHaveBeenCalledWith({
      type: 'settingUpdated',
      payload: { key: 'provider', value: 'openai' }
    });
  });
}); 