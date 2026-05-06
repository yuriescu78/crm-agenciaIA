const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rmajfovafnydcwmeyjub.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWpmb3ZhZm55ZGN3bWV5anViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyNzQ0NSwiZXhwIjoyMDkyODAzNDQ1fQ.S6e-R9UKQKT6SBiZ7HtCGCHrOKHv3Erh8NoviQb6D-k";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
  const testDoc = {
    client_id: "f2ed6eea-d758-4a17-987e-b22998a61c71",
    name: "PRUEBA_UPSERT.pdf",
    type: "pdf",
    google_drive_id: "google_id_" + Date.now(),
    storage_path: "google_drive://test",
    // status: null // Sin estado
  };

  console.log('Intentando UPSERT...');
  const { data, error } = await supabase
    .from('documents')
    .upsert(testDoc, { onConflict: 'google_drive_id' });
    
  if (error) {
    console.error('ERROR EN UPSERT:', error);
  } else {
    console.log('UPSERT EXITOSO');
  }
}

testUpsert();
