# Architettura del Modulo WebView UI

## Panoramica

Il modulo WebView UI di Jarvis IDE fornisce l'interfaccia utente React che viene renderizzata all'interno dell'estensione VS Code. L'architettura è stata progettata per garantire:

1. Comunicazione tipo-sicura con l'estensione VS Code
2. Gestione robusta degli errori
3. Supporto multilingua (i18n)
4. Manutenibilità del codice con pattern React moderni

## Struttura delle Directory

```
webview-ui/
├── src/
│   ├── components/          # Componenti React dell'interfaccia utente
│   │   ├── ChatView.tsx     # Vista principale della chat 
│   │   ├── SettingsView.tsx # Vista impostazioni
│   │   └── ...
│   ├── context/             # Contesti React per gestione stato
│   │   └── ExtensionStateContext.tsx
│   ├── hooks/               # Custom hooks React riutilizzabili
│   │   └── useChat.ts
│   ├── utils/               # Utility per la WebView
│   │   ├── WebviewBridge.ts # Gestisce comunicazione con estensione
│   │   ├── messageUtils.ts  # Utility per i messaggi
│   │   └── ...
│   ├── i18n.ts              # Sistema di internazionalizzazione
│   ├── types/               # Definizioni di tipo per la WebView
│   │   └── ...
│   ├── App.tsx              # Componente principale dell'applicazione
│   └── main.tsx             # Entry point
│
├── public/                  # Asset statici
├── index.html               # HTML template
├── package.json             # Dipendenze npm
└── tsconfig.json            # Configurazione TypeScript
```

## Componenti Principali

### 1. Sistema di Comunicazione

La comunicazione tra WebView e estensione VS Code avviene attraverso i seguenti componenti:

- **WebviewBridge** (`src/utils/WebviewBridge.ts`): Singleton che fornisce un'API basata su eventi per la comunicazione con l'estensione. Gestisce invio messaggi e registrazione listener.

- **messageUtils** (`src/utils/messageUtils.ts`): Utility per creare, validare e inviare messaggi tipizzati. Include type guards e funzioni helper.

### 2. Sistema di Internazionalizzazione (i18n)

- **i18n** (`src/i18n.ts`): Sistema di traduzione che supporta:
  - Dizionari multilingua (italiano, inglese)
  - Template per variabili (`{{nome}}`)
  - Hook React `useTranslation()` per integrazione componenti
  - Rilevamento automatico lingua dell'utente

### 3. Componenti UI Principali

- **ChatView** (`src/components/ChatView.tsx`): Visualizza e gestisce la conversazione con l'assistente.
  - Custom hook `useChatMessages()` per gestione stato
  - Validazione payload messaggi
  - Gestione errori con notifiche
  - UI completamente localizzata

### 4. Tipizzazione e Interfacce 

Le definizioni di tipo sono condivise con l'estensione principale attraverso:

- **Interfacce condivise**: Importate da `src/shared/types/webview.types.ts`
- **Type guards specializzati**: Per validazione di formati messaggi

## Flusso di Comunicazione

```
┌──────────────┐                    ┌────────────────┐
│   ChatView   │                    │  VS Code Ext   │
│  (React UI)  │                    │  (Extension)   │
└──────┬───────┘                    └────────┬───────┘
       │                                     │
       │  1. User input                      │
       │                                     │
       ▼                                     │
┌──────────────┐    2. SendMessage     ┌─────▼────────┐
│ WebviewBridge ├────────────────────► │JarvisProvider│
└──────┬───────┘                      └─────┬─────────┘
       │                                    │
       │                                    │
       │                                    │
       │  4. Handle Response                │  3. Process
       │                                    │     Request
       ▼                                    │
┌──────────────┐    5. UI Update      ┌─────▼─────────┐
│   ChatView   │◄───────────────────┐ │ Extension API │
└──────────────┘                    └─┴───────────────┘
```

## Pattern di Design Chiave

1. **Singleton**: `WebviewBridge` e servizi condivisi
2. **Observer**: Sistema di eventi per comunicazioni WebView
3. **Factory**: `createMessage` per generazione messaggi tipizzati
4. **Hook Pattern**: Custom hooks React per gestione stato e logica
5. **Type Guards**: Funzioni di validazione tipo a runtime

## Gestione degli Errori

Il sistema implementa una gestione degli errori multi-livello:

1. **Validazione input**: Type guards per verificare validità messaggi
2. **Logging centralizzato**: Logger con livelli (debug, info, warn, error)
3. **UI Feedback**: Notifiche visibili all'utente per errori
4. **Monitoraggio connessione**: Ping automatico per verificare stato della connessione

## Estendibilità

Il sistema è progettato per essere facilmente estensibile:

1. **Nuovi tipi di messaggio**: Aggiungerli a `WebviewMessageType` enum
2. **Nuove lingue**: Aggiungere dizionari a `i18n.ts`
3. **Nuovi componenti UI**: Utilizzare pattern e hook esistenti 