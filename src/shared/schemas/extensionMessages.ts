import { z } from 'zod';
import { SaveSettingsSchema } from './SaveSettingsSchema';
import { PromptProfilesSchema, PromptProfileSchema } from './PromptProfilesSchema';

// Payload base
const BasePayload = z.record(z.unknown()).optional();

// Payloads specifici
const ErrorPayload = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional()
});

const ResponsePayload = z.object({
  text: z.string().optional(),
  role: z.string().optional(),
  streaming: z.boolean().optional()
});

const StatePayload = z.object({
  state: z.record(z.unknown()) // Puoi raffinare con uno schema per ExtensionState
});

const ActionPayload = z.object({
  action: z.string()
});

const PromptProfilePayload = z.object({
  profile: PromptProfileSchema
});

const SettingsUpdatedPayload = z.object({
  settings: SaveSettingsSchema
});

const ChatMessagePayload = z.object({
  message: z.record(z.unknown()) // Puoi raffinare con uno schema per ChatMessage
});

const ChatHistoryPayload = z.object({
  messages: z.array(z.record(z.unknown())) // Puoi raffinare con uno schema per ChatMessage
});

const AgentStatusPayload = z.object({
  agentId: z.string(),
  status: z.enum(['idle', 'working', 'error']),
  message: z.string().optional()
});

const AgentResultPayload = z.object({
  agentId: z.string(),
  result: z.string(),
  metadata: z.record(z.unknown()).optional()
});

const CustomInstructionsPayload = z.object({
  instructions: z.string()
});

// Union centrale ExtensionMessageUnion
export const ExtensionMessageUnionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('error'), payload: ErrorPayload }),
  z.object({ type: z.literal('response'), payload: ResponsePayload }),
  z.object({ type: z.literal('state'), payload: StatePayload }),
  z.object({ type: z.literal('action'), payload: ActionPayload }),
  z.object({ type: z.literal('promptProfiles'), payload: PromptProfilesSchema }),
  z.object({ type: z.literal('promptProfileUpdated'), payload: PromptProfilePayload }),
  z.object({ type: z.literal('promptProfileCreated'), payload: PromptProfilePayload }),
  z.object({ type: z.literal('promptProfileDeleted'), payload: PromptProfilePayload }),
  z.object({ type: z.literal('settingsUpdated'), payload: SettingsUpdatedPayload }),
  z.object({ type: z.literal('settingsReset'), payload: BasePayload }),
  z.object({ type: z.literal('chatMessage'), payload: ChatMessagePayload }),
  z.object({ type: z.literal('chatHistory'), payload: ChatHistoryPayload }),
  z.object({ type: z.literal('chatCleared'), payload: BasePayload }),
  z.object({ type: z.literal('agentStatus'), payload: AgentStatusPayload }),
  z.object({ type: z.literal('agentResult'), payload: AgentResultPayload }),
  z.object({ type: z.literal('customInstructions'), payload: CustomInstructionsPayload }),
  z.object({ type: z.literal('ready'), payload: BasePayload })
]); 