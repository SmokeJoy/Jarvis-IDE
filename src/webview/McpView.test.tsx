import React from 'react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { McpView } from './McpView';

// Mock styled-components
vi.mock('styled-components', () => {
  const styled = (tag: string) => {
    const StyledComponent = ({ children, ...props }: any) => {
      const Tag = tag;
      const style = {
        ...(tag === 'div' && props['data-testid'] === 'mcp-container' && { padding: '16px' }),
        ...(tag === 'div' &&
          props['data-testid'] === 'code-block' && {
            margin: '16px 0',
            borderRadius: '4px',
            overflow: 'hidden',
          }),
      };
      return React.createElement(Tag, { ...props, style }, children);
    };
    return () => StyledComponent;
  };

  return {
    __esModule: true,
    default: {
      div: styled('div'),
      h2: styled('h2'),
    },
  };
});

// Mock react-syntax-highlighter
vi.mock('react-syntax-highlighter', () => ({
  Light: ({
    children,
    style,
    customStyle,
    ...props
  }: {
    children: React.ReactNode;
    style?: React.CSSProperties;
    customStyle?: string;
    [key: string]: any;
  }) => (
    <pre data-testid="code-content" style={{ ...style, ...customStyle }} {...props}>
      {children}
    </pre>
  ),
}));

// Mock react-syntax-highlighter/dist/esm/styles/hljs
vi.mock('react-syntax-highlighter/dist/esm/styles/hljs', () => ({
  __esModule: true,
  docco: {},
}));

describe('McpView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testCode = 'const test = "Hello World";';

  test('renders title correctly', () => {
    render(<McpView code={testCode} />);
    expect(screen.getByText('MCP View')).toBeInTheDocument();
  });

  test('renders code content', () => {
    render(<McpView code={testCode} />);
    const codeContent = screen.getByTestId('code-content');
    expect(codeContent).toHaveTextContent(testCode);
  });

  test('applies container styles', () => {
    render(<McpView code={testCode} />);
    const container = screen.getByTestId('mcp-container');
    expect(container).toHaveStyle('padding: 16px');
  });

  test('applies code block styles', () => {
    render(<McpView code={testCode} />);
    const codeBlock = screen.getByTestId('code-block');
    expect(codeBlock).toHaveStyle({
      margin: '16px 0',
      borderRadius: '4px',
      overflow: 'hidden',
    });
  });
});
