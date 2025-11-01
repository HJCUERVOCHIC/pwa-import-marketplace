/**
 * Re-exportación del cliente de Supabase desde services
 * Esto asegura que toda la app use la misma instancia
 */
export { supabase, AUTH_CONFIG } from '@/services/supabaseClient'
export { default } from '@/services/supabaseClient'