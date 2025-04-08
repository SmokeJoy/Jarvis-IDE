import React, { useEffect, useState } from 'react';
import { 
  isExtensionMessage, 
  safeCastAs
} from '../../../src/shared/typeGuards';
import { WebviewMessage } from '../../../src/shared/WebviewMessage';
import { ExtensionMessage } from '../../../src/shared/ExtensionMessage';
import { 
  sendMessageToExtension, 
  createMessageListener 
} from '../utils/messageUtils';

// ... rest of imports

const ChatView: React.FC = () => {
  // ... existing state declarations

  useEffect(() => {
    // Use the createMessageListener utility to register a type-safe message handler
    const removeListener = createMessageListener((message: ExtensionMessage) => {
      // Handle each message type
      switch (message.type) {
        case 'response':
          // Handle response
          break;
        case 'settings':
          // Handle settings
          break;
        case 'error':
          // Handle error
          break;
        // ... other cases
      }
    });

    // Clean up listener on unmount
    return () => removeListener();
  }, []);

  // Safely send a chat request
  const handleSendMessage = (text: string) => {
    try {
      sendMessageToExtension({
        type: 'chatRequest',
        payload: {
          prompt: text,
          // ... other properties
        }
      });
    } catch (error) {
      console.error('Failed to send chat request:', error);
      // Handle error (could show a notification, etc.)
    }
  };

  // Safely clear the chat
  const handleClearChat = () => {
    try {
      sendMessageToExtension({
        type: 'clearChat'
      });
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  // Example of using safeCastAs directly when needed
  const handleSaveSettings = (settings: any) => {
    try {
      const message = safeCastAs<WebviewMessage>({
        type: 'saveSettings',
        payload: settings
      });
      
      // Get VS Code API and post the message
      const vscode = acquireVsCodeApi();
      vscode.postMessage(message);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // ... rest of component implementation

  return (
    // ... component JSX
  );
};

export default ChatView; 