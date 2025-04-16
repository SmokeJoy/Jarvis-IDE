import { render, screen } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';

const mockParts = [
  { type: 'text', content: 'Testo semplice' },
  { 
    type: 'code', 
    content: 'console.log("Hello World")',
    language: 'javascript'
  },
  {
    type: 'image',
    url: 'test.jpg',
    altText: 'Immagine test',
    caption: 'Didascalia'
  },
  {
    type: 'link',
    url: 'https://example.com',
    label: 'Esempio'
  }
];

describe('ChatMessage', () => {
  it('rende correttamente tutti i tipi di contenuto', () => {
    const { container } = render(
      <ChatMessage parts={mockParts} onRetry={() => {}} />
    );
    
    expect(screen.getByText('Testo semplice')).toBeInTheDocument();
    expect(screen.getByText('console.log("Hello World")')).toBeInTheDocument();
    expect(screen.getByAltText('Immagine test')).toBeInTheDocument();
    expect(screen.getByText('Esempio').closest('a')).toHaveAttribute('href', 'https://example.com');
    
    expect(container).toMatchSnapshot();
  });
});