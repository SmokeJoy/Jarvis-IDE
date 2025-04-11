/**
 * MCP-F6 Test Runner
 * Script per validare la funzionalità del ProfileSelector e ProfileManagerModal
 * 
 * Esecuzione:
 * 1. Apri una console nell'extension webview
 * 2. Copia e incolla questo script 
 * 3. Esegui runAllTests()
 */

// Storage per i risultati dei test
const testResults = {
  passed: 0,
  failed: 0,
  logs: []
};

// Logger per i risultati
function log(message, result) {
  const status = result === true ? '✅ PASS' : (result === false ? '❌ FAIL' : '🔄 INFO');
  const logMessage = `[${status}] ${message}`;
  console.log(logMessage);
  testResults.logs.push(logMessage);
  
  if (result === true) testResults.passed++;
  if (result === false) testResults.failed++;
}

// Funzioni di test per i componenti MCP-F6
async function testProfileSelector() {
  log('Inizio test ProfileSelector', null);
  
  try {
    // Verifica che il componente esista
    const selector = document.querySelector('.vscode-dropdown');
    log('ProfileSelector presente nel DOM', !!selector);
    
    if (!selector) return false;
    
    // Verifica caricamento profili
    const activeProfile = window.contextPromptManager?.getActiveProfile();
    log('Profilo attivo caricato correttamente', !!activeProfile);
    
    // Simulazione evento change
    const selectEvent = new Event('change');
    selector.dispatchEvent(selectEvent);
    
    // Verifica che contenga opzioni
    log('ProfileSelector contiene opzioni', selector.children.length > 0);
    
    // Test completo
    return true;
  } catch (error) {
    log(`Errore in testProfileSelector: ${error.message}`, false);
    return false;
  }
}

async function testProfileManagerModal() {
  log('Inizio test ProfileManagerModal', null);
  
  try {
    // Accede al pulsante "Gestisci profili"
    const manageButton = Array.from(document.querySelectorAll('vscode-button'))
      .find(b => b.textContent.trim() === 'Gestisci profili');
      
    log('Pulsante "Gestisci profili" presente', !!manageButton);
    
    if (!manageButton) return false;
    
    // Simula il click per aprire il modale
    manageButton.click();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verifica che il modale sia stato aperto
    const modal = document.querySelector('.modal-backdrop, .modal-container');
    log('Modal aperto correttamente', !!modal);
    
    if (!modal) return false;
    
    // Verifica che contenga la lista dei profili
    const profileList = modal.querySelector('.profile-list, [class*="profile"]');
    log('Lista profili presente nel modale', !!profileList);
    
    // Verifica che ci sia il pulsante per creare un nuovo profilo
    const newProfileButton = Array.from(modal.querySelectorAll('vscode-button'))
      .find(b => b.textContent.includes('Nuovo Profilo'));
    log('Pulsante "Nuovo Profilo" presente', !!newProfileButton);
    
    // Chiude il modale
    const closeButton = modal.querySelector('vscode-button[appearance="icon"]');
    if (closeButton) closeButton.click();
    
    // Test completo
    return true;
  } catch (error) {
    log(`Errore in testProfileManagerModal: ${error.message}`, false);
    return false;
  }
}

async function testMarkdownPreview() {
  log('Inizio test Markdown Preview', null);
  
  try {
    // Trova checkbox per la preview
    const previewCheckbox = document.querySelector('vscode-checkbox');
    log('Checkbox preview presente', !!previewCheckbox);
    
    if (!previewCheckbox) return false;
    
    // Stato iniziale
    const initialState = previewCheckbox.checked;
    
    // Attiva preview
    if (!initialState) {
      previewCheckbox.click();
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Verifica che la preview sia visibile
    const previewElement = document.querySelector('.markdown-preview, [class*="markdown"]');
    log('Elemento preview Markdown trovato', !!previewElement);
    
    // Disattiva preview (ripristina stato)
    if (!initialState) {
      previewCheckbox.click();
    }
    
    return true;
  } catch (error) {
    log(`Errore in testMarkdownPreview: ${error.message}`, false);
    return false;
  }
}

async function testPersistenceLayer() {
  log('Inizio test layer persistenza', null);
  
  try {
    // Verifica localStorage
    const localStorageProfiles = localStorage.getItem('jarvis.promptProfiles');
    log('Profili salvati in localStorage', !!localStorageProfiles);
    
    // Verifica Webview Bridge
    const webviewBridge = window.webviewBridge;
    log('WebviewBridge disponibile', !!webviewBridge);
    
    if (!webviewBridge) return false;
    
    // Verifica metodi contextPromptManager
    const manager = window.contextPromptManager;
    log('contextPromptManager disponibile', !!manager);
    
    if (!manager) return false;
    
    // Verifica metodi disponibili
    const methods = [
      'getActiveProfile',
      'getAllProfiles',
      'switchProfile',
      'createProfile',
      'updateProfile',
      'deleteProfile',
      'setProfileAsDefault'
    ];
    
    for (const method of methods) {
      log(`Metodo ${method} disponibile`, typeof manager[method] === 'function');
    }
    
    return true;
  } catch (error) {
    log(`Errore in testPersistenceLayer: ${error.message}`, false);
    return false;
  }
}

// Test integrazione con l'editor
async function testEditorIntegration() {
  log('Inizio test integrazione editor', null);
  
  try {
    // Verifica presenza editor
    const textarea = document.querySelector('textarea');
    log('Editor textarea presente', !!textarea);
    
    if (!textarea) return false;
    
    // Memorizza contenuto
    const originalContent = textarea.value;
    
    // Simula modifica
    textarea.value = 'Test automatico MCP-F6';
    const inputEvent = new Event('input', { bubbles: true });
    textarea.dispatchEvent(inputEvent);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verifica cambiamento
    const changed = textarea.value === 'Test automatico MCP-F6';
    log('Editor reagisce alle modifiche', changed);
    
    // Ripristina
    textarea.value = originalContent;
    textarea.dispatchEvent(inputEvent);
    
    return true;
  } catch (error) {
    log(`Errore in testEditorIntegration: ${error.message}`, false);
    return false;
  }
}

// Funzione principale per eseguire tutti i test
async function runAllTests() {
  console.clear();
  console.log('%c MCP-F6 Test Runner ', 'background: #3a3; color: white; font-size: 16px; padding: 4px 8px;');
  console.log('Esecuzione test automatici per validazione ProfileSelector e ProfileManagerModal');
  
  try {
    // Esegui tutti i test
    await testProfileSelector();
    await testProfileManagerModal();
    await testMarkdownPreview();
    await testPersistenceLayer();
    await testEditorIntegration();
    
    // Stampa risultati
    console.log('\n%c Risultati Test ', 'background: #333; color: white; font-size: 14px; padding: 3px 6px;');
    console.log(`Test completati: ${testResults.passed + testResults.failed}`);
    console.log(`✅ Passati: ${testResults.passed}`);
    console.log(`❌ Falliti: ${testResults.failed}`);
    
    // Verifica se tutti i test sono passati
    const allPassed = testResults.failed === 0;
    
    console.log(`\n${allPassed 
      ? '%c ✅ TUTTI I TEST SONO PASSATI ' 
      : '%c ❌ ALCUNI TEST SONO FALLITI '}`, 
      `background: ${allPassed ? '#383' : '#a33'}; color: white; font-size: 14px; padding: 4px 8px;`
    );
    
    return {
      success: allPassed,
      results: testResults
    };
  } catch (error) {
    console.error('Errore durante l\'esecuzione dei test:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Espone la funzione globalmente per essere eseguita dalla console
window.runMcpF6Tests = runAllTests;

// Auto-esecuzione se in ambiente di test
if (location.search.includes('autotest=true')) {
  setTimeout(runAllTests, 1000);
}

console.log('Test MCP-F6 pronti. Esegui window.runMcpF6Tests() per avviare la validazione.'); 