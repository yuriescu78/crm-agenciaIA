const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rmajfovafnydcwmeyjub.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWpmb3ZhZm55ZGN3bWV5anViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyNzQ0NSwiZXhwIjoyMDkyODAzNDQ1fQ.S6e-R9UKQKT6SBiZ7HtCGCHrOKHv3Erh8NoviQb6D-k";
const supabase = createClient(supabaseUrl, supabaseKey);

async function findValidValues() {
  const types = ['Otro', 'PDF', 'documento'];
  const statuses = ['Pendiente', 'Nuevo', 'Activo'];
  
  for (const t of types) {
    for (const s of statuses) {
      const { error } = await supabase.from('documents').insert({
        client_id: "f2ed6eea-d758-4a17-987e-b22998a61c71",
        name: `TEST_${t}_${s}.pdf`,
        google_drive_id: `id_${t}_${s}_${Date.now()}`,
        storage_path: 'test',
        type: t,
        status: s
      });
      if (error) {
        console.log(`❌ Tipo: ${t}, Status: ${s} -> ${error.message}`);
      } else {
        console.log(`✅ ¡ÉXITO!: Tipo=${t}, Status=${s}`);
        return;
      }
    }
  }
}

findValidValues();
