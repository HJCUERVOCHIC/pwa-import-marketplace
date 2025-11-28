import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
}

/**
 * Cliente único de Supabase para toda la aplicación
 * Configurado con soporte para autenticación
 */
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'pwa-import-marketplace-auth',
  },
})

/**
 * Constantes de configuración de autenticación
 */
export const AUTH_CONFIG = {
  SESSION_TIMEOUT: Number(process.env.NEXT_PUBLIC_SESSION_TIMEOUT) || 86400000,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 10 * 60 * 1000,
}

export default supabase