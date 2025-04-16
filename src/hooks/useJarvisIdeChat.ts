import { useCallback, useState } from 'react';
import { ChatHistory } from '../src/shared/types/chat.types';
import { AIProvider } from '../types/provider.types';
import { createChatMessage as createChatMessage } from '../src/shared/types/chat.types';

export const useJarvisIdeChat = (provider: AIProvider) => {
  const [messages, setMessages] = useState<ChatHistory>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const userMessage = createChatMessage('user', content, {
          timestamp: new Date().toISOString()
        });

        setMessages((prev) => [...prev, userMessage]);

        const response = await fetch(provider.baseUrl || '', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider.apiKey}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            model: provider.models[0].id,
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = createChatMessage('assistant', data.choices[0].message.content, {
          timestamp: new Date().toISOString()
        });

        setMessages((prev) => [...prev, assistantMessage]);
        return assistantMessage;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [provider, messages]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    clearChat,
    isLoading,
    error,
  };
};
