'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

// Componente Logo reutilizable
const LogoChic = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 80, height: 80 },
    xl: { width: 120, height: 120 }
  }
  
  const { width, height } = sizes[size] || sizes.md
  
  return (
    <Image
      src="/logo.jpg"
      alt="Chic Import USA"
      width={width}
      height={height}
      className={`rounded-full shadow-chic-sm ${className}`}
      priority
    />
  )
}

const ESTADOS_LISTA = {
  borrador: { label: 'Borrador', class: 'badge-warning', icon: '📝' },
  publicada: { label: 'Publicada', class: 'badge-success', icon: '✅' },
  cerrada: { label: 'Cerrada', class: 'badge-neutral', icon: '🔒' },
  archivada: { label: 'Archivada', class: 'badge-error', icon: '📦' }
}

const ITEMS_PER_PAGE = 6

export default function ListasPage() {
  const router = useRouter()
  const [listas, setListas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Nuevos estados para filtro y paginación
  const [estadoFiltro, setEstadoFiltro] = useState('publicada')
  const [showAll, setShowAll] = useState(false)
  const [totalPorEstado, setTotalPorEstado] = useState({
    borrador: 0,
    publicada: 0,
    cerrada: 0,
    archivada: 0
  })

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_oferta: '',
    trm_lista: '',
    tax_modo_lista: 'porcentaje',
    tax_porcentaje_lista: '',
    tax_usd_lista: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    checkAuth()
    cargarListas()
    cargarTotalesPorEstado()
  }, [estadoFiltro])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
    }
  }

  const cargarListas = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('listas_oferta')
        .select('*')
        .eq('estado', estadoFiltro)
        .order('created_at', { ascending: false })

      if (error) throw error
      setListas(data || [])
    } catch (error) {
      console.error('Error cargando listas:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarTotalesPorEstado = async () => {
    try {
      // Contar listas por cada estado
      const estados = ['borrador', 'publicada', 'cerrada', 'archivada']
      const totales = {}
      
      for (const estado of estados) {
        const { count, error } = await supabase
          .from('listas_oferta')
          .select('*', { count: 'exact', head: true })
          .eq('estado', estado)
        
        if (!error) {
          totales[estado] = count || 0
        }
      }
      
      setTotalPorEstado(totales)
    } catch (error) {
      console.error('Error cargando totales:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validarFormulario = () => {
    const newErrors = {}
    if (!formData.titulo.trim() || formData.titulo.length < 3) {
      newErrors.titulo = 'El título debe tener al menos 3 caracteres'
    }
    if (!formData.trm_lista || parseFloat(formData.trm_lista) <= 0) {
      newErrors.trm_lista = 'El TRM debe ser mayor a 0'
    }
    if (formData.tax_modo_lista === 'porcentaje') {
      if (!formData.tax_porcentaje_lista || parseFloat(formData.tax_porcentaje_lista) < 0) {
        newErrors.tax_porcentaje_lista = 'El porcentaje de TAX debe ser 0 o mayor'
      }
    } else {
      if (!formData.tax_usd_lista || parseFloat(formData.tax_usd_lista) < 0) {
        newErrors.tax_usd_lista = 'El valor USD de TAX debe ser 0 o mayor'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validarFormulario()) return

    setActionLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const nuevaLista = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim() || null,
        fecha_oferta: formData.fecha_oferta || null,
        trm_lista: parseFloat(formData.trm_lista),
        tax_modo_lista: formData.tax_modo_lista,
        tax_porcentaje_lista: formData.tax_modo_lista === 'porcentaje' 
          ? parseFloat(formData.tax_porcentaje_lista) 
          : null,
        tax_usd_lista: formData.tax_modo_lista === 'fijo' 
          ? parseFloat(formData.tax_usd_lista) 
          : null,
        estado: 'borrador',
        creado_por: session?.user?.id
      }

      const { error } = await supabase
        .from('listas_oferta')
        .insert([nuevaLista])

      if (error) throw error

      setShowModal(false)
      resetForm()
      // Cambiar al filtro de borrador para ver la nueva lista
      setEstadoFiltro('borrador')
      cargarListas()
      cargarTotalesPorEstado()
    } catch (error) {
      alert('Error al crear la lista: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      fecha_oferta: '',
      trm_lista: '',
      tax_modo_lista: 'porcentaje',
      tax_porcentaje_lista: '',
      tax_usd_lista: ''
    })
    setErrors({})
  }

  const handlePublicar = async (lista) => {
    setActionLoading(true)
    try {
      await supabase
        .from('listas_oferta')
        .update({ estado: 'publicada' })
        .eq('id', lista.id)
      cargarListas()
      cargarTotalesPorEstado()
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCerrar = async (lista) => {
    setActionLoading(true)
    try {
      await supabase
        .from('listas_oferta')
        .update({ estado: 'cerrada' })
        .eq('id', lista.id)
      cargarListas()
      cargarTotalesPorEstado()
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleArchivar = async (lista) => {
    if (!confirm('¿Estás seguro de archivar esta lista?')) return
    
    setActionLoading(true)
    try {
      await supabase
        .from('listas_oferta')
        .update({ estado: 'archivada' })
        .eq('id', lista.id)
      cargarListas()
      cargarTotalesPorEstado()
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  // Listas a mostrar (con límite de 6 o todas)
  const listasVisibles = showAll ? listas : listas.slice(0, ITEMS_PER_PAGE)
  const hayMasListas = listas.length > ITEMS_PER_PAGE

  if (loading && listas.length === 0) {
    return (
      <div className="min-h-screen bg-neutrals-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-elegant border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutrals-graySoft">Cargando listas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutrals-ivory">
      {/* Navbar Admin */}
      <nav className="navbar-chic sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-3">
                <LogoChic size="md" />
                <div>
                  <h1 className="font-display text-lg font-semibold text-neutrals-black">
                    Chic Import USA
                  </h1>
                  <p className="text-xs text-neutrals-graySoft -mt-1">Panel Admin</p>
                </div>
              </Link>
              
              <div className="hidden sm:flex items-center gap-1 ml-6">
                <Link href="/admin" className="nav-link">
                  Dashboard
                </Link>
                <Link href="/admin/listas" className="nav-link active">
                  Listas
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="btn-primary text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Nueva Lista</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="p-2 text-neutrals-graySoft hover:text-neutrals-black hover:bg-neutrals-grayBg rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className="sm:hidden bg-white border-b border-neutrals-grayBorder">
        <div className="flex">
          <Link href="/admin" className="flex-1 py-3 text-center text-sm font-medium text-neutrals-graySoft">
            Dashboard
          </Link>
          <Link href="/admin/listas" className="flex-1 py-3 text-center text-sm font-medium text-blue-elegant border-b-2 border-blue-elegant">
            Listas
          </Link>
        </div>
      </div>

      {/* Header */}
      <header className="page-header py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in-up">
              <h1 className="font-display text-3xl font-semibold text-neutrals-black">
                Gestión de Listas
              </h1>
              <p className="text-neutrals-grayStrong mt-1">
                Administra tus catálogos de productos
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Filtros por Estado */}
      <div className="bg-white border-b border-neutrals-grayBorder sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-3 overflow-x-auto">
            {Object.entries(ESTADOS_LISTA).map(([estado, info]) => (
              <button
                key={estado}
                onClick={() => {
                  setEstadoFiltro(estado)
                  setShowAll(false)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  estadoFiltro === estado
                    ? 'bg-blue-elegant text-white shadow-md'
                    : 'bg-neutrals-grayBg text-neutrals-grayStrong hover:bg-neutrals-grayBorder'
                }`}
              >
                <span>{info.icon}</span>
                <span>{info.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  estadoFiltro === estado
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-neutrals-graySoft'
                }`}>
                  {totalPorEstado[estado] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-blue-elegant border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutrals-graySoft">Cargando...</p>
          </div>
        ) : listas.length === 0 ? (
          <div className="text-center py-16">
            <div className="card-premium p-12 max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-elegant-light rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                {ESTADOS_LISTA[estadoFiltro]?.icon || '📋'}
              </div>
              <h3 className="font-display text-xl text-neutrals-black mb-2">
                No hay listas {ESTADOS_LISTA[estadoFiltro]?.label.toLowerCase()}s
              </h3>
              <p className="text-neutrals-graySoft mb-6">
                {estadoFiltro === 'publicada' 
                  ? 'Publica una lista en borrador para verla aquí.'
                  : estadoFiltro === 'borrador'
                  ? 'Crea una nueva lista para comenzar.'
                  : `No tienes listas en estado "${ESTADOS_LISTA[estadoFiltro]?.label}".`}
              </p>
              {estadoFiltro === 'borrador' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary"
                >
                  Crear Nueva Lista
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Grid de Listas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listasVisibles.map((lista, index) => {
                const estadoInfo = ESTADOS_LISTA[lista.estado] || ESTADOS_LISTA.borrador
                return (
                  <article 
                    key={lista.id} 
                    className="card-premium overflow-hidden stagger-item"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Card Header */}
                    <div className="bg-white p-5 border-b border-neutrals-grayBorder">
                      <div className="flex items-start justify-between">
                        <h3 className="font-display text-lg font-semibold text-neutrals-black line-clamp-1">
                          {lista.titulo}
                        </h3>
                        <span className={`badge ${estadoInfo.class} ml-2 flex-shrink-0`}>
                          {estadoInfo.label}
                        </span>
                      </div>
                      {lista.descripcion && (
                        <p className="text-sm text-neutrals-graySoft mt-1 line-clamp-2">
                          {lista.descripcion}
                        </p>
                      )}
                      {/* Fecha de creación/publicación */}
                      <div className="flex items-center gap-1 mt-3 text-xs text-neutrals-graySoft">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Creada: {formatDate(lista.created_at)}</span>
                      </div>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-neutrals-grayBg rounded-lg p-3">
                          <p className="text-xs text-neutrals-graySoft">TRM</p>
                          <p className="font-semibold text-neutrals-black">
                            ${lista.trm_lista?.toLocaleString('es-CO')}
                          </p>
                        </div>
                        <div className="bg-neutrals-grayBg rounded-lg p-3">
                          <p className="text-xs text-neutrals-graySoft">TAX</p>
                          <p className="font-semibold text-neutrals-black">
                            {lista.tax_modo_lista === 'porcentaje' 
                              ? `${lista.tax_porcentaje_lista}%` 
                              : `$${lista.tax_usd_lista} USD`}
                          </p>
                        </div>
                      </div>
                      
                      {/* Acciones - Estilo Acciones Rápidas */}
                      <div className="flex flex-col gap-2">
                        {/* Acción Principal: Ver Productos */}
                        <Link
                          href={`/admin/listas/${lista.id}/productos`}
                          className="action-item group"
                        >
                          <div className="action-icon">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div className="action-text">
                            <span className="action-title">Ver Productos</span>
                            <span className="action-subtitle">Gestionar catálogo</span>
                          </div>
                          <svg className="w-4 h-4 text-neutrals-graySoft group-hover:translate-x-1 group-hover:text-blue-elegant transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                        
                        {/* Acciones para Borrador */}
                        {lista.estado === 'borrador' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handlePublicar(lista)}
                              disabled={actionLoading}
                              className="action-item compact group"
                            >
                              <div className="action-icon success">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="action-title text-sm">Publicar</span>
                            </button>
                            <button
                              onClick={() => handleArchivar(lista)}
                              disabled={actionLoading}
                              className="action-item compact group"
                            >
                              <div className="action-icon danger">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                              </div>
                              <span className="action-title text-sm">Archivar</span>
                            </button>
                          </div>
                        )}
                        
                        {/* Acciones para Publicada */}
                        {lista.estado === 'publicada' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleCerrar(lista)}
                              disabled={actionLoading}
                              className="action-item compact group"
                            >
                              <div className="action-icon warning">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11.364-8.364l-1.414 1.414" />
                                </svg>
                              </div>
                              <span className="action-title text-sm">Cerrar</span>
                            </button>
                            <button
                              onClick={() => handleArchivar(lista)}
                              disabled={actionLoading}
                              className="action-item compact group"
                            >
                              <div className="action-icon danger">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                              </div>
                              <span className="action-title text-sm">Archivar</span>
                            </button>
                          </div>
                        )}
                        
                        {/* Acciones para Cerrada */}
                        {lista.estado === 'cerrada' && (
                          <button
                            onClick={() => handleArchivar(lista)}
                            disabled={actionLoading}
                            className="action-item compact group w-full"
                          >
                            <div className="action-icon danger">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                            </div>
                            <div className="action-text">
                              <span className="action-title text-sm">Archivar Lista</span>
                              <span className="action-subtitle">Mover a archivo</span>
                            </div>
                            <svg className="w-4 h-4 text-neutrals-graySoft group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Botón Ver Más / Ver Menos */}
            {hayMasListas && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  {showAll ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Ver todas ({listas.length - ITEMS_PER_PAGE} más)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal Crear Lista */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-premium max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-neutrals-grayBorder sticky top-0 bg-white rounded-t-chic">
              <h3 className="font-display text-xl font-semibold text-neutrals-black">
                Crear Nueva Lista
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-neutrals-graySoft hover:text-neutrals-black"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  Título <span className="text-feedback-error">*</span>
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className={`input-chic ${errors.titulo ? 'border-feedback-error' : ''}`}
                  placeholder="Ej: Ofertas Navidad 2025"
                />
                {errors.titulo && (
                  <p className="text-feedback-error text-sm mt-1">{errors.titulo}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  className="input-chic resize-none"
                  placeholder="Descripción opcional de la lista"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  Fecha de Oferta
                </label>
                <input
                  type="date"
                  name="fecha_oferta"
                  value={formData.fecha_oferta}
                  onChange={handleChange}
                  className="input-chic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  TRM (Tasa de cambio) <span className="text-feedback-error">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-neutrals-grayStrong font-medium text-lg">$</span>
                  <input
                    type="number"
                    name="trm_lista"
                    value={formData.trm_lista}
                    onChange={handleChange}
                    className={`input-chic flex-1 ${errors.trm_lista ? 'border-feedback-error' : ''}`}
                    placeholder="4000"
                    step="0.01"
                  />
                </div>
                {errors.trm_lista && (
                  <p className="text-feedback-error text-sm mt-1">{errors.trm_lista}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  Modo de TAX
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tax_modo_lista"
                      value="porcentaje"
                      checked={formData.tax_modo_lista === 'porcentaje'}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-elegant"
                    />
                    <span className="text-sm">Porcentaje (%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tax_modo_lista"
                      value="fijo"
                      checked={formData.tax_modo_lista === 'fijo'}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-elegant"
                    />
                    <span className="text-sm">Valor Fijo (USD)</span>
                  </label>
                </div>
              </div>

              {formData.tax_modo_lista === 'porcentaje' ? (
                <div>
                  <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                    Porcentaje de TAX <span className="text-feedback-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="tax_porcentaje_lista"
                      value={formData.tax_porcentaje_lista}
                      onChange={handleChange}
                      className={`input-chic pr-8 ${errors.tax_porcentaje_lista ? 'border-feedback-error' : ''}`}
                      placeholder="15"
                      step="0.01"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutrals-graySoft">%</span>
                  </div>
                  {errors.tax_porcentaje_lista && (
                    <p className="text-feedback-error text-sm mt-1">{errors.tax_porcentaje_lista}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                    Valor de TAX (USD) <span className="text-feedback-error">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-neutrals-grayStrong font-medium text-lg">$</span>
                    <input
                      type="number"
                      name="tax_usd_lista"
                      value={formData.tax_usd_lista}
                      onChange={handleChange}
                      className={`input-chic flex-1 ${errors.tax_usd_lista ? 'border-feedback-error' : ''}`}
                      placeholder="5"
                      step="0.01"
                    />
                  </div>
                  {errors.tax_usd_lista && (
                    <p className="text-feedback-error text-sm mt-1">{errors.tax_usd_lista}</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 btn-primary"
                >
                  {actionLoading ? 'Creando...' : 'Crear Lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
