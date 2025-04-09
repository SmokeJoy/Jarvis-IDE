import styled from 'styled-components'

export const OPENROUTER_MODEL_PICKER_Z_INDEX = 1000

export const ModelItemContainer = styled.div<{ $isSelected: boolean }>`
    padding: 8px 12px;
    cursor: pointer;
    background: ${props => props.$isSelected ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent'};
    color: ${props => props.$isSelected ? 'var(--vscode-list-activeSelectionForeground)' : 'inherit'};

    &:hover {
        background: var(--vscode-list-hoverBackground);
    }

    &:focus {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: -1px;
    }

    .model-item-highlight {
        background-color: var(--vscode-editor-findMatchHighlightBackground);
        color: inherit;
    }
`

export const ModelDescriptionMarkdown = styled.div<{ $isExpanded: boolean }>`
    max-height: ${props => props.$isExpanded ? 'none' : '100px'};
    overflow: hidden;
    position: relative;
    margin-bottom: ${props => props.$isExpanded ? '16px' : '0'};
    
    &:after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: ${props => props.$isExpanded ? '0' : '40px'};
        background: ${props => props.$isExpanded 
            ? 'transparent' 
            : 'linear-gradient(to bottom, transparent, var(--vscode-editor-background))'};
    }
`

export const DropdownContainer = styled.div`
    position: relative;
    width: 100%;
`

export const SearchInput = styled.input`
    width: 100%;
    padding: 8px 12px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border);
    border-radius: 2px;
    font-family: inherit;
    font-size: 13px;

    &:focus {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: -1px;
    }

    &::placeholder {
        color: var(--vscode-input-placeholderForeground);
    }
`

export const ModelList = styled.div`
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--vscode-dropdown-border);
    border-radius: 2px;
    margin-top: 4px;
    background: var(--vscode-dropdown-background);

    &::-webkit-scrollbar {
        width: 10px;
    }

    &::-webkit-scrollbar-track {
        background: var(--vscode-scrollbarSlider-background);
    }

    &::-webkit-scrollbar-thumb {
        background: var(--vscode-scrollbarSlider-hoverBackground);
        border-radius: 5px;
    }
`

export const ClearButton = styled.button`
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--vscode-input-foreground);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;

    &:hover {
        opacity: 1;
    }

    &:focus {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: -1px;
    }
` 