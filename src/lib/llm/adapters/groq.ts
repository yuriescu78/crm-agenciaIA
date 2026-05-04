import { createGroq } from '@ai-sdk/groq';
import type { AdapterFactory } from '../types';

export const groqAdapter: AdapterFactory = (model: string) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY no está definida');
  }

  const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
  });

  return groq(model);
};
