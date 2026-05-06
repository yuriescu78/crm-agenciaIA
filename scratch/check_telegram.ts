import { createClient } from '@supabase/supabase-js';

async function checkTelegramLinks() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('telegram_users')
    .select('telegram_user_id, user_id');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Telegram Links:');
  data.forEach(link => {
    console.log(`- Telegram ID: ${link.telegram_user_id} -> CRM User ID: ${link.user_id}`);
  });
}

checkTelegramLinks();
