/**
 * Utility per l'internazionalizzazione (i18n) dell'estensione
 * Supporta inglese (predefinito) e italiano
 */

import * as vscode from 'vscode';

// Definizione dei tipi
export type SupportedLanguage = 'en' | 'it';
export type TranslationKey = string;

// Dizionario di traduzioni
const translations: Record<SupportedLanguage, Record<TranslationKey, string>> = {
  en: {
    // Messaggi interfaccia
    'import.success': 'Chat session imported successfully',
    'import.error': 'Error importing chat session',
    'export.success': 'Chat session exported successfully',
    'export.error': 'Error exporting chat session',
    'validate.success': 'The session is valid',
    'validate.error': 'The session is not valid',
    'convert.success': 'Session format converted successfully',
    'convert.error': 'Error converting session format',
    'preview.title': 'Session Preview',
    
    // Comandi
    'command.import': 'Import Chat Session',
    'command.export': 'Export Chat Session',
    'command.validate': 'Validate Chat Session',
    'command.convert': 'Convert Session Format',
    'command.preview': 'Preview Session',
    
    // Etichette dialog
    'dialog.import.title': 'Import Chat Session',
    'dialog.export.title': 'Export Chat Session',
    'dialog.format.placeholder': 'Select export format',
    'dialog.validate.title': 'Validate Chat Session',
    'dialog.convert.title': 'Convert Session Format',
    'dialog.convert.to': 'Convert to format',
    'dialog.preview.title': 'Preview Session',
    
    // Formati
    'format.json': 'JavaScript Object Notation',
    'format.yaml': 'YAML Ain\'t Markup Language',
    'format.markdown': 'Formatted text',
    'format.csv': 'Comma-Separated Values',
    'format.html': 'HyperText Markup Language',
    
    // Errori
    'error.no.session': 'No session to export',
    'error.invalid.format': 'Invalid format',
    'error.no.messages': 'The session does not contain messages',
  },
  it: {
    // Messaggi interfaccia
    'import.success': 'Sessione di chat importata con successo',
    'import.error': 'Errore durante l\'importazione della sessione',
    'export.success': 'Sessione di chat esportata con successo',
    'export.error': 'Errore durante l\'esportazione della sessione',
    'validate.success': 'La sessione è valida',
    'validate.error': 'La sessione non è valida',
    'convert.success': 'Formato della sessione convertito con successo',
    'convert.error': 'Errore durante la conversione del formato',
    'preview.title': 'Anteprima Sessione',
    
    // Comandi
    'command.import': 'Importa Sessione di Chat',
    'command.export': 'Esporta Sessione di Chat',
    'command.validate': 'Valida Sessione di Chat',
    'command.convert': 'Converti Formato Sessione',
    'command.preview': 'Anteprima Sessione',
    
    // Etichette dialog
    'dialog.import.title': 'Importa Sessione di Chat',
    'dialog.export.title': 'Esporta Sessione di Chat',
    'dialog.format.placeholder': 'Seleziona il formato di esportazione',
    'dialog.validate.title': 'Valida Sessione di Chat',
    'dialog.convert.title': 'Converti Formato Sessione',
    'dialog.convert.to': 'Converti nel formato',
    'dialog.preview.title': 'Anteprima Sessione',
    
    // Formati
    'format.json': 'JavaScript Object Notation',
    'format.yaml': 'YAML Ain\'t Markup Language',
    'format.markdown': 'Formato di testo formattato',
    'format.csv': 'Valori separati da virgola',
    'format.html': 'Linguaggio di markup per ipertesti',
    
    // Errori
    'error.no.session': 'Nessuna sessione da esportare',
    'error.invalid.format': 'Formato non valido',
    'error.no.messages': 'La sessione non contiene messaggi',
  }
};

/**
 * Ottiene la lingua predefinita dell'editor VS Code
 * @returns La lingua predefinita (en o it)
 */
export function getDefaultLanguage(): SupportedLanguage {
  const vscodeLanguage = vscode.env.language?.toLowerCase() || 'en';
  
  // Controlla se la lingua è italiano
  if (vscodeLanguage.startsWith('it')) {
    return 'it';
  }
  
  // Fallback all'inglese
  return 'en';
}

/**
 * Ottiene una traduzione in base alla chiave
 * @param key Chiave di traduzione
 * @param language Lingua desiderata (opzionale, default: lingua editor)
 * @returns Testo tradotto
 */
export function t(key: TranslationKey, language?: SupportedLanguage): string {
  // Determina la lingua da utilizzare
  const lang = language || getDefaultLanguage();
  
  // Controlla se la traduzione esiste
  if (translations[lang] && translations[lang][key]) {
    return translations[lang][key];
  }
  
  // Fallback all'inglese
  if (translations.en[key]) {
    return translations.en[key];
  }
  
  // Se non è disponibile nessuna traduzione, restituisci la chiave
  console.warn(`Chiave di traduzione non trovata: ${key}`);
  return key;
}

/**
 * Utilità per mostrare un messaggio informativo localizzato
 * @param key Chiave di traduzione
 * @param language Lingua desiderata (opzionale, default: lingua editor)
 * @returns Promise con la risposta dell'utente
 */
export function showInformationMessage(key: TranslationKey, language?: SupportedLanguage): Thenable<string | undefined> {
  return vscode.window.showInformationMessage(t(key, language));
}

/**
 * Utilità per mostrare un messaggio di errore localizzato
 * @param key Chiave di traduzione
 * @param language Lingua desiderata (opzionale, default: lingua editor)
 * @returns Promise con la risposta dell'utente
 */
export function showErrorMessage(key: TranslationKey, language?: SupportedLanguage): Thenable<string | undefined> {
  return vscode.window.showErrorMessage(t(key, language));
}

/**
 * Utilità per mostrare un messaggio di avviso localizzato
 * @param key Chiave di traduzione
 * @param language Lingua desiderata (opzionale, default: lingua editor)
 * @returns Promise con la risposta dell'utente
 */
export function showWarningMessage(key: TranslationKey, language?: SupportedLanguage): Thenable<string | undefined> {
  return vscode.window.showWarningMessage(t(key, language));
}

// Esporta una funzione helper principale per facilità d'uso
export default t; 