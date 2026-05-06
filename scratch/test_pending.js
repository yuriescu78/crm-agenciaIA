const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rmajfovafnydcwmeyjub.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWpmb3ZhZm55ZGN3bWV5anViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyNzQ0NSwiZXhwIjoyMDkyODAzNDQ1fQ.S6e-R9UKQKT6SBiZ7HtCGCHrOKHv3Erh8NoviQb6D-k";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const testDoc = {
    client_id: "f2ed6eea-d758-4a17-987e-b22998a61c71",
    name: "PRUEBA_REAL.pdf",
    type: "pdf",
    google_drive_id: "id_real_" + Date.now(),
    status: "Pending" // Valor que pensamos que es correcto
  };

  const { data, error } = await supabase.from('documents').insert(testDoc);
  if (error) console.log('ERROR:', error);
  else console.log('INSERTADO CON ÉXITO');
}

testInsert();
