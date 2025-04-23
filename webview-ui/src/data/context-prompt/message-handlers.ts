import type { WebviewMessage, ExtensionMessage } from '@shared/types/webview.types';
import { WebviewMessageType } from '@shared/types/webview.types';
import { 
  isPromptProfilesMessage, 
  isPromptProfileUpdatedMessage,
  isPromptProfilePayload,
  isPromptProfile 
} from '@shared/messages/guards/promptMessageGuards';
import type { PromptManagerContext } from './types';
import logger from '@shared/utils/outputLogger';

const componentLogger = logger.createComponentLogger('ContextPromptHandlers');

/**
 * Gestisce il messaggio promptProfiles dall'estensione
 */
export function handlePromptProfilesMessage(
  message: ExtensionMessage,
  context: PromptManagerContext
): void {
  if (!isPromptProfilesMessage(message)) {
    componentLogger.error('Messaggio promptProfiles non valido');
    return;
  }

  if (message.error) {
    context.bridge.sendMessage({
      type: WebviewMessageType.ERROR,
      payload: { message: message.error }
    });
    return;
  }

  if (!isPromptProfilePayload((msg.payload as unknown))) {
    componentLogger.error('Payload promptProfiles non valido');
    return;
  }

  context.state.setProfiles((msg.payload as unknown).profiles);
  componentLogger.debug('Profili aggiornati con successo', { 
    count: (msg.payload as unknown).profiles.length 
  });
}

/**
 * Gestisce il messaggio promptProfileUpdated dall'estensione
 */
export function handlePromptProfileUpdatedMessage(
  message: ExtensionMessage,
  context: PromptManagerContext
): void {
  if (!isPromptProfileUpdatedMessage(message)) {
    componentLogger.error('Messaggio promptProfileUpdated non valido');
    return;
  }

  if (message.error) {
    context.bridge.sendMessage({
      type: WebviewMessageType.ERROR,
      payload: { message: message.error }
    });
    return;
  }

  const profile = (msg.payload as unknown)?.profile;
  if (!isPromptProfile(profile)) {
    componentLogger.error('Payload profile non valido');
    return;
  }

  const state = context.state.getState();
  const profileId = profile.id;
  
  // Aggiorna il profilo mantenendo gli altri
  context.state.setProfiles([
    ...state.profilesCache?.filter(p => p.id !== profileId) || [],
    profile
  ]);
  
  // Se è il profilo attivo, aggiorna anche quello
  if (state.activeProfileId === profileId) {
    context.state.setActiveProfile(profileId);
  }

  componentLogger.debug('Profilo aggiornato con successo', { profileId });
}

/**
 * Registra gli handler dei messaggi
 */
export function registerMessageHandlers(context: PromptManagerContext): void {
  context.bridge.on(WebviewMessageType.GET_PROMPT_PROFILES, msg => handlePromptProfilesMessage(msg, context));
  context.bridge.on(WebviewMessageType.UPDATE_PROMPT_PROFILE, msg => handlePromptProfileUpdatedMessage(msg, context));
}

/**
 * Richiede i profili all'estensione
 */
export function requestProfiles(bridge: PromptManagerContext['bridge']): void {
  bridge.sendMessage({
    type: WebviewMessageType.GET_PROMPT_PROFILES
  });
  componentLogger.debug('Richiesta profili inviata all\'estensione');
}

/**
 * Invia l'aggiornamento di un profilo all'estensione
 */
export function updateProfileOnExtension(
  bridge: PromptManagerContext['bridge'],
  profileId: string,
  contextPrompt: WebviewMessage['payload']['contextPrompt']
): void {
  bridge.sendMessage({
    type: WebviewMessageType.UPDATE_PROMPT_PROFILE,
    payload: {
      profileId,
      contextPrompt
    }
  });
  componentLogger.debug('Aggiornamento profilo inviato all\'estensione', { profileId });
} 
 