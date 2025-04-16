import React from 'react';
import { VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react';

export const ChatStreamingIndicator: React.FC = () => {
  return (
    <div className="streaming-indicator">
      <VSCodeProgressRing aria-label="Streaming in corso..." />
      <span className="streaming-text">Streaming risposta...</span>
    </div>
  );
};