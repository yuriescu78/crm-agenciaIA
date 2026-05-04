
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const formData = {
    first_name: 'Test',
    last_name: 'User',
    company: 'Test Co',
    email: 'test@example.com',
    phone: '123456789',
    city: 'Test City',
    status: 'Nuevo',
    summary: 'Test summary'
  };

  console.log("Testing insert with:", formData);
  const { data, error } = await supabase
    .from('clients')
    .insert([formData])
    .select()
    .single();

  if (error) {
    console.error("Insert failed!");
    console.error("Error Message:", error.message);
    console.error("Error Details:", error.details);
    console.error("Error Hint:", error.hint);
    console.error("Full Error:", error);
  } else {
    console.log("Insert successful!");
    console.log("Data:", data);
  }
}

testInsert();
