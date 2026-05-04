import { createVertex } from '@ai-sdk/google-vertex';
import fs from 'fs';
import type { AdapterFactory } from '../types';

let credentialsInitialized = false;

function ensureCredentials() {
  if (credentialsInitialized) return;
  if (process.env.GOOGLE_CREDENTIALS_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    fs.writeFileSync('/tmp/gcp-creds.json', process.env.GOOGLE_CREDENTIALS_JSON);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/gcp-creds.json';
  }
  credentialsInitialized = true;
}

export const vertexAdapter: AdapterFactory = (model: string) => {
  ensureCredentials();

  if (!process.env.VERTEX_PROJECT_ID) {
    throw new Error('VERTEX_PROJECT_ID no está definida');
  }

  const vertex = createVertex({
    project: process.env.VERTEX_PROJECT_ID,
    location: process.env.VERTEX_LOCATION ?? 'us-central1',
  });

  return vertex(model);
};
