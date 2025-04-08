import * as fs from 'fs';
import * as path from 'path';

export interface Theme {
  name: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    border: string;
    hover: string;
    codeBackground: string;
    codeForeground: string;
    success: string;
    error: string;
    warning: string;
    info: string;
  };
}

export const themes: Record<string, Theme> = {
  dark: {
    name: 'Dark',
    colors: {
      background: '#1e1e1e',
      foreground: '#eee',
      primary: '#007acc',
      secondary: '#2b2b2b',
      border: '#444',
      hover: '#3c3c3c',
      codeBackground: '#1e1e1e',
      codeForeground: '#d4d4d4',
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196f3'
    }
  },
  light: {
    name: 'Light',
    colors: {
      background: '#ffffff',
      foreground: '#333',
      primary: '#007acc',
      secondary: '#f5f5f5',
      border: '#ddd',
      hover: '#e0e0e0',
      codeBackground: '#f5f5f5',
      codeForeground: '#333',
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196f3'
    }
  }
};

export class ThemeManager {
  private configPath: string;
  private currentTheme: string;

  constructor() {
    this.configPath = path.join(__dirname, '../../config/config.json');
    this.currentTheme = this.loadTheme();
  }

  private loadTheme(): string {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        return config.theme || 'dark';
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento del tema:', error);
    }
    return 'dark';
  }

  public getCurrentTheme(): string {
    return this.currentTheme;
  }

  public setTheme(themeName: string): boolean {
    if (themes[themeName]) {
      this.currentTheme = themeName;
      this.saveTheme();
      return true;
    }
    return false;
  }

  private saveTheme(): void {
    try {
      let config = {};
      if (fs.existsSync(this.configPath)) {
        config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      }
      config = { ...config, theme: this.currentTheme };
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('❌ Errore nel salvataggio del tema:', error);
    }
  }

  public getThemeColors(): Theme['colors'] {
    return themes[this.currentTheme].colors;
  }

  public getAvailableThemes(): string[] {
    return Object.keys(themes);
  }
} 