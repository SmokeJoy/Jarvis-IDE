import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { ChatMessage } from '@shared/types/message';

type ChatState = {
  messages: ChatMessage[];
  isTyping: boolean;
};

type ChatAction =
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'SET_TYPING'; isTyping: boolean };

const initialState: ChatState = {
  messages: [],
  isTyping: false
};

type ChatContextType = {
  state: ChatState;
  dispatch: Dispatch<ChatAction>;
};

// Using `undefined` as default to force provider usage
const ChatContext = createContext<ChatContextType | undefined>(undefined);

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'SET_TYPING':
      return { ...state, isTyping: action.isTyping };
    default:
      return state;
  }
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};