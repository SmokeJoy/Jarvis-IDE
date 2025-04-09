import React from 'react';
import styled from 'styled-components';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { JarvisAccount } from '../../../src/types/extension';

const Card = styled.div`
  padding: 1rem;
  background-color: var(--vscode-editor-background);
  border: 1px solid var(--vscode-button-border);
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  margin: 0 0 0.5rem 0;
  color: var(--vscode-editor-foreground);
`;

const Info = styled.p`
  margin: 0 0 1rem 0;
  color: var(--vscode-descriptionForeground);
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

interface JarvisAccountInfoCardProps {
  account: JarvisAccount;
  onLogout: () => void;
}

export function JarvisAccountInfoCard({ account, onLogout }: JarvisAccountInfoCardProps) {
  return (
    <Card>
      <Title>Account</Title>
      <Info>
        Logged in as {account.email}
        <br />
        Credits: {account.credits}
      </Info>
      <ButtonContainer>
        <VSCodeButton onClick={onLogout}>
          Logout
        </VSCodeButton>
      </ButtonContainer>
    </Card>
  );
}