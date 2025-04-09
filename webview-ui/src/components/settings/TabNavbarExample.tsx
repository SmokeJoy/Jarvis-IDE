import React, { useState, useCallback } from 'react'
import { TabNavbar } from './TabNavbar'
import { TabId, TabItem } from '../../types/tab'
import styled from 'styled-components'

const TabContent = styled.div`
    padding: 16px;
    background: var(--vscode-editor-background);
    border-radius: 4px;
`

// Simula tab con contenuti dinamici e notifiche
const SETTINGS_TABS: TabItem[] = [
    {
        id: 'general',
        label: 'Generale',
        tooltip: 'Impostazioni generali dell\'applicazione'
    },
    {
        id: 'models',
        label: 'Modelli AI',
        badge: {
            count: 2,
            type: 'warning'
        },
        tooltip: 'Gestione modelli di intelligenza artificiale'
    },
    {
        id: 'files',
        label: 'File',
        badge: {
            count: 0,
            type: 'info'
        },
        tooltip: 'Gestione file e cartelle'
    },
    {
        id: 'advanced',
        label: 'Avanzate',
        tooltip: 'Configurazioni avanzate',
        disabled: true
    }
]

export const TabNavbarExample: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('general')

    const handleTabChange = useCallback((tabId: TabId) => {
        console.log(`Tab cambiato a: ${tabId}`)
        setActiveTab(tabId)
    }, [])

    const getTabContent = (tabId: TabId): string => {
        switch (tabId) {
            case 'general':
                return 'Configurazione generale dell\'applicazione'
            case 'models':
                return 'Gestione modelli AI - 2 aggiornamenti disponibili'
            case 'files':
                return 'Gestione file e percorsi di lavoro'
            case 'advanced':
                return 'Impostazioni avanzate (presto disponibile)'
            default:
                return 'Seleziona un tab'
        }
    }

    return (
        <div>
            <TabNavbar
                tabs={SETTINGS_TABS}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                ariaLabel="Navigazione impostazioni"
            />
            <TabContent role="tabpanel" id={`panel-${activeTab}`}>
                {getTabContent(activeTab)}
            </TabContent>
        </div>
    )
} 