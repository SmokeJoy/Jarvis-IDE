import React, { useState, useRef, useEffect } from 'react';
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import styled from "styled-components"
import { ApiConfiguration } from "../../types/extension"
import { vscode } from "../../utils/vscode"

interface ChatTextAreaProps {
	inputValue: string;
	setInputValue: (value: string) => void;
	selectedImages: string[];
	setSelectedImages: (images: string[]) => void;
	isWaiting: boolean;
	onHeightChange: (height: number) => void;
	onSubmit: (text: string, images: string[]) => void;
}

export const ChatTextArea: React.FC<ChatTextAreaProps> = ({
	inputValue,
	setInputValue,
	selectedImages,
	setSelectedImages,
	isWaiting,
	onHeightChange,
	onSubmit
}) => {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (textareaRef.current) {
			const height = textareaRef.current.scrollHeight;
			onHeightChange(height);
		}
	}, [inputValue, onHeightChange]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputValue.trim() || isWaiting) return;
		onSubmit(inputValue, selectedImages);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<Container>
			<TextArea
				ref={textareaRef}
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Scrivi un messaggio..."
				disabled={isWaiting}
			/>
			<VSCodeButton
				onClick={handleSubmit}
				disabled={isWaiting || !inputValue.trim()}
			>
				Invia
			</VSCodeButton>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	gap: 8px;
	padding: 8px;
	background-color: var(--vscode-editor-background);
	border-top: 1px solid var(--vscode-editor-lineHighlightBorder);
`

const TextArea = styled.textarea`
	flex: 1;
	min-height: 36px;
	max-height: 200px;
	padding: 8px;
	background-color: var(--vscode-input-background);
	color: var(--vscode-input-foreground);
	border: 1px solid var(--vscode-input-border);
	border-radius: 2px;
	resize: vertical;
	font-family: var(--vscode-font-family);
	font-size: var(--vscode-font-size);
	line-height: 1.4;
	
	&:focus {
		outline: none;
		border-color: var(--vscode-focusBorder);
	}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`
