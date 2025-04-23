import { z } from 'zod';

export const AgentMessageUnionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('getAgentsStatus'), payload: z.undefined() }),
  z.object({ type: z.literal('toggleAgentActive'), payload: z.object({ agentId: z.string(), active: z.boolean() }) })
  // Aggiungi altri tipi agent qui secondo la union reale
]); 