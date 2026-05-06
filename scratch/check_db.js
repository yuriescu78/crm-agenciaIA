const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rmajfovafnydcwmeyjub.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWpmb3ZhZm55ZGN3bWV5anViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyNzQ0NSwiZXhwIjoyMDkyODAzNDQ1fQ.S6e-R9UKQKT6SBiZ7HtCGCHrOKHv3Erh8NoviQb6D-k";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDocs() {
  console.log('--- CLIENTS ---');
  const { data: clients } = await supabase.from('clients').select('id, first_name, last_name');
  console.log(JSON.stringify(clients, null, 2));

  console.log('\n--- DOCUMENTS ---');
  const { data: docs } = await supabase.from('documents').select('*');
  console.log(JSON.stringify(docs, null, 2));
}

checkDocs();
