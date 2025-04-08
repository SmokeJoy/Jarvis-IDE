import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
	background-color: var(--vscode-button-background);
	color: var(--vscode-button-foreground);
	border: 1px solid var(--vscode-button-border);
	padding: 0.5rem 1rem;
	border-radius: 4px;
	cursor: pointer;
	font-family: var(--vscode-font-family);
	font-size: 14px;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: var(--vscode-button-hoverBackground);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

interface SuccessButtonProps {
	onClick: () => void;
	disabled?: boolean;
	children: React.ReactNode;
}

export const SuccessButton: React.FC<SuccessButtonProps> = ({
	onClick,
	disabled = false,
	children
}) => {
	return (
		<Button onClick={onClick} disabled={disabled}>
			{children}
		</Button>
	);
};
