import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { vscode } from '../../utils/vscode';

interface ExportButtonProps {
  itemId: string;
  format?: 'json' | 'markdown';
  onExport: (id: string) => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ 
  itemId, 
  format = 'json', 
  onExport 
}) => {
  const handleExport = () => {
    vscode.postMessage({
      type: 'exportChatHistory',
      payload: {
        id: itemId,
        format
      }
    });
    onExport(itemId);
  };

  return (
    <VSCodeButton appearance="secondary" onClick={handleExport}>
      Esporta
    </VSCodeButton>
  );
}; 