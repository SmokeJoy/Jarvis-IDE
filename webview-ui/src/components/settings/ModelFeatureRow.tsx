import React from 'react'
import styled from 'styled-components'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import type { ModelFeatureProps } from '../../types/model'

const FeatureContainer = styled.div<{ $isSupported: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 4px;
    background: ${props => props.$isSupported 
        ? 'var(--vscode-badge-background)' 
        : 'var(--vscode-statusBarItem-warningBackground)'};
    color: var(--vscode-badge-foreground);
    font-size: 12px;
`

const FeatureIcon = styled.span`
    font-size: 14px;
`

const FeatureLabel = styled.span`
    font-weight: 500;
    margin-right: 8px;
`

export const ModelFeatureRow: React.FC<ModelFeatureProps> = ({
    icon,
    label,
    isSupported,
    supportsLabel
}) => {
    return (
        <FeatureContainer $isSupported={isSupported}>
            <FeatureIcon>{icon}</FeatureIcon>
            <FeatureLabel>{label}:</FeatureLabel>
            <span>{supportsLabel}</span>
        </FeatureContainer>
    )
} 