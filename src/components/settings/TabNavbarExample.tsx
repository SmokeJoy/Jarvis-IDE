import React, { useState } from 'react'
import { TabNavbar } from './TabNavbar.js'
import type { TabId, TabItem } from '../../types/tab.js'

const tabs: TabItem[] = [
  {
    id: 'tab1',
    label: 'Tab 1',
    badge: { count: 1, type: 'info' }
  },
  {
    id: 'tab2',
    label: 'Tab 2',
    badge: { count: 2, type: 'warning' }
  },
  {
    id: 'tab3',
    label: 'Tab 3',
    badge: { count: 3, type: 'error' }
  }
]

export const TabNavbarExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('tab1')

  return (
    <TabNavbar
      tabs={tabs}
      activeTab={activeTab}
      onTabClick={setActiveTab}
    />
  )
} 