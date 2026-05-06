const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rmajfovafnydcwmeyjub.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWpmb3ZhZm55ZGN3bWV5anViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyNzQ0NSwiZXhwIjoyMDkyODAzNDQ1fQ.S6e-R9UKQKT6SBiZ7HtCGCHrOKHv3Erh8NoviQb6D-k";
const supabase = createClient(supabaseUrl, supabaseKey);

async function finalTest() {
  const testDoc = {
    client_id: "f2ed6eea-d758-4a17-987e-b22998a61c71",
    name: "PRUEBA_BORRADOR.pdf",
    type: "Otro",
    status: "Archivado", // Probando con uno de los valores del MD
    google_drive_id: "final_id_" + Date.now(),
    storage_path: "test"
  };

  const { error } = await supabase.from('documents').insert(testDoc);
  if (error) {
    console.log('❌ FALLO:', error.message);
    
    // Si falla, probamos con 'Borrador'
    const { error: error2 } = await supabase.from('documents').insert({...testDoc, status: 'Borrador'});
    if (error2) {
       console.log('❌ FALLO 2 (Borrador):', error2.message);
    } else {
       console.log('✅ ¡ÉXITO CON Borrador!');
    }
  } else {
    console.log('✅ ¡ÉXITO CON Archivado!');
  }
}

finalTest();
