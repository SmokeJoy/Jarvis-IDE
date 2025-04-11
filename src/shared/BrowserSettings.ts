/**
 * @file BrowserSettings.ts
 * @description Tipi e funzioni per le impostazioni del browser
 */

import type { BrowserSettings } from './types/user-settings.types.js';

// Esporta i tipi usando export type per evitare errori TS1205
export type { BrowserSettings };

/**
 * Normalizza le impostazioni del browser
 * @param settings Le impostazioni da normalizzare
 * @returns Le impostazioni del browser normalizzate
 */
export function normalizeBrowserSettings(settings?: Partial<BrowserSettings>): BrowserSettings {
	return {
		debugMode: settings?.debugMode ?? false,
		timeout: settings?.timeout ?? 30000,
		width: settings?.width ?? 1280,
		height: settings?.height ?? 800,
		trackNetworkActivity: settings?.trackNetworkActivity ?? true,
		screenshotSettings: {
			format: settings?.screenshotSettings?.format ?? 'png',
			quality: settings?.screenshotSettings?.quality ?? 80,
			fullPage: settings?.screenshotSettings?.fullPage ?? false,
		}
	};
}

// Per retrocompatibilità, mantengo la costante DEFAULT_BROWSER_SETTINGS
export const DEFAULT_BROWSER_SETTINGS: BrowserSettings = normalizeBrowserSettings();

// Presets per retrocompatibilità
export const BROWSER_VIEWPORT_PRESETS = {
	"Large Desktop (1280x800)": { width: 1280, height: 800 },
	"Small Desktop (900x600)": { width: 900, height: 600 },
	"Tablet (768x1024)": { width: 768, height: 1024 },
	"Mobile (360x640)": { width: 360, height: 640 },
} as const;
