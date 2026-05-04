import { createAnthropic } from '@ai-sdk/anthropic';
import type { AdapterFactory } from '../types';

export const anthropicAdapter: AdapterFactory = (model: string) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no está definida');
  }

  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  return anthropic(model);
};
