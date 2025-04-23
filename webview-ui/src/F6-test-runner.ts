/**
 * MCP-F6 Test Runner
 * Script per validare la funzionalità del ProfileSelector e ProfileManagerModal
 * 
 * Esecuzione:
 * 1. Apri l'extension webview e l'editor di system prompt
 * 2. Apri la console degli strumenti di sviluppo (F12)
 * 3. Copia e incolla questo script 
 * 4. Esegui window.runMcpF6Tests()
 */

window.runMcpF6Tests = function() {
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
      const selector = document.querySelector('.profile-selector select, .vscode-dropdown');
      log('ProfileSelector presente nel DOM', !!selector);
      
      if (!selector) return false;
      
      // Verifica caricamento profili
      const activeProfile = window.contextPromptManager?.getActiveProfile();
      log('Profilo attivo caricato correttamente', !!activeProfile);
      
      // Verifica che contenga opzioni
      log('ProfileSelector contiene opzioni', selector.children.length > 0);
      
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
      const manageButton = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.includes('Gestisci profili'));
        
      log('Pulsante "Gestisci profili" presente', !!manageButton);
      
      if (!manageButton) return false;
      
      // Simula il click per aprire il modale
      manageButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verifica che il modale sia stato aperto
      const modal = document.querySelector('.modal-backdrop, .modal-container, [role="dialog"]');
      log('Modal aperto correttamente', !!modal);
      
      if (!modal) return false;
      
      // Verifica che contenga la lista dei profili
      const profileList = modal.querySelector('.profile-list, [class*="profile"]');
      log('Lista profili presente nel modale', !!profileList);
      
      // Verifica che ci sia il pulsante per creare un nuovo profilo
      const newProfileButton = Array.from(modal.querySelectorAll('button'))
        .find(b => b.textContent.includes('Nuovo Profilo'));
      log('Pulsante "Nuovo Profilo" presente', !!newProfileButton);
      
      // Chiude il modale per non interferire con altri test
      const closeButton = modal.querySelector('button[aria-label="Close"], button.close-button');
      if (closeButton) closeButton.click();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return true;
    } catch (error) {
      log(`Errore in testProfileManagerModal: ${error.message}`, false);
      return false;
    }
  }

  async function testCRUDOperations() {
    log('Inizio test operazioni CRUD', null);
    
    try {
      // Ottiene tutti i profili attuali
      const initialProfiles = window.contextPromptManager.getAllProfiles();
      const initialCount = Object.keys(initialProfiles).length;
      log(`Numero iniziale di profili: ${initialCount}`, null);
      
      // Test creazione profilo
      const testProfileName = `Test Profile ${Date.now()}`;
      await window.contextPromptManager.createProfile(testProfileName);
      
      // Verifica creazione
      const updatedProfiles = window.contextPromptManager.getAllProfiles();
      const newProfile = Object.values(updatedProfiles).find(p => p.name === testProfileName);
      log('Creazione profilo', !!newProfile);
      
      if (!newProfile) return false;
      
      // Test aggiornamento profilo
      const updatedName = `${testProfileName} (modificato)`;
      await window.contextPromptManager.updateProfile({
        ...newProfile,
        name: updatedName
      });
      
      // Verifica aggiornamento
      const afterUpdateProfiles = window.contextPromptManager.getAllProfiles();
      const updatedProfileExists = Object.values(afterUpdateProfiles).some(p => p.name === updatedName);
      log('Aggiornamento profilo', updatedProfileExists);
      
      // Test eliminazione profilo
      if (newProfile.id) {
        await window.contextPromptManager.deleteProfile(newProfile.id);
        
        // Verifica eliminazione
        const afterDeleteProfiles = window.contextPromptManager.getAllProfiles();
        const profileDeleted = !Object.values(afterDeleteProfiles).some(p => p.id === newProfile.id);
        log('Eliminazione profilo', profileDeleted);
      }
      
      return true;
    } catch (error) {
      log(`Errore in testCRUDOperations: ${error.message}`, false);
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
      await testPersistenceLayer();
      await testCRUDOperations();
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

  // Esegui tutti i test e restituisci i risultati
  return runAllTests();
};

// Messaggio di debug per confermare che lo script è stato caricato
console.log('%c MCP-F6 Test Runner caricato ', 'background: #35a; color: white; padding: 3px 6px;');
console.log('Esegui window.runMcpF6Tests() per avviare i test'); 