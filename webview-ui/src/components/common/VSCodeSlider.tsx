import React from 'react';
import styled from 'styled-components';

const SliderContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Slider = styled.input`
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  background: var(--vscode-slider-background);
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: var(--vscode-slider-thumb);
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: var(--vscode-slider-thumb-hover);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Value = styled.span`
  min-width: 3rem;
  text-align: right;
  color: var(--vscode-editor-foreground);
  font-size: 14px;
`;

interface VSCodeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
}

export const VSCodeSlider: React.FC<VSCodeSliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false
}) => {
  const handleChange = (event: Event) => {
    const inputEvent = event as unknown as React.FormEvent<HTMLInputElement>;
    onChange(Number(inputEvent.currentTarget.value));
  };

  return (
    <SliderContainer>
      <Slider
        type="range"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      <Value>{value}</Value>
    </SliderContainer>
  );
}; 