import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { OpenRouterModelId } from "../shared/api.js";
import { OpenAiCompatibleModelInfo } from "../types/global.js";

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid var(--vscode-input-border);
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  &:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
  }
`;

const LoadingText = styled.div`
  color: var(--vscode-foreground);
  font-style: italic;
`;

const ErrorText = styled.div`
  color: var(--vscode-errorForeground);
`;

export interface OpenRouterModelPickerProps {
  selectedModel: OpenRouterModelId;
  onChange: (model: OpenRouterModelId) => void;
  models: OpenAiCompatibleModelInfo[];
  loading?: boolean;
  error?: string;
}

export function OpenRouterModelPicker({
  selectedModel,
  onChange,
  models,
  loading = false,
  error,
}: OpenRouterModelPickerProps) {
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as OpenRouterModelId);
  };

  if (loading) {
    return <LoadingText>Loading models...</LoadingText>;
  }

  if (error) {
    return <ErrorText>{error}</ErrorText>;
  }

  return (
    <Select value={selectedModel} onChange={handleModelChange}>
      {models.map((model) => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      ))}
    </Select>
  );
} 