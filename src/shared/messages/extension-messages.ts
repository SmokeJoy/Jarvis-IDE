import type {
  ErrorPayload,
  ResponsePayload,
  StatePayload,
  ActionPayload,
  PromptProfilesPayload,
  PromptProfilePayload,
  SettingsUpdatedPayload,
  ChatMessagePayload,
  ChatHistoryPayload,
  AgentStatusPayload,
  AgentResultPayload,
  CustomInstructionsPayload,
  ExtensionPromptMessage
} from '@shared/messages/extension-messages';

import {
  isExtensionPromptMessage,
  isErrorMessage,
  isResponseMessage,
  isStateMessage,
  isPromptProfilesMessage,
  isPromptProfileUpdatedMessage,
  isAgentStatusMessage,
  isAgentResultMessage
} from '@shared/messages/extension-messages';

export type {
  ErrorPayload,
  ResponsePayload,
  StatePayload,
  ActionPayload,
  PromptProfilesPayload,
  PromptProfilePayload,
  SettingsUpdatedPayload,
  ChatMessagePayload,
  ChatHistoryPayload,
  AgentStatusPayload,
  AgentResultPayload,
  CustomInstructionsPayload,
  ExtensionPromptMessage
};

export {
  isExtensionPromptMessage,
  isErrorMessage,
  isResponseMessage,
  isStateMessage,
  isPromptProfilesMessage,
  isPromptProfileUpdatedMessage,
  isAgentStatusMessage,
  isAgentResultMessage
}; 