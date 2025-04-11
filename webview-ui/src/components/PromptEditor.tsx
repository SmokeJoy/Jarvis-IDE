/**
 * @file PromptEditor.tsx
 * @description Componente React per l'editor di prompt con supporto Markdown
 * @version 1.1.0
 * Implementa il pattern Union Dispatcher Type-Safe
 */

import React, { useCallback, useState, useEffect } from 'react';
import { VSCodeTextArea, VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react';
import { WebviewMessageType } from '../../../src/shared/types/webview.types';
import type { WebviewMessageUnion } from '../../../src/shared/types/webviewMessageUnion';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import { MarkdownPreview } from './MarkdownPreview';

/**
 * Interfaccia per i messaggi di info
 */
interface InfoMessage extends WebviewMessageUnion {
	type: 'info';
	timestamp: number;
	payload: {
		message: string;
		severity: 'info' | 'warning' | 'error';
	};
}

/**
 * Interfaccia per le richieste di aggiornamento del prompt
 */
interface PromptUpdateRequestMessage extends WebviewMessageUnion {
	type: 'promptUpdateRequest';
	payload: {
		promptId?: string;
	};
}

/**
 * Interfaccia per le notifiche di aggiornamento del prompt
 */
interface PromptUpdateNotificationMessage extends WebviewMessageUnion {
	type: 'promptUpdateNotification';
	payload: {
		content: string;
		promptId?: string;
	};
}

/**
 * Type guard per verificare se un messaggio è di tipo InfoMessage
 */
function isInfoMessage(message: any): message is InfoMessage {
	return message?.type === 'info' && 
		typeof message?.payload === 'object' && 
		message?.payload !== null &&
		'message' in message?.payload;
}

/**
 * Type guard per verificare se un messaggio è di tipo PromptUpdateRequestMessage
 */
function isPromptUpdateRequestMessage(message: any): message is PromptUpdateRequestMessage {
	return message?.type === 'promptUpdateRequest';
}

/**
 * Type guard per verificare se un messaggio è di tipo PromptUpdateNotificationMessage
 */
function isPromptUpdateNotificationMessage(message: any): message is PromptUpdateNotificationMessage {
	return message?.type === 'promptUpdateNotification' &&
		typeof message?.payload?.content === 'string';
}

/**
 * Proprietà del componente PromptEditor
 */
interface PromptEditorProps {
	initialValue?: string;
	onChange?: (value: string) => void;
	onBlur?: (value: string) => void;
	placeholder?: string;
	className?: string;
	promptId?: string;
}

/**
 * Componente PromptEditor
 * Editor di prompt con supporto per Markdown e comunicazione type-safe
 */
export const PromptEditor: React.FC<PromptEditorProps> = ({
	initialValue = '',
	onChange,
	onBlur,
	placeholder = 'Scrivi il tuo prompt...',
	className = '',
	promptId
}) => {
	const [value, setValue] = useState<string>(initialValue);
	const [showPreview, setShowPreview] = useState<boolean>(false);
	const { postMessage } = useExtensionMessage();

	/**
	 * Dispatcher di messaggi type-safe per gestire i messaggi in arrivo
	 */
	const messageDispatcher = useCallback((message: any) => {
		if (isPromptUpdateNotificationMessage(message)) {
			// Solo se l'ID del prompt corrisponde o se non è specificato
			if (!promptId || !message.payload.promptId || promptId === message.payload.promptId) {
				setValue(message.payload.content);
				if (onChange) {
					onChange(message.payload.content);
				}
			}
		} else if (isPromptUpdateRequestMessage(message)) {
			// Solo se l'ID del prompt corrisponde o se non è specificato
			if (!promptId || !message.payload.promptId || promptId === message.payload.promptId) {
				// Invia lo stato attuale del prompt
				const notificationMessage: PromptUpdateNotificationMessage = {
					type: 'promptUpdateNotification',
					payload: {
						content: value,
						promptId
					}
				};
				postMessage<WebviewMessageUnion>(notificationMessage);
			}
		}
	}, [value, promptId, onChange, postMessage]);

	// Inizializza e configura i listener
	useEffect(() => {
		// Configurazione del listener per i messaggi dall'estensione
		const handleMessage = (event: MessageEvent<any>) => {
			const message = event.data;
			messageDispatcher(message);
		};

		// Aggiungi event listener
		window.addEventListener('message', handleMessage);

		// Cleanup
		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, [messageDispatcher]);

	/**
	 * Gestisce il cambio di valore dell'editor
	 */
	const handleChange = useCallback((event: React.FormEvent<HTMLTextAreaElement>) => {
		const newValue = event.currentTarget.value;
		setValue(newValue);
		
		if (onChange) {
			onChange(newValue);
		}

		// Creazione di un messaggio di tipo info usando l'unione discriminata
		const infoMessage: InfoMessage = {
			type: 'info',
			timestamp: Date.now(),
			payload: {
				message: 'Prompt aggiornato',
				severity: 'info'
			}
		};
		
		// Utilizzo del postMessage type-safe
		postMessage<WebviewMessageUnion>(infoMessage);
	}, [onChange, postMessage]);

	/**
	 * Gestisce l'evento di blur dell'editor
	 */
	const handleBlur = useCallback((event: React.FocusEvent<HTMLTextAreaElement>) => {
		if (onBlur) {
			onBlur(event.currentTarget.value);
		}
		
		// Notifica l'aggiornamento del prompt
		const updateMessage: PromptUpdateNotificationMessage = {
			type: 'promptUpdateNotification',
			payload: {
				content: event.currentTarget.value,
				promptId
			}
		};
		
		postMessage<WebviewMessageUnion>(updateMessage);
	}, [onBlur, promptId, postMessage]);

	/**
	 * Gestisce il toggle dell'anteprima Markdown
	 */
	const togglePreview = useCallback(() => {
		setShowPreview(prev => !prev);
	}, []);

	return (
		<div className={`prompt-editor ${className}`}>
			<div className="editor-controls">
				<VSCodeCheckbox
					checked={showPreview}
					onChange={togglePreview}
				>
					Anteprima Markdown
				</VSCodeCheckbox>
			</div>
			{showPreview ? (
				<MarkdownPreview content={value} />
			) : (
				<VSCodeTextArea
					value={value}
					onChange={handleChange}
					onBlur={handleBlur}
					placeholder={placeholder}
					rows={10}
				/>
			)}
		</div>
	);
}; 