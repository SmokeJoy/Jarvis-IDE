import { z } from 'zod';

export const WebSocketMessageUnionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ws.ping'), payload: z.object({ timestamp: z.number() }) }),
  z.object({ type: z.literal('ws.llm/status'), payload: z.object({ modelId: z.string(), status: z.string(), timestamp: z.number() }) })
  // Aggiungi altri tipi websocket qui secondo la union reale
]); 