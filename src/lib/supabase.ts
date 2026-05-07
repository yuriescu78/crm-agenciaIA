import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log("SUPABASE: Inicializando cliente...");
console.log("SUPABASE URL:", supabaseUrl ? "Presente (comienza por " + supabaseUrl.substring(0, 15) + "...)" : "FALTA URL");
console.log("SUPABASE KEY:", supabaseAnonKey ? "Presente (longitud: " + supabaseAnonKey.length + ")" : "FALTA KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials missing! Check your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
