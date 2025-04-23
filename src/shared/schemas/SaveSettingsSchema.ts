import { z } from 'zod';

export const SaveSettingsSchema = z.object({
  theme: z.string(),
  model: z.string(),
  temperature: z.number().min(0).max(1),
  apiKey: z.string().optional()
}); 