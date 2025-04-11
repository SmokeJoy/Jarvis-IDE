import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsView } from './SettingsView.js';
import type { SettingsProvider, useSettings } from '../webview-ui/providers/settingsProvider.js';

// Mock di acquireVsCodeApi
(global as any).acquireVsCodeApi = () => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn()
});

// Mock del provider di impostazioni
vi.mock('../webview-ui/providers/settingsProvider', () => {
  const actual = vi.importActual('../webview-ui/providers/settingsProvider');
  return {
    ...actual,
    useSettings: vi.fn()
  };
});

// Mock dei componenti di VSCode
vi.mock('@vscode/webview-ui-toolkit/react', () => ({
  VSCodeToggle: ({ children, checked, onChange }: any) => (
    <div data-testid="vscode-toggle" onClick={() => onChange({ target: { checked: !checked } })}>
      {children}
    </div>
  ),
  VSCodeTextArea: ({ children, value, onInput, id }: any) => (
    <textarea data-testid={`vscode-textarea-${id}`} value={value} onChange={(e) => onInput(e)}>
      {children}
    </textarea>
  ),
  VSCodeDropdown: ({ children, value, onChange, id }: any) => (
    <select data-testid={`vscode-dropdown-${id}`} value={value} onChange={(e) => onChange(e)}>
      {children}
    </select>
  ),
  VSCodeButton: ({ children, onClick }: any) => (
    <button data-testid="vscode-button" onClick={onClick}>
      {children}
    </button>
  ),
  VSCodeDivider: () => <hr data-testid="vscode-divider" />,
  VSCodeCheckbox: ({ children, checked, onChange }: any) => (
    <div data-testid="vscode-toggle" onClick={() => onChange({ target: { checked: !checked } })}>
      {children}
    </div>
  )
}));

describe('SettingsView', () => {
  let mockUpdateSetting: any;
  let mockSaveSystemPrompt: any;

  beforeEach(() => {
    mockUpdateSetting = vi.fn();
    mockSaveSystemPrompt = vi.fn();

    vi.mocked(useSettings).mockReturnValue({
      settings: {
        provider: 'openai',
        model: 'gpt-4',
        coder_mode: true,
        use_docs: false,
        contextPrompt: 'Test context prompt',
        systemPrompt: 'Test system prompt'
      },
      updateSetting: mockUpdateSetting,
      saveSystemPrompt: mockSaveSystemPrompt
    });
  });

  it('renders all sections correctly', () => {
    render(<SettingsView />);

    expect(screen.getByText('Configurazione LLM')).toBeInTheDocument();
    expect(screen.getByText('Modalità e Documentazione')).toBeInTheDocument();
    expect(screen.getByText('Prompt di Contesto')).toBeInTheDocument();
    expect(screen.getByText('System Prompt')).toBeInTheDocument();
  });

  it('handles provider change', () => {
    render(<SettingsView />);

    const dropdown = screen.getByTestId('vscode-dropdown-provider');
    fireEvent.change(dropdown, { target: { value: 'local' } });
    expect(mockUpdateSetting).toHaveBeenCalledWith('provider', 'local');
  });

  it('handles model change', () => {
    render(<SettingsView />);

    const dropdown = screen.getByTestId('vscode-dropdown-model');
    fireEvent.change(dropdown, { target: { value: 'deepseek-coder' } });
    expect(mockUpdateSetting).toHaveBeenCalledWith('model', 'deepseek-coder');
  });

  it('handles coder mode toggle', () => {
    render(<SettingsView />);

    const toggle = screen.getAllByTestId('vscode-toggle')[0];
    fireEvent.click(toggle);
    expect(mockUpdateSetting).toHaveBeenCalledWith('coder_mode', false);
  });

  it('handles use_docs toggle', () => {
    render(<SettingsView />);

    const toggle = screen.getAllByTestId('vscode-toggle')[1];
    fireEvent.click(toggle);
    expect(mockUpdateSetting).toHaveBeenCalledWith('use_docs', true);
  });

  it('handles context prompt change', () => {
    render(<SettingsView />);

    const textarea = screen.getByTestId('vscode-textarea-context');
    fireEvent.change(textarea, { target: { value: 'New context prompt' } });
    expect(mockUpdateSetting).toHaveBeenCalledWith('contextPrompt', 'New context prompt');
  });

  it('handles system prompt change', () => {
    render(<SettingsView />);

    const textarea = screen.getByTestId('vscode-textarea-system');
    fireEvent.change(textarea, { target: { value: 'New system prompt' } });
    expect(mockUpdateSetting).toHaveBeenCalledWith('systemPrompt', 'New system prompt');
  });
}); 