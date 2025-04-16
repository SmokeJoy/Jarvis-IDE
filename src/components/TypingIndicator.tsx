import React from 'react';
import { VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react';

export const TypingIndicator: React.FC = () => (
  <div className="typing-indicator" role="status" aria-live="polite">
    <VSCodeProgressRing aria-label="Generazione risposta in corso" />
    <span className="sr-only">L'assistente sta scrivendo...</span>
  </div>
);