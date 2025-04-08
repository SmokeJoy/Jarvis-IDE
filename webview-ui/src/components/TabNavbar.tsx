import React from 'react'
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import { useExtensionState } from '../context/ExtensionStateContext'

export const TabNavbar: React.FC = () => {
  const { chatSettings } = useExtensionState()

  const handleTabClick = (tab: string) => {
    if (tab === chatSettings.mode) {
      return
    }

    chatSettings.setAutoApprove(false)
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem' }}>
      <VSCodeButton
        appearance={chatSettings.mode === 'plan' ? 'primary' : 'secondary'}
        onClick={() => handleTabClick('plan')}
      >
        Plan
      </VSCodeButton>
      <VSCodeButton
        appearance={chatSettings.mode === 'act' ? 'primary' : 'secondary'}
        onClick={() => handleTabClick('act')}
      >
        Act
      </VSCodeButton>
    </div>
  )
} 