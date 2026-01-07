import { z } from 'zod';

export const configSchema = z.object({
  amber: z.object({
    apiKey: z.string().min(1, 'AMBER_API_KEY is required'),
    siteId: z.string().optional(),
    baseUrl: z.string().url().default('https://api.amber.com.au/v1'),
  }),
  monitoring: z.object({
    feedInThreshold: z.number().positive(),
    checkInterval: z.string().min(1),
    timezone: z.string().default('Australia/Sydney'),
  }),
  notifications: z.object({
    channels: z.array(z.enum(['console', 'desktop'])),
  }),
  logging: z.object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
    pretty: z.boolean().default(false),
  }),
});

export type AppConfig = z.infer<typeof configSchema>;
