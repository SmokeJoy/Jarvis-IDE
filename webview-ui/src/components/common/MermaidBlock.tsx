import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import styled from 'styled-components';

const Container = styled.div`
	margin: 1rem 0;
	padding: 1rem;
	background-color: var(--vscode-editor-background);
	border-radius: 4px;
	overflow-x: auto;
`;

interface MermaidBlockProps {
	code: string;
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ code }) => {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		mermaid.initialize({
			startOnLoad: true,
			theme: 'dark',
			securityLevel: 'loose',
			themeVariables: {
				fontFamily: 'var(--vscode-font-family)',
				fontSize: '14px',
				primaryColor: 'var(--vscode-button-background)',
				primaryTextColor: 'var(--vscode-button-foreground)',
				primaryBorderColor: 'var(--vscode-button-border)',
				lineColor: 'var(--vscode-editor-foreground)',
				secondaryColor: 'var(--vscode-editor-selection-background)',
				tertiaryColor: 'var(--vscode-editor-inactiveSelection-background)',
			}
		});

		const renderDiagram = async () => {
			try {
				await mermaid.render('mermaid-diagram', code).then(({ svg }) => {
					if (containerRef.current) {
						containerRef.current.innerHTML = svg;
					}
				});
			} catch (error) {
				console.error('Errore nel rendering del diagramma Mermaid:', error);
			}
		};

		renderDiagram();
	}, [code]);

	return <Container ref={containerRef} />;
};
