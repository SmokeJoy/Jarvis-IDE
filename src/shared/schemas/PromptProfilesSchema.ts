import { z } from 'zod';

export const PromptProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isDefault: z.boolean(),
  contextPrompt: z.object({
    system: z.string(),
    user: z.string()
  })
});

export const PromptProfilesSchema = z.object({
  profiles: z.array(PromptProfileSchema)
}); 