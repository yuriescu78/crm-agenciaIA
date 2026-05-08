import { syncFolderFiles } from './src/lib/google/drive'; 
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function test() { 
  try {
    const result = await syncFolderFiles('0be96f92-7145-4f76-b86e-f7a269f0709f');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  }
} test();
