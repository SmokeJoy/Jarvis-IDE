// src/webview-ui/src/hooks/useExtensionMessage.ts

// Define basic types for messages if needed, or use 'any' for simplicity in mock
type MessagePayload = Record<string, any> | string | number | boolean | null;
interface MockMessage {
  type: string;
  payload?: MessagePayload;
}

// Mock implementation
export function useExtensionMessage<T = MockMessage>() {
  // Mock postMessage function
  const postMessage = (message: T): void => {
    // console.log('[Mock] Posting message:', message); // Optional logging
    // In a real test, you might want to spy on this or check arguments
  };

  // Mock onMessage function
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
