export interface ChatContent {
  messages: Array<{
    role: string;
    content: string;
  }>;
} 