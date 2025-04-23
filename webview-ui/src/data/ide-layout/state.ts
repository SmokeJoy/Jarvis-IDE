/**
 * @file state.ts
 * @description Gestione dello stato del layout IDE
 * @author dev ai 1
 */

import { reactive } from 'vue';
import logger from '@shared/utils/outputLogger';

// Logger specifico per questo componente
const componentLogger = logger.createComponentLogger('IdeLayoutState');

export interface IdeLayoutState {
  // Configurazione pannelli
  panels: {
    sidebar: {
      visible: boolean;
      width: number;
    };
    editor: {
      visible: boolean;
      activeFile: string | null;
    };
    terminal: {
      visible: boolean;
      height: number;
    };
  };
  
  // Tema e visualizzazione
  theme: 'light' | 'dark';
  fontSize: number;
  
  // Stato finestra
  isFullscreen: boolean;
  windowSize: {
    width: number;
    height: number;
  };
}

// Stato iniziale
export const INITIAL_STATE: Readonly<IdeLayoutState> = {
  panels: {
    sidebar: {
      visible: true,
      width: 300
    },
    editor: {
      visible: true,
      activeFile: null
    },
    terminal: {
      visible: true,
      height: 200
    }
  },
  theme: 'dark',
  fontSize: 14,
  isFullscreen: false,
  windowSize: {
    width: 1024,
    height: 768
  }
} as const;

// Singleton per la gestione dello stato
class IdeLayoutManager {
  private static instance: IdeLayoutManager;
  private state = reactive<IdeLayoutState>({ ...INITIAL_STATE });
  private listeners = new Set<(state: IdeLayoutState) => void>();

  private constructor() {}

  public static getInstance(): IdeLayoutManager {
    if (!IdeLayoutManager.instance) {
      IdeLayoutManager.instance = new IdeLayoutManager();
    }
    return IdeLayoutManager.instance;
  }

  // Getters
  public getState(): Readonly<IdeLayoutState> {
    return { ...this.state };
  }

  // Panel visibility
  public toggleSidebar(visible?: boolean): void {
    this.state.panels.sidebar.visible = visible ?? !this.state.panels.sidebar.visible;
    componentLogger.debug('Visibilità sidebar modificata:', { visible: this.state.panels.sidebar.visible });
    this.notifyListeners();
  }

  public toggleTerminal(visible?: boolean): void {
    this.state.panels.terminal.visible = visible ?? !this.state.panels.terminal.visible;
    componentLogger.debug('Visibilità terminale modificata:', { visible: this.state.panels.terminal.visible });
    this.notifyListeners();
  }

  // Panel dimensions
  public setSidebarWidth(width: number): void {
    this.state.panels.sidebar.width = Math.max(100, Math.min(800, width));
    componentLogger.debug('Larghezza sidebar modificata:', { width: this.state.panels.sidebar.width });
    this.notifyListeners();
  }

  public setTerminalHeight(height: number): void {
    this.state.panels.terminal.height = Math.max(100, Math.min(500, height));
    componentLogger.debug('Altezza terminale modificata:', { height: this.state.panels.terminal.height });
    this.notifyListeners();
  }

  // Editor state
  public setActiveFile(filePath: string | null): void {
    this.state.panels.editor.activeFile = filePath;
    componentLogger.debug('File attivo modificato:', { filePath });
    this.notifyListeners();
  }

  // Theme & display
  public setTheme(theme: 'light' | 'dark'): void {
    this.state.theme = theme;
    componentLogger.debug('Tema modificato:', { theme });
    this.notifyListeners();
  }

  public setFontSize(size: number): void {
    this.state.fontSize = Math.max(8, Math.min(32, size));
    componentLogger.debug('Dimensione font modificata:', { size: this.state.fontSize });
    this.notifyListeners();
  }

  // Window state
  public toggleFullscreen(): void {
    this.state.isFullscreen = !this.state.isFullscreen;
    componentLogger.debug('Stato fullscreen modificato:', { isFullscreen: this.state.isFullscreen });
    this.notifyListeners();
  }

  public setWindowSize(width: number, height: number): void {
    this.state.windowSize = { width, height };
    componentLogger.debug('Dimensioni finestra modificate:', { width, height });
    this.notifyListeners();
  }

  // Reset
  public reset(): void {
    Object.assign(this.state, INITIAL_STATE);
    componentLogger.info('Stato resettato');
    this.notifyListeners();
  }

  // Subscription management
  public subscribe(listener: (state: IdeLayoutState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => listener(currentState));
  }
}

// Esporta l'istanza singleton
export const ideLayoutManager = IdeLayoutManager.getInstance(); 
 