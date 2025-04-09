import type { useCallback, useState } from 'react';
import type { ChatMessage } from '../types/chat.types.js.js';
import type { AIProvider } from '../types/provider.types.js.js';

export const useJarvisIdePrompt = (provider: AIProvider) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendPrompt = useCallback(async (messages: ChatMessage[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(provider.baseUrl || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          messages,
          model: provider.models[0].id,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  return {
    sendPrompt,
    isLoading,
    error
  };
}; 