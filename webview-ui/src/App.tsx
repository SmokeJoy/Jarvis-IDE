import React, { useState, useEffect } from 'react';
import { SettingsView } from '@/components/settings/SettingsView';
import { ChatView } from '@/components/ChatView'; // Assumendo che esista
// import { isDarkTheme } from '@/utils/vscode'; // Da verificare/aggiornare

export function App() {
	// const [darkMode, setDarkMode] = useState(true); // Logica tema da rivedere
	const [view, setView] = useState<'chat' | 'settings'>('chat');

	// useEffect(() => {
	//   // Rileva il tema da VS Code
	//   // setDarkMode(isDarkTheme());
	//
	//   // Aggiorna le classi del tema
	//   // document.documentElement.classList.toggle('dark', darkMode);
	//   // document.documentElement.classList.toggle('light', !darkMode);
	// }, [darkMode]);

	return (
		<div /* className="theme-classes-here" */>
			<nav>
				<button onClick={() => setView('chat')}>Chat</button>
				<button onClick={() => setView('settings')}>Settings</button>
			</nav>
			<hr />
			{view === 'chat' && <ChatView />}
			{view === 'settings' && <SettingsView />}
		</div>
	);
}
