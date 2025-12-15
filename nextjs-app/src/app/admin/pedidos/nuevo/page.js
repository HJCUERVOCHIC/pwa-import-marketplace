'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CANALES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'referido', label: 'Referido' },
  { value: 'otro', label: 'Otro' }
]

export default function NuevoPedidoPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(1) // 1: buscar/crear cliente, 2: confirmar
  const [busqueda, setBusqueda] = useState('')
  const [clientes, setClientes] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [showFormCliente, setShowFormCliente] = useState(false)
  const [creandoPedido, setCreandoPedido] = useState(false)
  
  const [nuevoCliente, setNuevoCliente] = useState({
    telefono: '',
    nombres: '',
    apellidos: '',
    alias_whatsapp: '',
    canal_preferido: '',
    notas: ''
  })

  // Buscar clientes cuando cambia la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (busqueda.length >= 2) {
        buscarClientes()
      } else {
        setClientes([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  const buscarClientes = async () => {
    setBuscando(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .or(`telefono.ilike.%${busqueda}%,nombres.ilike.%${busqueda}%,apellidos.ilike.%${busqueda}%,alias_whatsapp.ilike.%${busqueda}%`)
      .limit(10)
    
    if (!error) {
      setClientes(data || [])
    }
    setBuscando(false)
  }

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente)
    setPaso(2)
  }

  const handleChangeNuevoCliente = (e) => {
    const { name, value } = e.target
    setNuevoCliente(prev => ({ ...prev, [name]: value }))
  }

  const crearNuevoCliente = async (e) => {
    e.preventDefault()
    
    if (!nuevoCliente.telefono.trim()) {
      alert('El teléfono es obligatorio')
      return
    }
    
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          telefono: nuevoCliente.telefono.trim(),
          nombres: nuevoCliente.nombres.trim() || null,
          apellidos: nuevoCliente.apellidos.trim() || null,
          alias_whatsapp: nuevoCliente.alias_whatsapp.trim() || null,
          canal_preferido: nuevoCliente.canal_preferido || null,
          notas: nuevoCliente.notas.trim() || null
        })
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Ya existe un cliente con este teléfono')
        }
        throw error
      }
      
      setClienteSeleccionado(data)
      setShowFormCliente(false)
      setPaso(2)
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const crearPedido = async () => {
    if (!clienteSeleccionado) return
    
    setCreandoPedido(true)
    
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: clienteSeleccionado.id,
          estado_pedido: 'nuevo',
          vendedor_user_id: user?.id || null
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Redirigir al detalle del pedido
      router.push(`/admin/pedidos/${data.id}`)
    } catch (error) {
      alert('Error al crear pedido: ' + error.message)
      setCreandoPedido(false)
    }
  }

  const getNombreCliente = (cliente) => {
    if (cliente.alias_whatsapp) return cliente.alias_whatsapp
    if (cliente.nombres || cliente.apellidos) {
      return [cliente.nombres, cliente.apellidos].filter(Boolean).join(' ')
    }
    return cliente.telefono
  }

  const volverPaso1 = () => {
    setClienteSeleccionado(null)
    setPaso(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/pedidos"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                Nuevo pedido
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {paso === 1 ? 'Paso 1: Selecciona o crea un cliente' : 'Paso 2: Confirma el pedido'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Indicador de pasos */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${paso >= 1 ? 'text-blue-800' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${paso >= 1 ? 'bg-blue-800 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="font-medium hidden sm:inline">Cliente</span>
          </div>
          <div className={`flex-1 h-1 rounded ${paso >= 2 ? 'bg-blue-800' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center gap-2 ${paso >= 2 ? 'text-blue-800' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${paso >= 2 ? 'bg-blue-800 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="font-medium hidden sm:inline">Confirmar</span>
          </div>
        </div>

        {paso === 1 && (
          <>
            {/* Buscador de clientes */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Buscar cliente existente</h2>
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
              
              {/* Resultados */}
              {buscando ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-800"></div>
                </div>
              ) : clientes.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {clientes.map((cliente) => (
                    <button
                      key={cliente.id}
                      onClick={() => seleccionarCliente(cliente)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{getNombreCliente(cliente)}</p>
                        <p className="text-sm text-gray-500">{cliente.telefono}</p>
                      </div>
                      <span className="text-blue-600 font-medium text-sm">Seleccionar →</span>
                    </button>
                  ))}
                </div>
              ) : busqueda.length >= 2 ? (
                <p className="text-center text-gray-500 py-6">No se encontraron clientes</p>
              ) : null}
            </div>

            {/* Crear nuevo cliente */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">¿No encuentras el cliente?</h2>
                  <p className="text-sm text-gray-500">Registra un nuevo cliente</p>
                </div>
                {!showFormCliente && (
                  <button
                    onClick={() => setShowFormCliente(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Registrar cliente
                  </button>
                )}
              </div>
              
              {showFormCliente && (
                <form onSubmit={crearNuevoCliente} className="space-y-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={nuevoCliente.telefono}
                      onChange={handleChangeNuevoCliente}
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
                        value={nuevoCliente.nombres}
                        onChange={handleChangeNuevoCliente}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                      <input
                        type="text"
                        name="apellidos"
                        value={nuevoCliente.apellidos}
                        onChange={handleChangeNuevoCliente}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alias WhatsApp</label>
                    <input
                      type="text"
                      name="alias_whatsapp"
                      value={nuevoCliente.alias_whatsapp}
                      onChange={handleChangeNuevoCliente}
                      placeholder="Nombre en WhatsApp"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Canal preferido</label>
                    <select
                      name="canal_preferido"
                      value={nuevoCliente.canal_preferido}
                      onChange={handleChangeNuevoCliente}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {CANALES.map(canal => (
                        <option key={canal.value} value={canal.value}>{canal.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowFormCliente(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Creando...' : 'Crear y continuar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}

        {paso === 2 && clienteSeleccionado && (
          <>
            {/* Card cliente seleccionado */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Cliente seleccionado</p>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {getNombreCliente(clienteSeleccionado)}
                  </h2>
                  <p className="text-gray-600 mt-1">{clienteSeleccionado.telefono}</p>
                  {clienteSeleccionado.canal_preferido && (
                    <span className="inline-flex items-center px-2.5 py-0.5 mt-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {clienteSeleccionado.canal_preferido}
                    </span>
                  )}
                  {clienteSeleccionado.notas && (
                    <p className="text-sm text-gray-500 mt-3 italic">"{clienteSeleccionado.notas}"</p>
                  )}
                </div>
                <button
                  onClick={volverPaso1}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Confirmar creación */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Crear pedido para este cliente?
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Se creará un nuevo pedido en estado "Nuevo" y podrás agregar artículos inmediatamente.
                </p>
                <div className="flex gap-3 max-w-sm mx-auto">
                  <button
                    onClick={volverPaso1}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cambiar cliente
                  </button>
                  <button
                    onClick={crearPedido}
                    disabled={creandoPedido}
                    className="flex-1 px-4 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50 font-medium"
                  >
                    {creandoPedido ? 'Creando...' : 'Crear pedido'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
