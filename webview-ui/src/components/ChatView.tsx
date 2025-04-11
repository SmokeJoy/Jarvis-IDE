import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  WebviewMessage,
  ExtensionMessage,
  WebviewMessageType,
  ChatMessage
} from '../../../src/shared/types/webview.types';
import { 
  createMessageListener,
  sendMessageToExtension,
  createMessage
} from '../utils/messageUtils';
import { useTranslation } from '../i18n';
import { VSCodeButton, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';
import { vscode } from '@/utils/vscode';
import type { ErrorMessage, InfoMessage } from '@/types/WebviewMessageType';
import { MessageList } from './MessageList';
import { SystemMessage } from './SystemMessage';

// Type guard per verificare se un oggetto è un ChatMessage valido
function isChatMessage(obj: any): obj is ChatMessage {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.role === 'string' &&
    (typeof obj.content === 'string' || Array.isArray(obj.content))
  );
}

// Type guard per verificare se un array contiene solo ChatMessage
function isChatMessageArray(arr: any[]): arr is ChatMessage[] {
  return arr.every(isChatMessage);
}

// Custom hook per gestire i messaggi della chat
function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  
  // Aggiorna sia lo stato che il ref
  const updateMessages = useCallback((newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    messagesRef.current = newMessages;
  }, []);
  
  // Aggiungi un messaggio alla chat
  const addMessage = useCallback((message: ChatMessage) => {
    if (isChatMessage(message)) {
      updateMessages([...messagesRef.current, message]);
    } else {
      console.warn('Tentativo di aggiungere un messaggio non valido:', message);
    }
  }, [updateMessages]);
  
  // Aggiungi più messaggi alla chat
  const addMessages = useCallback((newMessages: ChatMessage[]) => {
    if (Array.isArray(newMessages) && isChatMessageArray(newMessages)) {
      updateMessages([...messagesRef.current, ...newMessages]);
    } else {
      console.warn('Tentativo di aggiungere messaggi non validi:', newMessages);
    }
  }, [updateMessages]);
  
  // Carica una nuova lista di messaggi
  const loadMessages = useCallback((newMessages: ChatMessage[]) => {
    if (Array.isArray(newMessages) && isChatMessageArray(newMessages)) {
      updateMessages(newMessages);
    } else {
      console.warn('Tentativo di caricare messaggi non validi:', newMessages);
    }
  }, [updateMessages]);
  
  // Svuota la chat
  const clearMessages = useCallback(() => {
    updateMessages([]);
  }, [updateMessages]);
  
  return {
    messages,
    addMessage,
    addMessages,
    loadMessages,
    clearMessages
  };
}

interface ChatViewProps {
	messages: ChatMessage[];
	onSendMessage: (message: string) => void;
	isLoading: boolean;
	error?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
	messages,
	onSendMessage,
	isLoading,
	error
}) => {
	const { t } = useTranslation();
	const [inputValue, setInputValue] = useState<string>('');
	const [isSending, setIsSending] = useState<boolean>(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const {
		addMessage,
		loadMessages,
		clearMessages
	} = useChatMessages();

	// Scroll automatico quando arrivano nuovi messaggi
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages]);

	// Gestione dei messaggi in arrivo dall'estensione
	useEffect(() => {
		const removeListener = createMessageListener((message: ExtensionMessage) => {
			console.log('Messaggio ricevuto:', message.type, message);
			
			// Resetta lo stato di errore ad ogni nuovo messaggio
			error = null;
			
			switch (message.type) {
				case WebviewMessageType.CHAT_RESPONSE:
					// Gestisci risposta chat
					isLoading = false;
					if (message.message && isChatMessage(message.message)) {
						addMessage(message.message);
					}
					break;
				
				case 'chatMessagesLoaded': // Retrocompatibilità
				case WebviewMessageType.LOAD_CHAT_HISTORY:
					// Carica i messaggi della chat
					if (message.messages && Array.isArray(message.messages)) {
						loadMessages(message.messages);
					}
					break;
				
				case 'clearChat': // Retrocompatibilità
				case WebviewMessageType.CLEAR_CHAT_HISTORY:
					// Svuota la chat
					clearMessages();
					break;
				
				case 'addChatMessage': // Retrocompatibilità
					// Aggiungi un messaggio alla chat
					if (message.payload?.message && isChatMessage(message.payload.message)) {
						addMessage(message.payload.message);
					}
					break;
				
				case 'error':
				case WebviewMessageType.ERROR:
				case WebviewMessageType.SHOW_ERROR_MESSAGE:
					// Gestisci errori
					isLoading = false;
					error = message.error || t('errors.unknown');
					break;
				
				default:
					// Se non è un tipo di messaggio gestito, ignora
					break;
			}
		});
		
		// Pulizia del listener quando il componente viene smontato
		return () => removeListener();
	}, [addMessage, loadMessages, clearMessages, t]);

	const handleInputChange = useCallback((event: React.FormEvent<HTMLTextAreaElement>) => {
		setInputValue(event.currentTarget.value);
	}, []);

	const handleSendMessage = useCallback(async () => {
		if (!inputValue.trim() || isSending) return;

		setIsSending(true);
		try {
			onSendMessage(inputValue);
			setInputValue('');

			const infoMessage: InfoMessage = {
				type: 'info',
				timestamp: Date.now(),
				payload: {
					message: 'Messaggio inviato con successo',
					severity: 'success'
				}
			};
			vscode.postMessage(infoMessage);
		} catch (err) {
			const errorMessage: ErrorMessage = {
				type: 'error',
				timestamp: Date.now(),
				payload: {
					message: 'Errore durante l\'invio del messaggio',
					code: 'SEND_ERROR'
				}
			};
			vscode.postMessage(errorMessage);
		} finally {
			setIsSending(false);
		}
	}, [inputValue, isSending, onSendMessage]);

	const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSendMessage();
		}
	}, [handleSendMessage]);

	// Renderizza un singolo messaggio della chat
	const renderMessage = (message: ChatMessage, index: number) => {
		const isUser = message.role === 'user';
		const className = `chat-message ${isUser ? 'user-message' : 'assistant-message'}`;
		
		return (
			<div key={index} className={className}>
				<div className="message-header">
					<span className="message-role">
						{isUser ? t('chat.user') : t('chat.assistant')}
					</span>
					{message.timestamp && (
						<span className="message-time">
							{new Date(message.timestamp).toLocaleTimeString()}
						</span>
					)}
				</div>
				<div className="message-content">
					{typeof message.content === 'string' 
						? message.content
						: JSON.stringify(message.content)}
				</div>
			</div>
		);
	};

	return (
		<div className="chat-container">
			<div className="chat-header">
				<h1>{t('chat.title')}</h1>
				<button 
					className="clear-button" 
					onClick={clearMessages}
					disabled={isLoading || messages.length === 0}
				>
					{t('chat.clear')}
				</button>
			</div>
			
			{error && (
				<div className="error-notification" role="alert">
					<span className="error-icon">⚠️</span>
					<span className="error-message">{error}</span>
					<button 
						className="error-dismiss" 
						onClick={() => error = null}
						aria-label={t('common.dismiss')}
					>
						×
					</button>
				</div>
			)}
			
			<div className="chat-messages">
				{messages.length === 0 ? (
					<div className="empty-state">
						<p>{t('chat.empty')}</p>
					</div>
				) : (
					<MessageList messages={messages} isLoading={isLoading} />
				)}
				<div ref={messagesEndRef} />
			</div>
			
			<div className="chat-input">
				<VSCodeTextArea
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder={t('chat.inputPlaceholder')}
					disabled={isSending || isLoading}
					rows={3}
					aria-label={t('chat.inputLabel')}
				/>
				<VSCodeButton
					onClick={handleSendMessage}
					disabled={!inputValue.trim() || isSending || isLoading}
				>
					{isSending ? t('chat.sending') : t('chat.send')}
				</VSCodeButton>
			</div>
		</div>
	);
};

export default ChatView; 