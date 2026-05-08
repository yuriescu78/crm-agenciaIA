import { createClient } from '@supabase/supabase-js'; 
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function test() { 
  const { data, error } = await supabase.from('clients').select('id, first_name, company, google_drive_folder_id').ilike('company', '%SEGUREX%').single();
  if (error) console.error(error);
  console.log(JSON.stringify(data, null, 2)); 
} test();
