import React, { useCallback } from 'react'
import { TabContainer, TabButton, TabBadge } from './TabNavbar.styles'
import { TabItem, TabId } from '../../types/tab'

interface TabNavbarProps {
	tabs: TabItem[]
	activeTab: TabId
	onTabChange: (tabId: TabId) => void
	ariaLabel?: string
}

export const TabNavbar: React.FC<TabNavbarProps> = React.memo(({ 
	tabs, 
	activeTab, 
	onTabChange,
	ariaLabel = 'Navigazione schede'
}) => {
	const handleTabClick = useCallback((tabId: TabId) => {
		onTabChange(tabId)
	}, [onTabChange])

	return (
		<TabContainer role="tablist" aria-label={ariaLabel}>
			{tabs.map((tab) => (
				<TabButton
					key={tab.id}
					onClick={() => handleTabClick(tab.id)}
					$isActive={activeTab === tab.id}
					disabled={tab.disabled}
					title={tab.tooltip}
					role="tab"
					aria-selected={activeTab === tab.id}
					aria-controls={`panel-${tab.id}`}
				>
					{tab.label}
					{tab.badge && tab.badge.count > 0 && (
						<TabBadge 
							$type={tab.badge.type}
							role="status"
							aria-label={`${tab.badge.count} notifiche`}
						>
							{tab.badge.count}
						</TabBadge>
					)}
				</TabButton>
			))}
		</TabContainer>
	)
})
