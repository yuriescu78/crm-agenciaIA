import { createOpenAI } from '@ai-sdk/openai';
import type { AdapterFactory } from '../types';

export const openaiAdapter: AdapterFactory = (model: string) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no está definida');
  }

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return openai(model);
};
