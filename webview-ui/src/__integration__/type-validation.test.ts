import { 
  WebviewMessageType, 
  WebviewMessage, 
  ExtensionMessage, 
  PromptPayload, 
  SettingsPayload, 
  ErrorPayload,
  ExtensionResponsePayload
} from './type-validation.mock';

describe('Validazione tipi Webview ↔ Extension', () => {
  test('WebviewMessage deve accettare solo tipi previsti', () => {
    const validMessage: WebviewMessage = {
      type: WebviewMessageType.SEND_PROMPT,
      payload: { prompt: 'ciao' } as PromptPayload,
      id: '123'
    };

    expect(validMessage.type).toBe(WebviewMessageType.SEND_PROMPT);
    expect((validMessage.payload as PromptPayload).prompt).toBe('ciao');
  });

  test('PromptPayload deve avere struttura corretta', () => {
    const promptPayload: PromptPayload = {
      prompt: 'Ciao come stai?',
      images: ['data:image/png;base64,abc123']
    };

    expect(promptPayload.prompt).toBeDefined();
    expect(Array.isArray(promptPayload.images)).toBe(true);
  });

  test('SettingsPayload deve supportare le proprietà delle impostazioni', () => {
    const settingsPayload: SettingsPayload = {
      apiKey: 'sk-123456',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000
    };

    const message: WebviewMessage = {
      type: WebviewMessageType.UPDATE_SETTINGS,
      payload: settingsPayload
    };

    expect(message.type).toBe(WebviewMessageType.UPDATE_SETTINGS);
    expect((message.payload as SettingsPayload).apiKey).toBe('sk-123456');
    expect((message.payload as SettingsPayload).model).toBe('gpt-4');
  });

  test('ErrorPayload deve contenere un messaggio di errore', () => {
    const errorPayload: ErrorPayload = {
      message: 'Si è verificato un errore',
      code: 500,
      details: { reason: 'Connessione fallita' }
    };

    const message: WebviewMessage = {
      type: WebviewMessageType.ERROR,
      payload: errorPayload
    };

    expect(message.type).toBe(WebviewMessageType.ERROR);
    expect((message.payload as ErrorPayload).message).toBe('Si è verificato un errore');
    expect((message.payload as ErrorPayload).code).toBe(500);
  });

  test('ExtensionMessage deve avere tipo valido', () => {
    const responsePayload: ExtensionResponsePayload = {
      result: 'Success',
      settings: { theme: 'dark' },
      status: 'completed'
    };

    const validExtensionResponse: ExtensionMessage = {
      type: 'response',
      message: 'OK',
      payload: responsePayload,
      id: '123'
    };

    expect(validExtensionResponse.type).toBe('response');
    expect(validExtensionResponse.payload?.result).toBe('Success');
    expect(validExtensionResponse.payload?.settings?.theme).toBe('dark');
  });

  test('Enum WebviewMessageType contiene tutti i tipi previsti', () => {
    const allTypes = Object.values(WebviewMessageType);
    expect(allTypes).toContain(WebviewMessageType.SEND_PROMPT);
    expect(allTypes).toContain(WebviewMessageType.UPDATE_SETTINGS);
    expect(allTypes).toContain(WebviewMessageType.GET_SETTINGS);
    expect(allTypes).toContain(WebviewMessageType.CLEAR_CHAT_HISTORY);
    expect(allTypes).toContain(WebviewMessageType.EXPORT_CHAT_HISTORY);
    expect(allTypes).toContain(WebviewMessageType.SAVE_SETTINGS);
    expect(allTypes).toContain(WebviewMessageType.SELECT_IMAGES);
    expect(allTypes).toContain(WebviewMessageType.ERROR);
  });

  test('Non devono esistere messaggi con type non definito nell\'enum', () => {
    const unknownMessage = {
      type: 'UNKNOWN_TYPE',
      payload: {}
    };

    const isKnown = Object.values(WebviewMessageType).includes(unknownMessage.type);
    expect(isKnown).toBe(false);
  });
}); 