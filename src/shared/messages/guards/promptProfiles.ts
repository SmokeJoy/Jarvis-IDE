import { z } from 'zod';

export const PromptProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  isDefault: z.boolean(),
  contextPrompt: z.object({
    system: z.string(),
    user: z.string(),
  }),
});

export const PromptProfilesPayloadSchema = z.object({
  profiles: z.array(PromptProfileSchema),
});

export type PromptProfilesPayload = z.infer<typeof PromptProfilesPayloadSchema>; 