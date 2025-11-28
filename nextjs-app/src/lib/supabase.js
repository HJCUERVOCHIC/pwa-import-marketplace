import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variables de Supabase:')
  console.error('URL:', supabaseUrl)
  console.error('KEY:', supabaseAnonKey ? 'Definida' : 'No definida')
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)
