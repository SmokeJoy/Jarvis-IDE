// Costanti per i tipi di messaggi
export const MESSAGE_TYPES = {
  // Messaggi di base
  ERROR: 'error',
  STATE: 'state',
  NAVIGATE: 'navigate',

  // Messaggi dei prompt
  PROMPT_PROFILES: 'promptProfiles',
  PROMPT_PROFILE_UPDATED: 'promptProfileUpdated',

  // Messaggi API
  API_SET_CONFIGURATION: 'setConfiguration',
  API_GET_CONFIGURATION: 'getConfiguration',
  API_LOAD_MODELS: 'loadModels',
  API_SEND_MESSAGE: 'sendMessage',
  API_RESET: 'reset',
  API_ERROR: 'error'
} as const;

// Costanti per i nomi degli eventi
export const EVENT_NAMES = {
  MESSAGE_RECEIVED: 'messageReceived',
  MESSAGE_SENT: 'messageSent',
  ERROR_OCCURRED: 'errorOccurred',
  STATE_CHANGED: 'stateChanged'
} as const;

// Costanti per i timeout
export const TIMEOUTS = {
  MESSAGE_RETRY: 3000,
  CONNECTION_RETRY: 5000,
  RESPONSE_TIMEOUT: 30000
} as const; 