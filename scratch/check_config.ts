import { createClient } from '@supabase/supabase-js';

async function checkConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('users')
    .select('id, email, agent_config');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('User Configs:');
  data.forEach(u => {
    console.log(`- User: ${u.email} (${u.id})`);
    console.log(`  Config:`, JSON.stringify(u.agent_config, null, 2));
  });
}

checkConfig();
