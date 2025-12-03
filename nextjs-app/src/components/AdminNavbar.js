'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Logo Component
const LogoChic = ({ className = "w-8 h-8 sm:w-10 sm:h-10" }) => (
  <div className={`${className} flex items-center justify-center flex-shrink-0`}>
    <div className="w-full h-full rounded-full border-2 border-brand-primary bg-white flex items-center justify-center shadow-chic-sm">
      <span className="font-display text-brand-primary font-bold text-xs">CHIC</span>
    </div>
  </div>
)

export default function AdminNavbar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  // Determinar la página activa
  const isActive = (path) => {
    if (path === '/admin') {
      return pathname === '/admin'
    }
    return pathname?.startsWith(path)
  }

  return (
    <>
      {/* Main Navbar - Sticky */}
      <nav className="bg-white border-b border-neutrals-grayBorder sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            
            {/* Logo y Título - Compacto en móvil */}
            <Link href="/admin" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
              <LogoChic />
              <div className="min-w-0">
                <h1 className="font-display text-sm sm:text-base lg:text-lg font-semibold text-neutrals-black truncate">
                  Chic Import USA
                </h1>
                <p className="text-[10px] sm:text-xs text-neutrals-graySoft -mt-0.5 hidden sm:block">
                  Panel Admin
                </p>
              </div>
            </Link>
            
            {/* Desktop Navigation - Oculto en móvil */}
            <div className="hidden md:flex items-center gap-1">
              <Link 
                href="/admin" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin') && pathname === '/admin'
                    ? 'bg-blue-elegant/10 text-blue-elegant' 
                    : 'text-neutrals-graySoft hover:bg-neutrals-grayBg hover:text-neutrals-black'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/listas" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin/listas')
                    ? 'bg-blue-elegant/10 text-blue-elegant' 
                    : 'text-neutrals-graySoft hover:bg-neutrals-grayBg hover:text-neutrals-black'
                }`}
              >
                Listas
              </Link>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Ver Catálogo - Solo desktop */}
              <Link 
                href="/catalogo" 
                target="_blank"
                className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm text-neutrals-graySoft hover:text-blue-elegant transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Ver Catálogo</span>
              </Link>
              
              {/* Botón Salir - Responsive */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-neutrals-grayBorder rounded-lg text-sm text-neutrals-grayStrong hover:bg-neutrals-grayBg transition-colors min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Tabs - Solo en móvil */}
      <div className="md:hidden bg-white border-b border-neutrals-grayBorder sticky top-14 sm:top-16 z-40">
        <div className="flex">
          <Link 
            href="/admin" 
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              isActive('/admin') && pathname === '/admin'
                ? 'text-blue-elegant border-b-2 border-blue-elegant' 
                : 'text-neutrals-graySoft hover:text-neutrals-black'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            href="/admin/listas" 
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              isActive('/admin/listas')
                ? 'text-blue-elegant border-b-2 border-blue-elegant' 
                : 'text-neutrals-graySoft hover:text-neutrals-black'
            }`}
          >
            Listas
          </Link>
        </div>
      </div>
    </>
  )
}