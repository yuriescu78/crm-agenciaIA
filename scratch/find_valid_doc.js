const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rmajfovafnydcwmeyjub.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWpmb3ZhZm55ZGN3bWV5anViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyNzQ0NSwiZXhwIjoyMDkyODAzNDQ1fQ.S6e-R9UKQKT6SBiZ7HtCGCHrOKHv3Erh8NoviQb6D-k";
const supabase = createClient(supabaseUrl, supabaseKey);

async function findValidDoc() {
  const { data, error } = await supabase.from('documents').select('*').limit(1);
  if (error) {
    console.log('Error fetching:', error.message);
  } else if (data && data.length > 0) {
    console.log('Documento válido encontrado:', data[0]);
  } else {
    console.log('No hay documentos en la tabla.');
  }
}

findValidDoc();
