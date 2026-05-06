const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rmajfovafnydcwmeyjub.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWpmb3ZhZm55ZGN3bWV5anViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyNzQ0NSwiZXhwIjoyMDkyODAzNDQ1fQ.S6e-R9UKQKT6SBiZ7HtCGCHrOKHv3Erh8NoviQb6D-k";
const supabase = createClient(supabaseUrl, supabaseKey);

async function findConstraint() {
  const { data, error } = await supabase.rpc('get_constraint_def', { constraint_name: 'documents_status_check' });
  if (error) {
    console.log('Error calling RPC:', error.message);
    
    // Si no hay RPC, intentamos con una query directa si podemos
    const { data: data2, error: error2 } = await supabase.from('_pg_expand_constraints').select('*').limit(1);
    console.log('Direct query error (expected):', error2?.message);
  } else {
    console.log('Constraint definition:', data);
  }
}

findConstraint();
