import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';

interface RetryPromptButtonProps {
  originalMessageId: string;
}

export const RetryPromptButton: React.FC<RetryPromptButtonProps> = ({ originalMessageId }) => {
  const { postTypedMessage } = useExtensionMessage();

  const handleRetry = () => {
    postTypedMessage({
      type: 'retryPrompt',
      payload: {
        originalMessageId
      }
    });
  };

  return (
    <div className="retry-button">
      <VSCodeButton
        onClick={handleRetry}
        appearance="secondary"
        aria-label="Riprova invio prompt"
      >
        ↺ Riprova
      </VSCodeButton>
    </div>
  );
};