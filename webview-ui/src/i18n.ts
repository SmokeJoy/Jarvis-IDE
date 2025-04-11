/**
 * Sistema di localizzazione semplificato per WebView
 */

// Tipo per le chiavi di traduzione
type TranslationKey = string;

// Interfaccia per le opzioni di traduzione
interface TranslationOptions {
  [key: string]: string | number | boolean;
}

// Interfaccia per un dizionario di traduzioni
interface TranslationDictionary {
  [key: string]: string;
}

// Interfaccia per un oggetto lingua
interface Language {
  code: string;
  name: string;
}

// Dizionario delle traduzioni per l'italiano
const italianTranslations: TranslationDictionary = {
  // Messaggi comuni
  'common.submit': 'Invia',
  'common.dismiss': 'Chiudi',
  'common.loading': 'Caricamento...',
  'common.error': 'Errore',
  'common.success': 'Operazione completata',
  
  // UI della chat
  'chat.title': 'Chat con Jarvis IDE',
  'chat.user': 'Tu',
  'chat.assistant': 'Assistente',
  'chat.send': 'Invia',
  'chat.sending': 'Invio...',
  'chat.clear': 'Pulisci chat',
  'chat.empty': 'Nessun messaggio. Inizia la conversazione!',
  'chat.thinking': 'Jarvis sta pensando...',
  'chat.inputPlaceholder': 'Scrivi un messaggio...',
  'chat.inputLabel': 'Campo di testo per messaggio',
  
  // Messaggi di errore
  'errors.unknown': 'Errore sconosciuto',
  'errors.sendFailed': 'Impossibile inviare il messaggio',
  'errors.clearFailed': 'Impossibile cancellare la cronologia',
  'errors.loadFailed': 'Impossibile caricare i messaggi',
  'errors.connectionLost': 'Connessione con l\'estensione persa',
  
  // Impostazioni
  'settings.title': 'Impostazioni',
  'settings.language': 'Lingua',
  'settings.theme': 'Tema',
  'settings.model': 'Modello AI',
  'settings.save': 'Salva',
  'settings.cancel': 'Annulla',
  
  // Navigazione
  'sidebar.title': 'Navigazione',
  
  // Messaggi
  'messages.welcome': 'Benvenuto, {{name}}!'
};

// Dizionario delle traduzioni per l'inglese
const englishTranslations: TranslationDictionary = {
  // Common messages
  'common.submit': 'Submit',
  'common.dismiss': 'Dismiss',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Operation completed',
  
  // Chat UI
  'chat.title': 'Chat with Jarvis IDE',
  'chat.user': 'You',
  'chat.assistant': 'Assistant',
  'chat.send': 'Send',
  'chat.sending': 'Sending...',
  'chat.clear': 'Clear chat',
  'chat.empty': 'No messages. Start the conversation!',
  'chat.thinking': 'Jarvis is thinking...',
  'chat.inputPlaceholder': 'Type a message...',
  'chat.inputLabel': 'Message text field',
  
  // Error messages
  'errors.unknown': 'Unknown error',
  'errors.sendFailed': 'Could not send message',
  'errors.clearFailed': 'Could not clear history',
  'errors.loadFailed': 'Could not load messages',
  'errors.connectionLost': 'Connection to extension lost',
  
  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.model': 'AI Model',
  'settings.save': 'Save',
  'settings.cancel': 'Cancel',
  
  // Navigation
  'sidebar.title': 'Navigation',
  
  // Messages
  'messages.welcome': 'Welcome, {{name}}!'
};

// Dizionario delle lingue supportate
const languages: Record<string, TranslationDictionary> = {
  'it': italianTranslations,
  'en': englishTranslations
};

// Lingua predefinita
let currentLanguage: string = 'en';

// Array delle lingue disponibili
export const availableLanguages: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'it', name: 'Italiano' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' }
];

/**
 * Rileva la lingua preferita dell'utente dal browser
 * @returns Codice della lingua rilevata o 'en' come fallback
 */
export function detectLanguage(): string {
  try {
    const browserLang = navigator.language.substring(0, 2).toLowerCase();
    
    // Verifica se la lingua del browser è tra quelle supportate
    if (Object.keys(languages).includes(browserLang)) {
      return browserLang;
    }
    
    // Fallback sulla lingua predefinita
    return 'en';
  } catch (e) {
    console.warn('Errore durante il rilevamento della lingua:', e);
    return 'en';
  }
}

/**
 * Ottiene la lingua corrente
 * @returns La lingua corrente (codice ISO)
 */
export function getLanguage(): string {
  return currentLanguage;
}

/**
 * Ottiene la lingua corrente dal VS Code
 * @returns La lingua corrente (codice ISO)
 */
export function getWebviewLanguage(): string {
  try {
    // Tenta di ottenere la lingua dall'API VS Code
    const vscode = (window as any).vscode;
    if (vscode && vscode.env && vscode.env.language) {
      return vscode.env.language.substring(0, 2);
    }
    
    // Fallback al localStorage se disponibile
    if (typeof localStorage !== 'undefined') {
      const storedLang = localStorage.getItem('jarvis-ide-language');
      if (storedLang) {
        return storedLang;
      }
    }
    
    // Fallback alla lingua del browser
    return detectLanguage();
  } catch (e) {
    console.warn('Impossibile determinare la lingua:', e);
    return 'en'; // Fallback all'inglese
  }
}

/**
 * Inizializza il sistema di internazionalizzazione
 */
export function initI18n(): void {
  // Controlla se c'è una lingua salvata in localStorage
  if (typeof localStorage !== 'undefined') {
    const savedLanguage = localStorage.getItem('jarvis-ide-language');
    if (savedLanguage && languages[savedLanguage]) {
      setLanguage(savedLanguage);
      return;
    }
  }
  
  // Altrimenti, usa la lingua rilevata
  setLanguage(detectLanguage());
}

/**
 * Imposta la lingua corrente
 * @param lang Il codice lingua da impostare (es. 'it', 'en')
 */
export function setLanguage(lang: string): void {
  if (languages[lang]) {
    currentLanguage = lang;
    
    // Memorizza la preferenza nel localStorage se disponibile
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jarvis-ide-language', lang);
      }
    } catch (e) {
      console.warn('Impossibile salvare la preferenza della lingua:', e);
    }
  } else {
    console.warn(`Lingua ${lang} non supportata. Utilizzo della lingua predefinita ${currentLanguage}`);
  }
}

/**
 * Traduce una chiave nella lingua corrente
 * @param key La chiave di traduzione
 * @param options Opzioni per la sostituzione di variabili
 * @returns La stringa tradotta
 */
export function translate(key: TranslationKey, options?: TranslationOptions): string {
  // Determina quale dizionario usare
  const dictionary = languages[currentLanguage] || languages['en'];
  
  // Ottieni la traduzione o la chiave come fallback
  let translation = dictionary[key] || key;
  
  // Sostituisci eventuali variabili nel formato {{nome}}
  if (options) {
    Object.entries(options).forEach(([name, value]) => {
      translation = translation.replace(new RegExp(`{{${name}}}`, 'g'), String(value));
    });
  }
  
  return translation;
}

// Esporta l'hook useTranslation per integrazione React
export function useTranslation() {
  return {
    t: translate,
    setLanguage,
    currentLanguage
  };
}

// Alias breve della funzione translate
export const t = translate; 