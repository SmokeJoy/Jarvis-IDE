import styled from 'styled-components'
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"

export const TabContainer = styled.nav`
    display: flex;
    gap: 4px;
    padding: 8px 0;
    border-bottom: 1px solid var(--vscode-panel-border);
    margin-bottom: 16px;
    overflow-x: auto;
    scrollbar-width: thin;
    
    &::-webkit-scrollbar {
        height: 4px;
    }
    
    &::-webkit-scrollbar-track {
        background: var(--vscode-scrollbarSlider-background);
    }
    
    &::-webkit-scrollbar-thumb {
        background: var(--vscode-scrollbarSlider-hoverBackground);
        border-radius: 2px;
    }
`

export const TabButton = styled(VSCodeButton)<{ $isActive?: boolean }>`
    position: relative;
    white-space: nowrap;
    
    &:after {
        content: '';
        position: absolute;
        bottom: -9px;
        left: 0;
        width: 100%;
        height: 2px;
        background: ${props => props.$isActive 
            ? 'var(--vscode-textLink-activeForeground)' 
            : 'transparent'};
        transition: background-color 0.2s ease;
    }

    &:hover:after {
        background: ${props => props.$isActive 
            ? 'var(--vscode-textLink-activeForeground)'
            : 'var(--vscode-textLink-foreground)'};
    }

    &:focus {
        outline: 2px solid var(--vscode-focusBorder);
        outline-offset: 2px;
    }
`

export const TabBadge = styled.span<{ $type?: 'info' | 'warning' | 'error' }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 6px;
    margin-left: 8px;
    border-radius: 9px;
    font-size: 11px;
    font-weight: 600;
    
    background: ${props => {
        switch(props.$type) {
            case 'error': return 'var(--vscode-errorForeground)'
            case 'warning': return 'var(--vscode-editorWarning-foreground)'
            case 'info': return 'var(--vscode-textLink-foreground)'
            default: return 'var(--vscode-badge-background)'
        }
    }};
    
    color: var(--vscode-badge-foreground);
` 