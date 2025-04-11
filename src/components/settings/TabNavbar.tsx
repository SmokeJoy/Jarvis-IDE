import React from 'react';
import { TabItem, TabId } from '../../types/tab.js';

interface TabNavbarProps {
  tabs: TabItem[];
  activeTabId: TabId;
  onTabChange: (tabId: TabId) => void;
}

export const TabNavbar: React.FC<TabNavbarProps> = ({
  tabs,
  activeTabId,
  onTabChange,
}) => {
  return (
    <nav className="tab-navbar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {tab.badge && (
            <span className={`badge ${tab.badge.type}`}>
              {tab.badge.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}; 