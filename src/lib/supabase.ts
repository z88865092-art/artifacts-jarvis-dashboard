import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL exists:', !!supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are missing!');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// AI Memory Functions
export const saveToMemory = async (key: string, value: any) => {
  const { data, error } = await supabase
    .from('ai_memory')
    .upsert({ key_name: key, value: JSON.stringify(value), updated_at: new Date() })
    .select();
  
  if (error) console.error('Save error:', error);
  return { data, error };
};

export const getFromMemory = async (key: string) => {
  const { data, error } = await supabase
    .from('ai_memory')
    .select('value')
    .eq('key_name', key)
    .single();
  
  if (error) return null;
  return data ? JSON.parse(data.value) : null;
};

export const getAllMemory = async () => {
  const { data, error } = await supabase
    .from('ai_memory')
    .select('*');
  
  return { data, error };
};

export const clearMemory = async () => {
  const { error } = await supabase
    .from('ai_memory')
    .delete()
    .neq('id', 0);
  
  return { error };
};
