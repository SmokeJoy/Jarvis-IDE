import { createSafeMessage } from "../src/shared/types/message";

// Sample file with message objects that need to be transformed

export const testMessages = [
  createSafeMessage({role: 'user', content: 'Hello, how are you?'}),
  createSafeMessage({role: 'assistant', content: 'I am fine, thank you!', timestamp: Date.now()}),
  createSafeMessage({role: 'system', content: 'You are a helpful assistant', metadata: {
                version: '1.0'
              }})
];

export function getTestConversation() {
  return [
    createSafeMessage({role: 'user', content: 'What is TypeScript?'}),
    createSafeMessage({role: 'assistant', content: 'TypeScript is a programming language...'})
  ];
}

export const complexMessage = createSafeMessage({role: 'user', content: 'This is a test', id: '123', timestamp: 1677721600000, metadata: {
    source: 'test'
  }}); 