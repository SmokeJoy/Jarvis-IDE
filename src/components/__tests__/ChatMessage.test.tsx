import { render } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { ChatMessage } from '../ChatMessage';
import type { MessagePart } from '../../types/chat';

describe('ChatMessage', () => {
  const mockParts: MessagePart[] = [
    { type: 'text', content: 'Testo semplice' },
    { type: 'code', content: 'console.log("Hello World")' },
    { type: 'error', content: 'Errore di esempio' },
    { type: 'image', url: 'test.jpg', altText: 'Test alt' },
    { type: 'link', url: 'https://example.com', text: 'Example Link' }
  ];

  test('rende correttamente tutte le parti del messaggio', () => {
    const { container } = render(<ChatMessage parts={mockParts} />);
    expect(container).toMatchSnapshot();
  });

  test('mostra il pulsante di riprova per gli errori', () => {
    const mockRetry = vi.fn();
    const { getByRole } = render(
      <ChatMessage parts={[{ type: 'error', content: 'Err' }]} onRetry={mockRetry} />
    );
    
    getByRole('button').click();
    expect(mockRetry).toHaveBeenCalled();
  });

  test.each(['text', 'code', 'error', 'image', 'link'] as const)(
    'rende correttamente la parte di tipo %s',
    (type) => {
      const testPart = mockParts.find(p => p.type === type)!;
      const { container } = render(<ChatMessage parts={[testPart]} />);
      expect(container).toMatchSnapshot();
    }
  );
});