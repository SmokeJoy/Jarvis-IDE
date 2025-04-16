import { useReducer } from 'react';
import { ChatMessage } from '@shared/types/message';

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  error?: string;
  token?: string;
}

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'UPDATE_TOKEN'; payload: string }
  | { type: 'RETRY_MESSAGE'; payload: string };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_TOKEN':
      return { ...state, token: action.payload };
    case 'RETRY_MESSAGE':
      return { ...state, messages: state.messages.slice(0, action.payload) };
    default:
      return state;
  }
};

export const useLiveChatMessageReducer = () => {
  const [state, dispatch] = useReducer(chatReducer, {
    messages: [],
    isTyping: false
  });

  return { state, dispatch };
};