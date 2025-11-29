'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      router.push('/admin')
    } catch (err) {
      setError(err.message === 'Invalid login credentials' 
        ? 'Credenciales inválidas. Verifica tu email y contraseña.'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutrals-ivory flex flex-col">
      {/* Background decorativo */}
      <div 
        className="absolute top-0 left-0 right-0 h-72"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        }}
      >
        {/* Círculos decorativos */}
        <div 
          className="absolute top-10 right-10 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'white' }}
        />
        <div 
          className="absolute bottom-0 left-20 w-48 h-48 rounded-full opacity-5"
          style={{ background: 'white' }}
        />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header con logo */}
            <div className="text-center pt-10 pb-6 px-8">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Image
                    src="/logo.jpg"
                    alt="Chic Import USA"
                    width={80}
                    height={80}
                    className="rounded-full shadow-lg"
                    style={{
                      boxShadow: '0 8px 30px rgba(212, 175, 55, 0.3)'
                    }}
                    priority
                  />
                </div>
              </div>
              <h1 className="font-display text-2xl font-semibold text-neutrals-black">
                Chic Import USA
              </h1>
              <p className="text-neutrals-graySoft text-sm mt-1">
                Panel de Administración
              </p>
            </div>

            {/* Divider */}
            <div className="px-8">
              <div className="h-px bg-gradient-to-r from-transparent via-neutrals-grayBorder to-transparent" />
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="p-8 pt-6">
              <div className="space-y-5">
                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-medium text-neutrals-grayStrong mb-2"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-chic"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-medium text-neutrals-grayStrong mb-2"
                  >
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-chic"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-6"
                style={{
                  background: loading ? '#E0E0E0' : 'linear-gradient(135deg, #1e40af, #1e3a8a)',
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Ingresando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Ingresar
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-neutrals-graySoft mt-6">
            © 2025 Chic Import USA. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}