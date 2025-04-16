// src/webview-ui/src/hooks/useExtensionMessage.ts

// Use unknown instead of any for better type safety
type MessagePayload = Record<string, unknown> | string | number | boolean | null;
interface MockMessage {
  type: string;
  payload?: MessagePayload;
}

// Mock implementation
export function useExtensionMessage<T = MockMessage>() {
  // Mock postMessage function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const postMessage = (message: T): void => {
    // console.log('[Mock] Posting message:', message); // Optional logging
    // In a real test, you might want to spy on this or check arguments
  };

  // Mock onMessage function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onMessage = (callback: (message: T) => void): (() => void) => {
    // console.log('[Mock] Registered onMessage callback'); // Optional logging
    // In a real test, you would manually trigger this callback with mock messages
    // Return a cleanup function as expected by useEffect
    return () => {
      // console.log('[Mock] Unregistered onMessage callback'); // Optional logging
    };
  };

  return {
    postMessage,
    onMessage,
  };
} 