import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { t, setLanguage, getWebviewLanguage, translate } from '../i18n';

// Usiamo vi.mock per sostituire window.navigator
let mockedNavigatorLanguage = 'en-US';

vi.mock('@testing-library/react', async () => {
  const actual = await vi.importActual('@testing-library/react');
  return {
    ...actual
  };
});

// Mock per navigator (specifico per JSDOM)
Object.defineProperty(window, 'navigator', {
  value: {
    ...window.navigator,
    get language() {
      return mockedNavigatorLanguage;
    }
  },
  writable: true,
  configurable: true
});

// Crea un mock per localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      return Object.keys(store)[index] || null;
    }),
    length: 0
  };
};

describe('Sistema i18n', () => {
  let originalLocalStorage: Storage;
  let mockLocalStorage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    // Reset della lingua mock a default
    mockedNavigatorLanguage = 'en-US';
    
    // Salva l'oggetto localStorage originale
    originalLocalStorage = window.localStorage;
    
    // Crea e configura il mock di localStorage
    mockLocalStorage = createLocalStorageMock();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  afterEach(() => {
    // Ripristina l'oggetto localStorage originale
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
    
    // Reset dei mock
    vi.restoreAllMocks();
  });

  it('dovrebbe inizializzare con la lingua predefinita', () => {
    // Setup: assicurati che non ci sia lingua salvata
    mockLocalStorage.getItem.mockReturnValueOnce(null);
    
    // Test: getWebviewLanguage verificherà in ordine: vscode.env, localStorage, navigator.language
    const lang = getWebviewLanguage();
    
    // Verifica che sia stata utilizzata la lingua predefinita (inglese)
    expect(lang).toBe('en');
  });

  it('dovrebbe utilizzare la lingua salvata in localStorage se disponibile', () => {
    // Setup: simula una lingua salvata
    mockLocalStorage.getItem.mockReturnValueOnce('it');
    
    // Test
    const lang = getWebviewLanguage();
    
    // Verifica che sia stata utilizzata la lingua salvata
    expect(lang).toBe('it');
  });

  it('dovrebbe rilevare correttamente la lingua del browser', () => {
    // Setup: simula diverse lingue del browser
    mockLocalStorage.getItem.mockReturnValue(null); // Nessuna lingua in localStorage
    
    mockedNavigatorLanguage = 'it-IT';
    expect(getWebviewLanguage()).toBe('it');
    
    // Nota: non testiamo lingue come ES o FR perché il codice reale
    // non fa controlli specifici, semplicemente prende i primi due caratteri
  });

  it('dovrebbe cambiare lingua correttamente', () => {
    // Test
    setLanguage('it');
    
    // Verifica
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('jarvis-ide-language', 'it');
  });

  it('dovrebbe tradurre correttamente le chiavi', () => {
    // Setup
    setLanguage('en');
    
    // Test con chiave semplice
    expect(t('common.submit')).toBe('Submit');
    
    // Cambio lingua
    setLanguage('it');
    
    // Verifica traduzione nella nuova lingua
    expect(t('common.submit')).toBe('Invia');
  });

  it('dovrebbe gestire le chiavi nidificate', () => {
    // Setup
    setLanguage('en');
    
    // Test con chiave nidificata
    expect(t('sidebar.title')).toBe('Navigation');
    
    // Cambio lingua
    setLanguage('it');
    
    // Verifica traduzione nella nuova lingua
    expect(t('sidebar.title')).toBe('Navigazione');
  });

  it('dovrebbe restituire la chiave se manca la traduzione', () => {
    // Test con una chiave che non esiste nelle traduzioni
    const chiaveInesistente = 'chiave.che.non.esiste';
    expect(t(chiaveInesistente)).toBe(chiaveInesistente);
  });

  it('dovrebbe gestire i parametri nelle traduzioni', () => {
    // Setup
    setLanguage('en');
    
    // Test con parametri
    expect(t('messages.welcome', { name: 'John' })).toBe('Welcome, John!');
    
    // Cambio lingua
    setLanguage('it');
    
    // Verifica traduzione con parametri nella nuova lingua
    expect(t('messages.welcome', { name: 'John' })).toBe('Benvenuto, John!');
  });
}); 

