import React, { useState, useCallback } from 'react';
import { VSCodeButton, VSCodeDropdown, VSCodeOption, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import styled from 'styled-components';
import { ChatMessage } from '../../../src/shared/types';
import { ExportButton } from '../common/ExportButton';
import { DangerButton } from '../common/DangerButton';

interface HistoryViewProps {
	history: ChatMessage[];
	onDelete: (ids: string[]) => void;
	onExport: (id: string) => void;
	onSelect: (id: string) => void;
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 1rem;
	gap: 1rem;
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
`;

const Controls = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const SearchBar = styled(VSCodeTextField)`
	width: 100%;
	margin-bottom: 1rem;
`;

const List = styled.div`
	flex: 1;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Item = styled.div<{ selected: boolean }>`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem;
	border-radius: 4px;
	background: ${props => props.selected ? 'var(--vscode-list-activeSelectionBackground)' : 'var(--vscode-list-background)'};
	color: ${props => props.selected ? 'var(--vscode-list-activeSelectionForeground)' : 'var(--vscode-list-foreground)'};
	cursor: pointer;
	transition: background 0.2s ease;

	&:hover {
		background: var(--vscode-list-hoverBackground);
	}
`;

const ItemContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const ItemTitle = styled.span`
	font-weight: bold;
`;

const ItemDate = styled.span`
	font-size: 0.8em;
	color: var(--vscode-descriptionForeground);
`;

const formatDate = (timestamp: number) => {
	const date = new Date(timestamp);
	return date.toLocaleDateString('it-IT', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
};

export const HistoryView: React.FC<HistoryViewProps> = ({
	history,
	onDelete,
	onExport,
	onSelect
}) => {
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState<'date' | 'title'>('date');

	const handleSearch = useCallback((event: React.FormEvent<HTMLInputElement>) => {
		setSearchQuery(event.currentTarget.value);
	}, []);

	const handleSortChange = useCallback((event: Event) => {
		const selectEvent = event as unknown as React.FormEvent<HTMLSelectElement>;
		setSortBy(selectEvent.currentTarget.value as 'date' | 'title');
	}, []);

	const handleItemClick = useCallback((id: string) => {
		setSelectedItems(prev => 
			prev.includes(id) 
				? prev.filter(item => item !== id)
				: [...prev, id]
		);
	}, []);

	const handleDelete = useCallback(() => {
		onDelete(selectedItems);
		setSelectedItems([]);
	}, [selectedItems, onDelete]);

	const filteredHistory = history
		.filter(item => 
			item.content.toLowerCase().includes(searchQuery.toLowerCase())
		)
		.sort((a, b) => {
			if (sortBy === 'date') {
				return b.timestamp - a.timestamp;
			}
			return a.content.localeCompare(b.content);
		});

	return (
		<Container>
			<Header>
				<Controls>
					<VSCodeDropdown value={sortBy} onChange={handleSortChange}>
						<VSCodeOption value="date">Data</VSCodeOption>
						<VSCodeOption value="title">Titolo</VSCodeOption>
					</VSCodeDropdown>
					{selectedItems.length > 0 && (
						<DangerButton onClick={handleDelete}>
							Elimina ({selectedItems.length})
						</DangerButton>
					)}
				</Controls>
			</Header>

			<SearchBar
				placeholder="Cerca nella cronologia..."
				value={searchQuery}
				onChange={handleSearch}
			/>

			<List>
				{filteredHistory.map(item => (
					<Item
						key={item.id}
						selected={selectedItems.includes(item.id)}
						onClick={() => handleItemClick(item.id)}
					>
						<ItemContent>
							<ItemTitle>{item.content.substring(0, 100)}...</ItemTitle>
							<ItemDate>{formatDate(item.timestamp)}</ItemDate>
						</ItemContent>
						<Controls>
							<ExportButton
								itemId={item.id}
								onExport={onExport}
							/>
						</Controls>
					</Item>
				))}
			</List>
		</Container>
	);
};
