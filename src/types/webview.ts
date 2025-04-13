import { ChatCompletionMessageParam } from './provider-types/openai-types';
import { ApiConfiguration } from './global';

export interface WebviewState {
  messages: ChatCompletionMessageParam[];
  config: ApiConfiguration;
  isLoading: boolean;
  error?: string;
  mcpConnected: boolean;
}

export interface WebviewMessage {
  type: string;
  payload?: any;
}

export interface WebviewCommand {
  command: string;
  title: string;
  icon?: string;
  when?: string;
}

export interface WebviewTheme {
  name: string;
  type: 'light' | 'dark';
  colors: {
    [key: string]: string;
  };
}

export interface WebviewConfiguration {
  theme: WebviewTheme;
  fontSize: number;
  fontFamily: string;
  showLineNumbers: boolean;
  wordWrap: boolean;
  tabSize: number;
  renderWhitespace: 'none' | 'boundary' | 'all';
  scrollBeyondLastLine: boolean;
  minimap: {
    enabled: boolean;
    maxColumn: number;
    renderCharacters: boolean;
    showSlider: 'always' | 'mouseover';
    side: 'right' | 'left';
  };
}
