import React from 'react'
import ReactMarkdown from 'react-markdown'
import { VSCodeLink } from '@vscode/webview-ui-toolkit/react'
import { OpenAiCompatibleModelInfo } from '../../../../src/shared/types'
import styled from 'styled-components'

const StyledMarkdown = styled.div`
	font-size: 13px;
	line-height: 1.4;
	color: var(--vscode-foreground);
	margin-bottom: 16px;
`

interface ModelDescriptionMarkdownProps {
	modelInfo: OpenAiCompatibleModelInfo
	isExpanded: boolean
	setIsExpanded: (expanded: boolean) => void
}

export function ModelDescriptionMarkdown({ modelInfo, isExpanded, setIsExpanded }: ModelDescriptionMarkdownProps) {
	const toggleExpanded = () => setIsExpanded(!isExpanded)

	const description = `
**Model**: ${modelInfo.name}
**Provider**: ${modelInfo.provider}
**Context Length**: ${modelInfo.context_length}
**Max Tokens**: ${modelInfo.maxTokens}
${modelInfo.description ? `\n${modelInfo.description}` : ''}
	`.trim()

	return (
		<StyledMarkdown>
			<div style={{ 
				maxHeight: isExpanded ? 'none' : '100px',
				overflow: 'hidden',
				position: 'relative'
			}}>
				<ReactMarkdown>{description}</ReactMarkdown>
				
				{!isExpanded && (
					<div style={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
						height: '50px',
						background: 'linear-gradient(transparent, var(--vscode-editor-background))'
					}} />
				)}
			</div>

			<VSCodeLink onClick={toggleExpanded}>
				{isExpanded ? 'Show Less' : 'Show More'}
			</VSCodeLink>
		</StyledMarkdown>
	)
}

export default ModelDescriptionMarkdown
