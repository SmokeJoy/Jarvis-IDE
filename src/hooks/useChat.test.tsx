import { renderHook, act } from '@testing-library/react';
import { useChat } from './useChat';

describe('useChat', () => {
  it('should initialize with empty messages', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
  });

  it('should add a message when sendMessage is called', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Hello, world!');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hello, world!');
  });

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      try {
        await result.current.sendMessage('');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.messages).toHaveLength(0);
  });
});
