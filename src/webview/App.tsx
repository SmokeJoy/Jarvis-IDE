import React, { useEffect, useState } from 'react';
import { SettingsPage } from './pages/SettingsPage';
import { isDarkTheme } from './vscode';

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // Rileva il tema da VS Code
    setDarkMode(isDarkTheme());

    // Aggiorna le classi del tema
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.classList.toggle('light', !darkMode);
  }, [darkMode]);

  return (
    <div
      className={`min-h-screen w-full ${darkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-slate-900'}`}
    >
      <SettingsPage />
    </div>
  );
};
