'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const CANALES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'referido', label: 'Referido' },
  { value: 'otro', label: 'Otro' }
]

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    telefono: '',
    nombres: '',
    apellidos: '',
    alias_whatsapp: '',
    canal_preferido: '',
    notas: ''
  })

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error) {
      setClientes(data || [])
    }
    setLoading(false)
  }

  const clientesFiltrados = clientes.filter(cliente => {
    const termino = busqueda.toLowerCase()
    return (
      cliente.telefono?.toLowerCase().includes(termino) ||
      cliente.nombres?.toLowerCase().includes(termino) ||
      cliente.apellidos?.toLowerCase().includes(termino) ||
      cliente.alias_whatsapp?.toLowerCase().includes(termino)
    )
  })

  const abrirModalNuevo = () => {
    setClienteEditando(null)
    setFormData({
      telefono: '',
      nombres: '',
      apellidos: '',
      alias_whatsapp: '',
      canal_preferido: '',
      notas: ''
    })
    setShowModal(true)
  }

  const abrirModalEditar = (cliente) => {
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.telefono.trim()) {
      alert('El teléfono es obligatorio')
      return
    }
    
    setSaving(true)
    
    try {
      if (clienteEditando) {
        // Actualizar
        const { error } = await supabase
          .from('clientes')
          .update({
            telefono: formData.telefono.trim(),
            nombres: formData.nombres.trim() || null,
            apellidos: formData.apellidos.trim() || null,
            alias_whatsapp: formData.alias_whatsapp.trim() || null,
            canal_preferido: formData.canal_preferido || null,
            notas: formData.notas.trim() || null
          })
          .eq('id', clienteEditando.id)
        
        if (error) throw error
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('clientes')
          .insert({
            telefono: formData.telefono.trim(),
            nombres: formData.nombres.trim() || null,
            apellidos: formData.apellidos.trim() || null,
            alias_whatsapp: formData.alias_whatsapp.trim() || null,
            canal_preferido: formData.canal_preferido || null,
            notas: formData.notas.trim() || null
          })
        
        if (error) {
          if (error.code === '23505') {
            throw new Error('Ya existe un cliente con este teléfono')
          }
          throw error
        }
      }
      
      setShowModal(false)
      cargarClientes()
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const eliminarCliente = async (cliente) => {
    if (!confirm(`¿Eliminar cliente ${cliente.telefono}?`)) return
    
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', cliente.id)
    
    if (error) {
      if (error.code === '23503') {
        alert('No se puede eliminar: el cliente tiene pedidos asociados')
      } else {
        alert('Error: ' + error.message)
      }
    } else {
      cargarClientes()
    }
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getNombreCompleto = (cliente) => {
    const partes = [cliente.nombres, cliente.apellidos].filter(Boolean)
    return partes.length > 0 ? partes.join(' ') : '-'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                Clientes
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestión de clientes para toma de pedidos
              </p>
            </div>
            <button
              onClick={abrirModalNuevo}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo cliente
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Buscador */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por teléfono, nombre o alias..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Lista de clientes */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {busqueda ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </h3>
            <p className="text-gray-500 text-sm">
              {busqueda ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer cliente'}
            </p>
          </div>
        ) : (
          <>
            {/* Vista desktop - Tabla */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Alias WhatsApp</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Canal</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Creado</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{cliente.telefono}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {getNombreCompleto(cliente)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {cliente.alias_whatsapp || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {cliente.canal_preferido ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {cliente.canal_preferido}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatearFecha(cliente.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirModalEditar(cliente)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Editar
                          </button>
                          <Link
                            href={`/admin/pedidos?cliente=${cliente.id}`}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Pedidos
                          </Link>
                          <button
                            onClick={() => eliminarCliente(cliente)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil - Cards */}
            <div className="md:hidden space-y-3">
              {clientesFiltrados.map((cliente) => (
                <div key={cliente.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{cliente.telefono}</p>
                      <p className="text-sm text-gray-600">{getNombreCompleto(cliente)}</p>
                    </div>
                    {cliente.canal_preferido && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {cliente.canal_preferido}
                      </span>
                    )}
                  </div>
                  
                  {cliente.alias_whatsapp && (
                    <p className="text-sm text-gray-500 mb-3">
                      Alias: {cliente.alias_whatsapp}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {formatearFecha(cliente.created_at)}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => abrirModalEditar(cliente)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Editar
                      </button>
                      <Link
                        href={`/admin/pedidos?cliente=${cliente.id}`}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        Pedidos
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Crear/Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                {clienteEditando ? 'Editar cliente' : 'Nuevo cliente'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="+57 300 000 0000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                  <input
                    type="text"
                    name="nombres"
                    value={formData.nombres}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alias WhatsApp</label>
                <input
                  type="text"
                  name="alias_whatsapp"
                  value={formData.alias_whatsapp}
                  onChange={handleChange}
                  placeholder="Nombre en WhatsApp"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Canal preferido</label>
                <select
                  name="canal_preferido"
                  value={formData.canal_preferido}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  {CANALES.map(canal => (
                    <option key={canal.value} value={canal.value}>{canal.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notas internas sobre el cliente..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
