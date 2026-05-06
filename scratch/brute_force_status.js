const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rmajfovafnydcwmeyjub.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWpmb3ZhZm55ZGN3bWV5anViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyNzQ0NSwiZXhwIjoyMDkyODAzNDQ1fQ.S6e-R9UKQKT6SBiZ7HtCGCHrOKHv3Erh8NoviQb6D-k";
const supabase = createClient(supabaseUrl, supabaseKey);

async function bruteForce() {
  const statuses = [
    'Active', 'Inactive', 'Pending', 'Completed', 'Draft', 'Published', 'Archived',
    'active', 'inactive', 'pending', 'completed', 'draft', 'published', 'archived',
    'Nuevo', 'Pendiente', 'Completado', 'Borrador', 'Enviado', 'Aprobado', 'Rechazado', 'Firmado', 'Archivado'
  ];

  for (const status of statuses) {
    const testDoc = {
      client_id: "f2ed6eea-d758-4a17-987e-b22998a61c71",
      name: `TEST_${status}.pdf`,
      type: "Otro",
      status: status,
      google_drive_id: "test_" + status + "_" + Date.now(),
      storage_path: "test"
    };

    const { error } = await supabase.from('documents').insert(testDoc);
    if (!error) {
      console.log(`✅ ¡ÉXITO! El valor válido es: "${status}"`);
      return;
    } else {
      console.log(`❌ "${status}" falló: ${error.message}`);
    }
  }
}

bruteForce();
