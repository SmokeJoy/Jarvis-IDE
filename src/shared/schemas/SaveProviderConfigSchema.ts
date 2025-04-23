import { z } from 'zod';

export const SaveProviderConfigSchema = z.object({
  providerId: z.string(),
  modelId: z.string(),
  apiKey: z.string(),
  organizationId: z.string().optional()
}); 