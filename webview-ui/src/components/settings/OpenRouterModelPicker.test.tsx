import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OpenRouterModelPicker } from './OpenRouterModelPicker';
import type { OpenAiCompatibleModelInfo } from '@/types/models';
import { vscode } from '@/utils/vscode';

// Mock vscode
jest.mock('@/utils/vscode', () => ({
  vscode: {
    postMessage: jest.fn()
  }
}));

describe('OpenRouterModelPicker', () => {
  const mockModels: OpenAiCompatibleModelInfo[] = [
    {
      id: 'openai/gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openrouter',
      contextLength: 128000
    },
    {
      id: 'anthropic/claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'openrouter',
      contextLength: 200000
    }
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    render(
      <OpenRouterModelPicker
        modelInfo={mockModels[0]}
        onChange={mockOnChange}
        apiKey="test-key"
      />
    );
    expect(screen.getByText('Caricamento modelli...')).toBeInTheDocument();
  });

  it('renders error state correctly', async () => {
    render(
      <OpenRouterModelPicker
        modelInfo={mockModels[0]}
        onChange={mockOnChange}
        apiKey="test-key"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Impossibile caricare i modelli. Verifica la chiave API.')).toBeInTheDocument();
    });
  });

  it('renders models correctly and handles selection', async () => {
    render(
      <OpenRouterModelPicker
        modelInfo={mockModels[0]}
        onChange={mockOnChange}
        apiKey="test-key"
      />
    );

    await waitFor(() => {
      const dropdown = screen.getByRole('combobox');
      expect(dropdown).toBeInTheDocument();

      fireEvent.change(dropdown, { target: { value: mockModels[1].id } });

      expect(mockOnChange).toHaveBeenCalledWith(mockModels[1]);
      expect(vscode.postMessage).toHaveBeenCalledWith({
        type: 'modelSelected',
        timestamp: expect.any(Number),
        payload: {
          modelId: mockModels[1].id,
          modelInfo: mockModels[1]
        }
      });
    });
  });

  it('handles fallback when model is not found', async () => {
    render(
      <OpenRouterModelPicker
        modelInfo={mockModels[0]}
        onChange={mockOnChange}
        apiKey="test-key"
      />
    );

    await waitFor(() => {
      const dropdown = screen.getByRole('combobox');
      fireEvent.change(dropdown, { target: { value: 'unknown-model' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockModels[0],
        id: 'unknown-model',
        provider: 'openrouter',
        contextLength: 32000
      });
    });
  });
}); 