'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminNavbar from './AdminNavbar'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/auth')
      return
    }
    
    setUser(session.user)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutrals-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-elegant border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutrals-graySoft">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutrals-ivory">
      <AdminNavbar />
      <main>
        {children}
      </main>
    </div>
  )
}