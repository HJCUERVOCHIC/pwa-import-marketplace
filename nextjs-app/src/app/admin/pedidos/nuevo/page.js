'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'

// Canales de entrada
const CANALES_ENTRADA = [
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'llamada', label: 'Llamada', icon: '📞' },
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'facebook', label: 'Facebook', icon: '👤' },
  { value: 'presencial', label: 'Presencial', icon: '🏪' },
  { value: 'referido', label: 'Referido', icon: '🤝' },
  { value: 'otro', label: 'Otro', icon: '📋' }
]

export default function NuevoPedidoPage() {
  const router = useRouter()

  const [paso, setPaso] = useState(1) // 1: Buscar/Crear cliente, 2: Datos del pedido
  const [loading, setLoading] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Estado del cliente
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clientesEncontrados, setClientesEncontrados] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false)

  // Formulario de nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState({
    telefono: '',
    nombres: '',
    apellidos: '',
    alias_whatsapp: ''
  })
  const [errorsCliente, setErrorsCliente] = useState({})

  // Datos del pedido
  const [datosPedido, setDatosPedido] = useState({
    canal_entrada: '',
    notas_internas: ''
  })

  useEffect(() => {
    checkAuth()
  }, [])

  // Buscar clientes cuando cambia la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (busquedaCliente.trim().length >= 2) {
        buscarClientes()
      } else {
        setClientesEncontrados([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [busquedaCliente])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
    }
  }

  const buscarClientes = async () => {
    setBuscando(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .or(`telefono.ilike.%${busquedaCliente}%,nombres.ilike.%${busquedaCliente}%,apellidos.ilike.%${busquedaCliente}%,alias_whatsapp.ilike.%${busquedaCliente}%`)
        .limit(5)

      if (error) throw error
      setClientesEncontrados(data || [])
    } catch (error) {
      console.error('Error buscando clientes:', error)
    } finally {
      setBuscando(false)
    }
  }

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente)
    setBusquedaCliente('')
    setClientesEncontrados([])
    setMostrarFormCliente(false)
  }

  const handleChangeNuevoCliente = (e) => {
    const { name, value } = e.target
    setNuevoCliente(prev => ({ ...prev, [name]: value }))
    if (errorsCliente[name]) {
      setErrorsCliente(prev => ({ ...prev, [name]: null }))
    }
  }

  const crearNuevoCliente = async () => {
    // Validar teléfono
    if (!nuevoCliente.telefono.trim()) {
      setErrorsCliente({ telefono: 'El teléfono es requerido' })
      return
    }

    setActionLoading(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          telefono: nuevoCliente.telefono.trim(),
          nombres: nuevoCliente.nombres.trim() || null,
          apellidos: nuevoCliente.apellidos.trim() || null,
          alias_whatsapp: nuevoCliente.alias_whatsapp.trim() || null
        }])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          setErrorsCliente({ telefono: 'Este teléfono ya está registrado' })
          return
        }
        throw error
      }

      setClienteSeleccionado(data)
      setMostrarFormCliente(false)
      setNuevoCliente({ telefono: '', nombres: '', apellidos: '', alias_whatsapp: '' })
    } catch (error) {
      alert('Error al crear cliente: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const iniciarFormularioCliente = () => {
    setMostrarFormCliente(true)
    // Pre-llenar teléfono si la búsqueda parece un número
    if (/^[0-9+\-\s()]+$/.test(busquedaCliente)) {
      setNuevoCliente(prev => ({ ...prev, telefono: busquedaCliente }))
    }
  }

  const generarCodigoPedido = () => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `P-${year}-${random}`
  }

  const crearPedido = async () => {
    if (!clienteSeleccionado) {
      alert('Debe seleccionar un cliente')
      return
    }

    setActionLoading(true)
    try {
      const codigoPedido = generarCodigoPedido()

      const { data, error } = await supabase
        .from('pedidos')
        .insert([{
          codigo_pedido: codigoPedido,
          cliente_id: clienteSeleccionado.id,
          estado_pedido: 'nuevo',
          fecha_solicitud: new Date().toISOString(),
          canal_entrada: datosPedido.canal_entrada || null,
          notas_internas: datosPedido.notas_internas.trim() || null,
          total_items: 0,
          total_venta_cop: 0,
          total_costo_cop: 0,
          total_ganancia_cop: 0
        }])
        .select()
        .single()

      if (error) throw error

      // Redirigir al detalle del pedido
      router.push(`/admin/pedidos/${data.id}`)
    } catch (error) {
      alert('Error al crear pedido: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const getNombreCliente = (cliente) => {
    if (!cliente) return ''
    const partes = [cliente.nombres, cliente.apellidos].filter(Boolean)
    return partes.length > 0 ? partes.join(' ') : cliente.telefono
  }

  return (
    <AdminLayout>
      {/* Header */}
      <header className="bg-white border-b-[3px] border-blue-elegant">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/pedidos"
              className="p-2 hover:bg-neutrals-grayBg rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-neutrals-grayStrong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="font-display text-2xl font-semibold text-neutrals-black">
                Nuevo Pedido
              </h1>
              <p className="text-neutrals-graySoft text-sm">
                Paso {paso} de 2: {paso === 1 ? 'Seleccionar Cliente' : 'Datos del Pedido'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
            paso >= 1 ? 'bg-blue-elegant text-white' : 'bg-neutrals-grayBg text-neutrals-graySoft'
          }`}>
            {clienteSeleccionado ? '✓' : '1'}
          </div>
          <div className={`flex-1 h-1 rounded ${paso >= 2 ? 'bg-blue-elegant' : 'bg-neutrals-grayBg'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
            paso >= 2 ? 'bg-blue-elegant text-white' : 'bg-neutrals-grayBg text-neutrals-graySoft'
          }`}>
            2
          </div>
        </div>

        {/* PASO 1: Seleccionar/Crear Cliente */}
        {paso === 1 && (
          <div className="card-premium p-6">
            <h2 className="font-display text-xl font-semibold text-neutrals-black mb-2">
              ¿Para quién es el pedido?
            </h2>
            <p className="text-neutrals-graySoft text-sm mb-6">
              Busca un cliente existente o crea uno nuevo
            </p>

            {/* Cliente seleccionado */}
            {clienteSeleccionado ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-semibold">
                      {(clienteSeleccionado.nombres?.[0] || clienteSeleccionado.telefono?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-neutrals-black">
                        {getNombreCliente(clienteSeleccionado)}
                      </p>
                      <p className="text-sm text-neutrals-graySoft">
                        {clienteSeleccionado.telefono}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setClienteSeleccionado(null)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Buscador de clientes */}
                {!mostrarFormCliente && (
                  <div className="mb-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar por teléfono, nombre o alias..."
                        value={busquedaCliente}
                        onChange={(e) => setBusquedaCliente(e.target.value)}
                        className="input-chic pl-10 w-full"
                      />
                      <svg className="w-5 h-5 text-neutrals-graySoft absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {buscando && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-blue-elegant border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>

                    {/* Resultados de búsqueda */}
                    {clientesEncontrados.length > 0 && (
                      <div className="mt-2 border border-neutrals-grayBorder rounded-xl overflow-hidden">
                        {clientesEncontrados.map((cliente) => (
                          <button
                            key={cliente.id}
                            onClick={() => seleccionarCliente(cliente)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-neutrals-grayBg transition-colors text-left border-b border-neutrals-grayBorder last:border-b-0"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-elegant to-blue-800 flex items-center justify-center text-white font-semibold text-sm">
                              {(cliente.nombres?.[0] || cliente.telefono?.[0] || '?').toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-neutrals-black truncate">
                                {getNombreCliente(cliente)}
                              </p>
                              <p className="text-sm text-neutrals-graySoft truncate">
                                {cliente.telefono}
                                {cliente.alias_whatsapp && ` • @${cliente.alias_whatsapp}`}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Botón crear nuevo */}
                    {busquedaCliente.trim().length >= 2 && clientesEncontrados.length === 0 && !buscando && (
                      <div className="mt-4 text-center">
                        <p className="text-neutrals-graySoft text-sm mb-3">No se encontraron clientes</p>
                        <button
                          onClick={iniciarFormularioCliente}
                          className="btn-primary"
                        >
                          + Crear Nuevo Cliente
                        </button>
                      </div>
                    )}

                    {busquedaCliente.trim().length === 0 && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setMostrarFormCliente(true)}
                          className="text-blue-elegant hover:underline text-sm"
                        >
                          O crear un cliente nuevo directamente
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Formulario nuevo cliente */}
                {mostrarFormCliente && (
                  <div className="border border-neutrals-grayBorder rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-neutrals-black">Nuevo Cliente</h3>
                      <button
                        onClick={() => setMostrarFormCliente(false)}
                        className="text-sm text-neutrals-graySoft hover:text-neutrals-black"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutrals-grayStrong mb-1">
                        Teléfono <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        value={nuevoCliente.telefono}
                        onChange={handleChangeNuevoCliente}
                        className={`input-chic ${errorsCliente.telefono ? 'border-red-500' : ''}`}
                        placeholder="+57 300 123 4567"
                      />
                      {errorsCliente.telefono && (
                        <p className="text-red-500 text-sm mt-1">{errorsCliente.telefono}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-neutrals-grayStrong mb-1">
                          Nombres
                        </label>
                        <input
                          type="text"
                          name="nombres"
                          value={nuevoCliente.nombres}
                          onChange={handleChangeNuevoCliente}
                          className="input-chic"
                          placeholder="Juan Carlos"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutrals-grayStrong mb-1">
                          Apellidos
                        </label>
                        <input
                          type="text"
                          name="apellidos"
                          value={nuevoCliente.apellidos}
                          onChange={handleChangeNuevoCliente}
                          className="input-chic"
                          placeholder="García"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutrals-grayStrong mb-1">
                        Alias WhatsApp
                      </label>
                      <input
                        type="text"
                        name="alias_whatsapp"
                        value={nuevoCliente.alias_whatsapp}
                        onChange={handleChangeNuevoCliente}
                        className="input-chic"
                        placeholder="Nombre en WhatsApp"
                      />
                    </div>

                    <button
                      onClick={crearNuevoCliente}
                      disabled={actionLoading}
                      className="w-full btn-primary"
                    >
                      {actionLoading ? 'Creando...' : 'Crear y Seleccionar'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Botón continuar */}
            {clienteSeleccionado && (
              <button
                onClick={() => setPaso(2)}
                className="w-full btn-primary mt-4"
              >
                Continuar →
              </button>
            )}
          </div>
        )}

        {/* PASO 2: Datos del Pedido */}
        {paso === 2 && (
          <div className="card-premium p-6">
            <h2 className="font-display text-xl font-semibold text-neutrals-black mb-2">
              Datos del Pedido
            </h2>
            <p className="text-neutrals-graySoft text-sm mb-6">
              Información adicional (opcional)
            </p>

            {/* Resumen cliente */}
            <div className="bg-neutrals-grayBg rounded-xl p-4 mb-6">
              <p className="text-xs text-neutrals-graySoft mb-1">Cliente</p>
              <p className="font-semibold text-neutrals-black">
                {getNombreCliente(clienteSeleccionado)}
              </p>
              <p className="text-sm text-neutrals-graySoft">
                {clienteSeleccionado?.telefono}
              </p>
            </div>

            <div className="space-y-5">
              {/* Canal de entrada */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  ¿Cómo llegó el pedido?
                </label>
                <select
                  value={datosPedido.canal_entrada}
                  onChange={(e) => setDatosPedido(prev => ({ ...prev, canal_entrada: e.target.value }))}
                  className="input-chic"
                >
                  <option value="">Seleccionar canal...</option>
                  {CANALES_ENTRADA.map(canal => (
                    <option key={canal.value} value={canal.value}>
                      {canal.icon} {canal.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notas internas */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  Notas Internas
                </label>
                <textarea
                  value={datosPedido.notas_internas}
                  onChange={(e) => setDatosPedido(prev => ({ ...prev, notas_internas: e.target.value }))}
                  rows={3}
                  className="input-chic resize-none"
                  placeholder="Observaciones sobre el pedido..."
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setPaso(1)}
                className="flex-1 btn-secondary"
              >
                ← Atrás
              </button>
              <button
                onClick={crearPedido}
                disabled={actionLoading}
                className="flex-1 btn-primary"
              >
                {actionLoading ? 'Creando...' : 'Crear Pedido'}
              </button>
            </div>
          </div>
        )}
      </main>
    </AdminLayout>
  )
}
