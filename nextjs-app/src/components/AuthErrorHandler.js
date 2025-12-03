'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Componente que maneja errores de autenticación automáticamente
 * - Detecta tokens inválidos/expirados
 * - Limpia el storage automáticamente
 * - Redirige al login si es necesario
 */
export default function AuthErrorHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Listener de cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Eventos que indican problemas con tokens
      if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token renovado exitosamente')
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('🚪 Usuario cerró sesión')
        // Limpiar storage local por si acaso
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token')
          sessionStorage.clear()
        }
      }
    })

    // Verificar sesión actual
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Error al obtener sesión:', error.message)
          
          // Si el error es de token inválido, limpiar todo
          if (error.message.includes('refresh_token') || 
              error.message.includes('Invalid') ||
              error.message.includes('expired')) {
            
            console.log('🧹 Limpiando tokens inválidos...')
            
            // Hacer sign out forzado
            await supabase.auth.signOut()
            
            // Limpiar storage manualmente
            if (typeof window !== 'undefined') {
              localStorage.clear()
              sessionStorage.clear()
            }
            
            // Si estamos en ruta protegida, redirigir a login
            const rutasProtegidas = ['/admin']
            if (rutasProtegidas.some(ruta => pathname?.startsWith(ruta))) {
              console.log('🔄 Redirigiendo al login...')
              router.push('/auth')
            }
          }
        }
      } catch (err) {
        console.error('❌ Error crítico en verificación de sesión:', err)
      }
    }

    checkSession()

    // Cleanup
    return () => {
      subscription?.unsubscribe()
    }
  }, [router, pathname])

  return null // Este componente no renderiza nada
}