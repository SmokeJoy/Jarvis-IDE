declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}

declare module 'react-markdown' {
  import React from 'react';
  const ReactMarkdown: React.FC<{
    children: string;
    className?: string;
    components?: Record<string, React.ComponentType<any>>;
  }>;
  export default ReactMarkdown;
}

declare module '@vscode/webview-ui-toolkit/react' {
  import React from 'react';

  export interface VSCodeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    appearance?: 'primary' | 'secondary';
  }

  export const VSCodeButton: React.FC<VSCodeButtonProps>;
  export const VSCodeTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>>;
  export const VSCodeTextField: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
  export const VSCodeDropdown: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>>;
  export const VSCodeCheckbox: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
  export const VSCodeRadioGroup: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const VSCodeBadge: React.FC<React.HTMLAttributes<HTMLSpanElement>>;
  export const VSCodeDivider: React.FC<React.HTMLAttributes<HTMLHRElement>>;
  export const VSCodeLink: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
  export const VSCodeProgressBar: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const VSCodeProgressRing: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const VSCodeTag: React.FC<React.HTMLAttributes<HTMLSpanElement>>;
}
