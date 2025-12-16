'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'

// Opciones de canal preferido
const CANALES = [
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'llamada', label: 'Llamada', icon: '📞' },
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'facebook', label: 'Facebook', icon: '👤' },
  { value: 'presencial', label: 'Presencial', icon: '🏪' },
  { value: 'otro', label: 'Otro', icon: '📋' }
]

export default function ClientesPage() {
  const router = useRouter()
  
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [totalClientes, setTotalClientes] = useState(0)

  const [formData, setFormData] = useState({
    telefono: '',
    nombres: '',
    apellidos: '',
    alias_whatsapp: '',
    canal_preferido: '',
    notas: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    checkAuth()
    cargarClientes()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarClientes()
    }, 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
    }
  }

  const cargarClientes = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Aplicar búsqueda si existe
      if (busqueda.trim()) {
        query = query.or(`telefono.ilike.%${busqueda}%,nombres.ilike.%${busqueda}%,apellidos.ilike.%${busqueda}%,alias_whatsapp.ilike.%${busqueda}%`)
      }

      const { data, error, count } = await query

      if (error) throw error
      setClientes(data || [])
      setTotalClientes(count || 0)
    } catch (error) {
      console.error('Error cargando clientes:', error)
    } finally {
      setLoading(false)
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
    
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido'
    } else if (!/^[0-9+\-\s()]+$/.test(formData.telefono)) {
      newErrors.telefono = 'Formato de teléfono inválido'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validarFormulario()) return

    setActionLoading(true)
    try {
      const datosCliente = {
        telefono: formData.telefono.trim(),
        nombres: formData.nombres.trim() || null,
        apellidos: formData.apellidos.trim() || null,
        alias_whatsapp: formData.alias_whatsapp.trim() || null,
        canal_preferido: formData.canal_preferido || null,
        notas: formData.notas.trim() || null,
        updated_at: new Date().toISOString()
      }

      let error

      if (modoEdicion && clienteEditando) {
        const resultado = await supabase
          .from('clientes')
          .update(datosCliente)
          .eq('id', clienteEditando.id)
        
        error = resultado.error
      } else {
        const resultado = await supabase
          .from('clientes')
          .insert([datosCliente])
        
        error = resultado.error
      }

      if (error) {
        if (error.code === '23505') {
          setErrors({ telefono: 'Este teléfono ya está registrado' })
          return
        }
        throw error
      }

      setShowModal(false)
      resetForm()
      cargarClientes()
    } catch (error) {
      alert(`Error al ${modoEdicion ? 'actualizar' : 'crear'} cliente: ` + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      telefono: '',
      nombres: '',
      apellidos: '',
      alias_whatsapp: '',
      canal_preferido: '',
      notas: ''
    })
    setErrors({})
    setModoEdicion(false)
    setClienteEditando(null)
  }

  const handleEditarCliente = (cliente) => {
    setModoEdicion(true)
    setClienteEditando(cliente)
    setFormData({
      telefono: cliente.telefono || '',
      nombres: cliente.nombres || '',
      apellidos: cliente.apellidos || '',
      alias_whatsapp: cliente.alias_whatsapp || '',
      canal_preferido: cliente.canal_preferido || '',
      notas: cliente.notas || ''
    })
    setShowModal(true)
  }

  const handleEliminarCliente = async (cliente) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar al cliente "${cliente.nombres || cliente.telefono}"?\n\nEsta acción no se puede deshacer.`
    )
    
    if (!confirmar) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', cliente.id)

      if (error) {
        if (error.code === '23503') {
          alert('No se puede eliminar el cliente porque tiene pedidos asociados.')
          return
        }
        throw error
      }

      cargarClientes()
    } catch (error) {
      alert('Error al eliminar: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const getNombreCompleto = (cliente) => {
    const partes = [cliente.nombres, cliente.apellidos].filter(Boolean)
    return partes.length > 0 ? partes.join(' ') : null
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <AdminLayout>
      {/* Header */}
      <header className="bg-white border-b-[3px] border-blue-elegant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-neutrals-black">
                Clientes
              </h1>
              <p className="text-neutrals-graySoft text-sm mt-1">
                {totalClientes} cliente{totalClientes !== 1 ? 's' : ''} registrado{totalClientes !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Buscador */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por teléfono, nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="input-chic pl-10 w-full sm:w-64"
                />
                <svg className="w-5 h-5 text-neutrals-graySoft absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Botón Nuevo Cliente */}
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Nuevo Cliente</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-elegant border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutrals-graySoft">Cargando clientes...</p>
            </div>
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-neutrals-grayBg rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-neutrals-graySoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-semibold text-neutrals-black mb-2">
              {busqueda ? 'No se encontraron clientes' : 'Sin clientes aún'}
            </h3>
            <p className="text-neutrals-graySoft mb-6">
              {busqueda 
                ? 'Intenta con otros términos de búsqueda'
                : 'Agrega tu primer cliente para comenzar'}
            </p>
            {!busqueda && (
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="btn-primary"
              >
                Agregar Cliente
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Tabla de Clientes */}
            <div className="card-premium overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutrals-grayBg border-b border-neutrals-grayBorder">
                      <th className="text-left py-4 px-4 font-semibold text-neutrals-grayStrong text-sm">Cliente</th>
                      <th className="text-left py-4 px-4 font-semibold text-neutrals-grayStrong text-sm">Teléfono</th>
                      <th className="text-left py-4 px-4 font-semibold text-neutrals-grayStrong text-sm hidden md:table-cell">Canal</th>
                      <th className="text-left py-4 px-4 font-semibold text-neutrals-grayStrong text-sm hidden lg:table-cell">Registro</th>
                      <th className="text-right py-4 px-4 font-semibold text-neutrals-grayStrong text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((cliente, index) => {
                      const nombreCompleto = getNombreCompleto(cliente)
                      const canalInfo = CANALES.find(c => c.value === cliente.canal_preferido)
                      
                      return (
                        <tr 
                          key={cliente.id}
                          className="border-b border-neutrals-grayBorder hover:bg-neutrals-grayBg/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-elegant to-blue-800 flex items-center justify-center text-white font-semibold text-sm">
                                {(cliente.nombres?.[0] || cliente.telefono?.[0] || '?').toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-neutrals-black">
                                  {nombreCompleto || 'Sin nombre'}
                                </p>
                                {cliente.alias_whatsapp && (
                                  <p className="text-xs text-neutrals-graySoft">
                                    @{cliente.alias_whatsapp}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <a 
                              href={`https://wa.me/${cliente.telefono.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-elegant hover:underline font-medium"
                            >
                              {cliente.telefono}
                            </a>
                          </td>
                          <td className="py-4 px-4 hidden md:table-cell">
                            {canalInfo ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-neutrals-grayBg rounded-md text-sm">
                                <span>{canalInfo.icon}</span>
                                <span>{canalInfo.label}</span>
                              </span>
                            ) : (
                              <span className="text-neutrals-graySoft text-sm">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4 hidden lg:table-cell text-sm text-neutrals-graySoft">
                            {formatearFecha(cliente.created_at)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              {/* Ver Pedidos */}
                              <Link
                                href={`/admin/pedidos?cliente=${cliente.id}`}
                                className="p-2 text-neutrals-graySoft hover:text-blue-elegant hover:bg-blue-elegant/10 rounded-lg transition-colors"
                                title="Ver pedidos"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                              </Link>
                              
                              {/* Editar */}
                              <button
                                onClick={() => handleEditarCliente(cliente)}
                                className="p-2 text-neutrals-graySoft hover:text-blue-elegant hover:bg-blue-elegant/10 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>

                              {/* Eliminar */}
                              <button
                                onClick={() => handleEliminarCliente(cliente)}
                                disabled={actionLoading}
                                className="p-2 text-neutrals-graySoft hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modal Crear/Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-premium max-w-lg w-full animate-fade-in-up">
            {/* Header del Modal */}
            <div className="flex justify-between items-center p-6 border-b border-neutrals-grayBorder">
              <div>
                <h3 className="font-display text-xl font-semibold text-neutrals-black">
                  {modoEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h3>
                <p className="text-sm text-neutrals-graySoft mt-1">
                  {modoEdicion ? 'Modifica los datos del cliente' : 'Solo el teléfono es obligatorio'}
                </p>
              </div>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }} 
                className="text-neutrals-graySoft hover:text-neutrals-black"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  Teléfono <span className="text-feedback-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutrals-graySoft">
                    📱
                  </span>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className={`input-chic pl-10 ${errors.telefono ? 'border-feedback-error' : ''}`}
                    placeholder="+57 300 123 4567"
                  />
                </div>
                {errors.telefono && (
                  <p className="text-feedback-error text-sm mt-1">{errors.telefono}</p>
                )}
              </div>

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                    Nombres
                  </label>
                  <input
                    type="text"
                    name="nombres"
                    value={formData.nombres}
                    onChange={handleChange}
                    className="input-chic"
                    placeholder="Juan Carlos"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    className="input-chic"
                    placeholder="García López"
                  />
                </div>
              </div>

              {/* Alias WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  Alias en WhatsApp
                </label>
                <input
                  type="text"
                  name="alias_whatsapp"
                  value={formData.alias_whatsapp}
                  onChange={handleChange}
                  className="input-chic"
                  placeholder="El nombre que aparece en WhatsApp"
                />
              </div>

              {/* Canal Preferido */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  Canal Preferido
                </label>
                <select
                  name="canal_preferido"
                  value={formData.canal_preferido}
                  onChange={handleChange}
                  className="input-chic"
                >
                  <option value="">Seleccionar canal...</option>
                  {CANALES.map(canal => (
                    <option key={canal.value} value={canal.value}>
                      {canal.icon} {canal.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  Notas
                </label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={3}
                  className="input-chic resize-none"
                  placeholder="Información adicional sobre el cliente..."
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 btn-primary"
                >
                  {actionLoading ? 'Guardando...' : (modoEdicion ? 'Guardar Cambios' : 'Crear Cliente')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
