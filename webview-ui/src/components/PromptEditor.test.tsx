import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromptEditor } from './PromptEditor';
import { vscode } from '@/utils/vscode';

// Mock vscode
jest.mock('@/utils/vscode', () => ({
  vscode: {
    postMessage: jest.fn()
  }
}));

describe('PromptEditor', () => {
  const mockOnChange = jest.fn();
  const mockOnBlur = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial value', () => {
    const initialValue = 'Test prompt';
    render(
      <PromptEditor
        initialValue={initialValue}
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(initialValue);
  });

  it('handles input changes', () => {
    render(
      <PromptEditor
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const textarea = screen.getByRole('textbox');
    const newValue = 'New prompt text';
    fireEvent.change(textarea, { target: { value: newValue } });

    expect(mockOnChange).toHaveBeenCalledWith(newValue);
    expect(vscode.postMessage).toHaveBeenCalledWith({
      type: 'info',
      timestamp: expect.any(Number),
      payload: {
        message: 'Prompt aggiornato',
        severity: 'info'
      }
    });
  });

  it('handles blur events', () => {
    render(
      <PromptEditor
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const textarea = screen.getByRole('textbox');
    const value = 'Test value';
    fireEvent.change(textarea, { target: { value } });
    fireEvent.blur(textarea);

    expect(mockOnBlur).toHaveBeenCalledWith(value);
  });

  it('toggles markdown preview', () => {
    render(
      <PromptEditor
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(screen.getByText('Anteprima Markdown')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    const placeholder = 'Custom placeholder';
    render(
      <PromptEditor
        placeholder={placeholder}
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('placeholder', placeholder);
  });
}); 