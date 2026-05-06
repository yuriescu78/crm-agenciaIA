const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rmajfovafnydcwmeyjub.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWpmb3ZhZm55ZGN3bWV5anViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyNzQ0NSwiZXhwIjoyMDkyODAzNDQ1fQ.S6e-R9UKQKT6SBiZ7HtCGCHrOKHv3Erh8NoviQb6D-k";
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectConstraint() {
  const { data, error } = await supabase.rpc('get_constraint_info', { table_name: 'documents' });
  if (error) {
    // If RPC doesn't exist, try to query information_schema via a trick
    const { data: cols, error: err2 } = await supabase.from('documents').select('*').limit(0);
    console.log('Columnas encontradas:', Object.keys(cols?.[0] || {}));
    
    // Let's try to just DROP the constraint if we can't find it
    console.log('Intentando eliminar la restricción problemática...');
    const { error: err3 } = await supabase.rpc('exec_sql', { sql_query: 'ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;' });
    if (err3) console.log('No se pudo borrar por RPC:', err3.message);
  } else {
    console.log('Info de restricción:', data);
  }
}

inspectConstraint();
