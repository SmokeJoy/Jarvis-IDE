import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
	background: var(--vscode-button-background);
	color: var(--vscode-errorForeground);
	border: 1px solid var(--vscode-errorForeground);
	padding: 0.4rem 0.8rem;
	border-radius: 4px;
	cursor: pointer;
	transition: background 0.2s ease;

	&:hover {
		background: rgba(255, 0, 0, 0.1);
	}
`;

interface DangerButtonProps {
	onClick: () => void;
	children: React.ReactNode;
}

export const DangerButton: React.FC<DangerButtonProps> = ({ onClick, children }) => {
	return <Button onClick={onClick}>{children}</Button>;
};
