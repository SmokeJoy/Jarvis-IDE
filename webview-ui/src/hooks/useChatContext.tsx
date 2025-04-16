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

const ChatContext = createContext<{
  state: ChatState;
  dispatch: Dispatch<ChatAction>;
}>({
  state: initialState,
  dispatch: () => null
});

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

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  return useContext(ChatContext);
};