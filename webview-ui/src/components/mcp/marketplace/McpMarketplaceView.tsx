import React, { useEffect, useMemo, useState, useCallback } from "react"
import {
	VSCodeButton,
	VSCodeProgressRing,
	VSCodeRadioGroup,
	VSCodeRadio,
	VSCodeDropdown,
	VSCodeOption,
	VSCodeTextField,
	VSCodeInput,
} from "@vscode/webview-ui-toolkit/react"
import { McpMarketplaceItem } from "../../../../../src/shared/mcp"
import { useExtensionState } from "../../../context/ExtensionStateContext"
import { vscode } from "../../../utils/vscode"
import McpMarketplaceCard from "./McpMarketplaceCard"
import McpSubmitCard from "./McpSubmitCard"

interface McpMarketplaceViewProps {
	onSearch: (query: string) => void;
	onCategoryChange: (category: string) => void;
	onSortChange: (sort: string) => void;
}

export const McpMarketplaceView: React.FC<McpMarketplaceViewProps> = ({
	onSearch,
	onCategoryChange,
	onSortChange
}) => {
	const { mcpServers } = useExtensionState()
	const [items, setItems] = useState<McpMarketplaceItem[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [searchQuery, setSearchQuery] = useState<string>("")
	const [selectedCategory, setSelectedCategory] = useState<string>("all")
	const [sortOption, setSortOption] = useState<string>("popular")

	const categories = useMemo(() => {
		const uniqueCategories = new Set(items.map((item) => item.category))
		return Array.from(uniqueCategories).sort()
	}, [items])

	const filteredItems = useMemo(() => {
		return items
			.filter((item) => {
				const matchesSearch =
					searchQuery === "" ||
					item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
				const matchesCategory = !selectedCategory || item.category === selectedCategory
				return matchesSearch && matchesCategory
			})
			.sort((a, b) => {
				switch (sortOption) {
					case "stars":
						return b.githubStars - a.githubStars
					case "name":
						return a.name.localeCompare(b.name)
					case "newest":
						return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					default:
						return 0
				}
			})
	}, [items, searchQuery, selectedCategory, sortOption])

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data
			if (message.type === "mcpMarketplaceCatalog") {
				if (message.error) {
					setError(message.error)
				} else {
					setItems(message.mcpMarketplaceCatalog?.items || [])
					setError(null)
				}
				setIsLoading(false)
				setIsRefreshing(false)
			} else if (message.type === "mcpDownloadDetails") {
				if (message.error) {
					setError(message.error)
				}
			}
		}

		window.addEventListener("message", handleMessage)

		// Fetch marketplace catalog
		fetchMarketplace()

		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [])

	const fetchMarketplace = (forceRefresh: boolean = false) => {
		if (forceRefresh) {
			setIsRefreshing(true)
		} else {
			setIsLoading(true)
		}
		setError(null)
		vscode.postMessage({ type: "fetchMcpMarketplace", bool: forceRefresh })
	}

	const handleSearchChange = useCallback((event: React.FormEvent<HTMLInputElement>) => {
		const target = event.target as HTMLInputElement
		setSearchQuery(target.value)
		onSearch(target.value)
	}, [onSearch])

	const handleCategoryChange = useCallback((event: React.FormEvent<HTMLSelectElement>) => {
		const target = event.target as HTMLSelectElement
		setSelectedCategory(target.value)
		onCategoryChange(target.value)
	}, [onCategoryChange])

	const handleSortChange = useCallback((event: React.FormEvent<HTMLSelectElement>) => {
		const target = event.target as HTMLSelectElement
		setSortOption(target.value)
		onSortChange(target.value)
	}, [onSortChange])

	if (isLoading || isRefreshing) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100%",
					padding: "20px",
				}}>
				<VSCodeProgressRing />
			</div>
		)
	}

	if (error) {
		return (
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					height: "100%",
					padding: "20px",
					gap: "12px",
				}}>
				<div style={{ color: "var(--vscode-errorForeground)" }}>{error}</div>
				<VSCodeButton appearance="secondary" onClick={() => fetchMarketplace(true)}>
					<span className="codicon codicon-refresh" style={{ marginRight: "6px" }} />
					Retry
				</VSCodeButton>
			</div>
		)
	}

	return (
		<div className="mcp-marketplace-view">
			<div className="search-section">
				<VSCodeInput
					value={searchQuery}
					onChange={handleSearchChange}
					placeholder="Cerca strumenti..."
				/>
			</div>
			<div className="filters-section">
				<VSCodeDropdown value={selectedCategory} onChange={handleCategoryChange}>
					<VSCodeOption value="all">Tutte le categorie</VSCodeOption>
					<VSCodeOption value="code">Codice</VSCodeOption>
					<VSCodeOption value="testing">Testing</VSCodeOption>
					<VSCodeOption value="deployment">Deployment</VSCodeOption>
				</VSCodeDropdown>
				<VSCodeDropdown value={sortOption} onChange={handleSortChange}>
					<VSCodeOption value="popular">Più popolari</VSCodeOption>
					<VSCodeOption value="newest">Più recenti</VSCodeOption>
					<VSCodeOption value="rating">Miglior valutati</VSCodeOption>
				</VSCodeDropdown>
			</div>
			<style>
				{`
				.mcp-search-input,
				.mcp-select {
				box-sizing: border-box;
				}
				.mcp-search-input {
				min-width: 140px;
				}
				.mcp-search-input:focus,
				.mcp-select:focus {
				border-color: var(--vscode-focusBorder) !important;
				}
				.mcp-search-input:hover,
				.mcp-select:hover {
				opacity: 0.9;
				}
			`}
			</style>
			<div style={{ display: "flex", flexDirection: "column" }}>
				{filteredItems.length === 0 ? (
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
							padding: "20px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						{searchQuery || selectedCategory
							? "No matching MCP servers found"
							: "No MCP servers found in the marketplace"}
					</div>
				) : (
					filteredItems.map((item) => <McpMarketplaceCard key={item.mcpId} item={item} installedServers={mcpServers} />)
				)}
				<McpSubmitCard />
			</div>
		</div>
	)
}

export default McpMarketplaceView
