import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'
import "../../node_modules/@vscode/codicons/dist/codicon.css"
import { ExtensionStateProvider } from './context/ExtensionStateContext'
import { ThemeProvider } from 'styled-components'

// Carica i dati iniziali forniti dall'estensione
const initialData = (window as any).initialData || {};
const isDarkTheme = (window as any).isDarkTheme === true;

// Configura i temi
const themes = {
	light: {
		background: 'var(--vscode-editor-background)',
		foreground: 'var(--vscode-editor-foreground)',
		primary: 'var(--vscode-button-background)',
		primaryForeground: 'var(--vscode-button-foreground)',
		secondary: 'var(--vscode-button-secondaryBackground)',
		secondaryForeground: 'var(--vscode-button-secondaryForeground)',
		border: 'var(--vscode-panel-border)',
		inputBackground: 'var(--vscode-input-background)',
		inputForeground: 'var(--vscode-input-foreground)',
		inputBorder: 'var(--vscode-input-border)',
		errorForeground: 'var(--vscode-errorForeground)',
		errorBackground: 'var(--vscode-inputValidation-errorBackground)',
		warningForeground: 'var(--vscode-editorWarning-foreground)',
		descriptionForeground: 'var(--vscode-descriptionForeground)',
		focusBorder: 'var(--vscode-focusBorder)',
		link: 'var(--vscode-textLink-foreground)',
		linkActive: 'var(--vscode-textLink-activeForeground)',
	},
	dark: {
		background: 'var(--vscode-editor-background)',
		foreground: 'var(--vscode-editor-foreground)',
		primary: 'var(--vscode-button-background)',
		primaryForeground: 'var(--vscode-button-foreground)',
		secondary: 'var(--vscode-button-secondaryBackground)',
		secondaryForeground: 'var(--vscode-button-secondaryForeground)',
		border: 'var(--vscode-panel-border)',
		inputBackground: 'var(--vscode-input-background)',
		inputForeground: 'var(--vscode-input-foreground)',
		inputBorder: 'var(--vscode-input-border)',
		errorForeground: 'var(--vscode-errorForeground)',
		errorBackground: 'var(--vscode-inputValidation-errorBackground)',
		warningForeground: 'var(--vscode-editorWarning-foreground)',
		descriptionForeground: 'var(--vscode-descriptionForeground)',
		focusBorder: 'var(--vscode-focusBorder)',
		link: 'var(--vscode-textLink-foreground)',
		linkActive: 'var(--vscode-textLink-activeForeground)',
	}
};

// Seleziona il tema in base all'impostazione di VS Code
const currentTheme = isDarkTheme ? themes.dark : themes.light;

// Configurazione iniziale dell'applicazione
console.log('Initializing Jarvis IDE WebView UI');
console.log('Theme:', isDarkTheme ? 'dark' : 'light');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<ThemeProvider theme={currentTheme}>
			<ExtensionStateProvider>
				<App />
			</ExtensionStateProvider>
		</ThemeProvider>
	</React.StrictMode>,
)
