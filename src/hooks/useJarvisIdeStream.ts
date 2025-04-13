import './vscode-api';
import { useCallback, useState } from 'react';

export const useJarvisIdeStream = () => {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const startStreaming = useCallback(async () => {
    try {
      // Inizia lo streaming
      await vscode.postMessage({
        type: 'settings',
        payload: {
          stream: true,
        },
      });

      setIsStreaming(true);
    } catch (error) {
      console.error('Error starting stream:', error);
      throw error;
    }
  }, []);

  const stopStreaming = useCallback(async () => {
    try {
      // Ferma lo streaming
      await vscode.postMessage({
        type: 'settings',
        payload: {
          stream: false,
        },
      });

      setIsStreaming(false);
    } catch (error) {
      console.error('Error stopping stream:', error);
      throw error;
    }
  }, []);

  return {
    isStreaming,
    startStreaming,
    stopStreaming,
  };
};
