import { createOpenAI } from '@ai-sdk/openai';
import type { AdapterFactory } from '../types';

// Ollama expone una API compatible con OpenAI, así que reusamos el cliente
export const ollamaAdapter: AdapterFactory = (model: string) => {
  const baseURL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1';

  const client = createOpenAI({
    baseURL,
    apiKey: 'ollama', // Ollama ignora la key pero el SDK la requiere
  });

  return client(model);
};
