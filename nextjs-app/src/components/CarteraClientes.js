'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// =====================================================
// UTILIDADES
// =====================================================

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0)
}

// =====================================================
// COMPONENTE: CARD DE CLIENTE CON DEUDA
// =====================================================

const ClienteDeudaCard = ({ cliente, onClick }) => {
  const porcentajePagado = cliente.total_ventas_cop > 0
    ? Math.round((cliente.total_abonado_cop / cliente.total_ventas_cop) * 100)
    : 100

  const nombreCompleto = cliente.alias_whatsapp || 
    `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim() || 
    'Sin nombre'

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all border border-neutrals-grayBorder cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-neutrals-black">{nombreCompleto}</h4>
          <p className="text-sm text-neutrals-graySoft">{cliente.telefono}</p>
        </div>
        {cliente.deuda_total_cop <= 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✓ Al día
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            ⚠ Debe
          </span>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="mb-3">
        <div className="h-2 bg-neutrals-grayBg rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              porcentajePagado >= 100 ? 'bg-green-500' : 'bg-blue-elegant'
            }`}
            style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="text-neutrals-graySoft">Pedidos:</span>
          <span className="ml-1 font-medium">{cliente.total_pedidos}</span>
        </div>
        <div>
          <span className="text-neutrals-graySoft">Con saldo:</span>
          <span className="ml-1 font-medium text-amber-600">{cliente.pedidos_con_saldo}</span>
        </div>
      </div>

      {/* Valores */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-neutrals-graySoft">Total compras</span>
          <span className="font-medium">{formatCurrency(cliente.total_ventas_cop)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutrals-graySoft">Total pagado</span>
          <span className="font-medium text-green-600">{formatCurrency(cliente.total_abonado_cop)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-neutrals-grayBorder">
          <span className="font-medium text-neutrals-black">Deuda</span>
          <span className={`font-bold ${cliente.deuda_total_cop > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {formatCurrency(cliente.deuda_total_cop)}
          </span>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTE PRINCIPAL: CARTERA DE CLIENTES
// =====================================================

export default function CarteraClientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos') // todos, con_deuda, al_dia
  const [busqueda, setBusqueda] = useState('')
  const [ordenPor, setOrdenPor] = useState('deuda_desc')

  // Cargar datos de cartera
  const cargarCartera = async () => {
    try {
      // Intentar usar la vista
      let { data, error } = await supabase
        .from('vista_deuda_clientes')
        .select('*')

      if (error) {
        // Si la vista no existe, hacer consulta manual
        console.log('Vista no disponible, usando consulta manual')
        
        const { data: clientesData, error: clientesError } = await supabase
          .from('clientes')
          .select(`
            id,
            telefono,
            nombres,
            apellidos,
            alias_whatsapp
          `)

        if (clientesError) throw clientesError

        // Para cada cliente, obtener sus pedidos
        const clientesConDeuda = await Promise.all(
          clientesData.map(async (cliente) => {
            const { data: pedidosData } = await supabase
              .from('pedidos')
              .select('total_venta_cop, total_abonado_cop, saldo_cop, estado_pedido')
              .eq('cliente_id', cliente.id)
              .not('estado_pedido', 'in', '(cancelado,rechazado)')

            const pedidos = pedidosData || []
            
            return {
              cliente_id: cliente.id,
              telefono: cliente.telefono,
              nombres: cliente.nombres,
              apellidos: cliente.apellidos,
              alias_whatsapp: cliente.alias_whatsapp,
              total_pedidos: pedidos.length,
              pedidos_con_saldo: pedidos.filter(p => (p.saldo_cop || 0) > 0).length,
              total_ventas_cop: pedidos.reduce((sum, p) => sum + (p.total_venta_cop || 0), 0),
              total_abonado_cop: pedidos.reduce((sum, p) => sum + (p.total_abonado_cop || 0), 0),
              deuda_total_cop: pedidos.reduce((sum, p) => sum + (p.saldo_cop || 0), 0)
            }
          })
        )

        data = clientesConDeuda
      }

      setClientes(data || [])
    } catch (err) {
      console.error('Error cargando cartera:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarCartera()
  }, [])

  // Filtrar y ordenar clientes
  const clientesFiltrados = clientes
    .filter(cliente => {
      // Filtro por estado de deuda
      if (filtro === 'con_deuda' && cliente.deuda_total_cop <= 0) return false
      if (filtro === 'al_dia' && cliente.deuda_total_cop > 0) return false

      // Filtro por búsqueda
      if (busqueda) {
        const search = busqueda.toLowerCase()
        const nombre = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.toLowerCase()
        const alias = (cliente.alias_whatsapp || '').toLowerCase()
        const telefono = (cliente.telefono || '').toLowerCase()
        
        return nombre.includes(search) || alias.includes(search) || telefono.includes(search)
      }

      return true
    })
    .sort((a, b) => {
      switch (ordenPor) {
        case 'deuda_desc':
          return b.deuda_total_cop - a.deuda_total_cop
        case 'deuda_asc':
          return a.deuda_total_cop - b.deuda_total_cop
        case 'nombre':
          return (a.nombres || '').localeCompare(b.nombres || '')
        default:
          return 0
      }
    })

  // Calcular totales
  const totales = {
    clientes: clientes.length,
    conDeuda: clientes.filter(c => c.deuda_total_cop > 0).length,
    totalVentas: clientes.reduce((sum, c) => sum + (c.total_ventas_cop || 0), 0),
    totalAbonado: clientes.reduce((sum, c) => sum + (c.total_abonado_cop || 0), 0),
    totalDeuda: clientes.reduce((sum, c) => sum + (c.deuda_total_cop || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Resumen general */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-2xl font-bold text-neutrals-black">{totales.clientes}</div>
          <div className="text-sm text-neutrals-graySoft">Clientes totales</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="text-2xl mb-1">⚠️</div>
          <div className="text-2xl font-bold text-amber-600">{totales.conDeuda}</div>
          <div className="text-sm text-neutrals-graySoft">Con deuda</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-lg font-bold text-neutrals-black">{formatCurrency(totales.totalVentas)}</div>
          <div className="text-sm text-neutrals-graySoft">Total ventas</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="text-2xl mb-1">📊</div>
          <div className="text-lg font-bold text-amber-600">{formatCurrency(totales.totalDeuda)}</div>
          <div className="text-sm text-neutrals-graySoft">Cartera total</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutrals-graySoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full pl-10 pr-4 py-2 border border-neutrals-grayBorder rounded-xl focus:ring-2 focus:ring-blue-elegant focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div className="flex gap-2">
            <button
              onClick={() => setFiltro('todos')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filtro === 'todos'
                  ? 'bg-blue-elegant text-white'
                  : 'bg-neutrals-grayBg text-neutrals-grayStrong hover:bg-neutrals-grayBorder'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltro('con_deuda')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filtro === 'con_deuda'
                  ? 'bg-amber-500 text-white'
                  : 'bg-neutrals-grayBg text-neutrals-grayStrong hover:bg-neutrals-grayBorder'
              }`}
            >
              Con deuda
            </button>
            <button
              onClick={() => setFiltro('al_dia')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filtro === 'al_dia'
                  ? 'bg-green-500 text-white'
                  : 'bg-neutrals-grayBg text-neutrals-grayStrong hover:bg-neutrals-grayBorder'
              }`}
            >
              Al día
            </button>
          </div>

          {/* Ordenar */}
          <select
            value={ordenPor}
            onChange={(e) => setOrdenPor(e.target.value)}
            className="px-4 py-2 border border-neutrals-grayBorder rounded-xl focus:ring-2 focus:ring-blue-elegant focus:border-transparent"
          >
            <option value="deuda_desc">Mayor deuda primero</option>
            <option value="deuda_asc">Menor deuda primero</option>
            <option value="nombre">Por nombre</option>
          </select>
        </div>
      </div>

      {/* Lista de clientes */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-elegant"></div>
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-md">
          <span className="text-4xl mb-4 block">🔍</span>
          <h3 className="text-lg font-medium text-neutrals-black mb-2">
            No se encontraron clientes
          </h3>
          <p className="text-neutrals-graySoft">
            {busqueda ? 'Intenta con otros términos de búsqueda' : 'No hay clientes que coincidan con el filtro'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientesFiltrados.map((cliente) => (
            <Link 
              key={cliente.cliente_id} 
              href={`/admin/pedidos?cliente=${cliente.cliente_id}`}
            >
              <ClienteDeudaCard cliente={cliente} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// =====================================================
// COMPONENTE: RESUMEN DEUDA EN DETALLE CLIENTE
// =====================================================

export function ResumenDeudaCliente({ clienteId }) {
  const [datos, setDatos] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data, error } = await supabase
          .from('pedidos')
          .select('total_venta_cop, total_abonado_cop, saldo_cop, estado_pedido')
          .eq('cliente_id', clienteId)
          .not('estado_pedido', 'in', '(cancelado,rechazado)')

        if (error) throw error

        const pedidos = data || []
        const totales = {
          total_pedidos: pedidos.length,
          total_ventas: pedidos.reduce((sum, p) => sum + (p.total_venta_cop || 0), 0),
          total_abonado: pedidos.reduce((sum, p) => sum + (p.total_abonado_cop || 0), 0),
          deuda_total: pedidos.reduce((sum, p) => sum + (p.saldo_cop || 0), 0)
        }

        setDatos(totales)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (clienteId) cargar()
  }, [clienteId])

  if (loading) {
    return <div className="animate-pulse h-24 bg-neutrals-grayBg rounded-xl" />
  }

  if (!datos) return null

  return (
    <div className="bg-gradient-to-r from-blue-elegant to-blue-elegant/80 rounded-xl p-4 text-white">
      <h4 className="font-medium mb-3 opacity-90">Resumen Financiero</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold">{formatCurrency(datos.total_ventas)}</div>
          <div className="text-sm opacity-75">Total compras</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{formatCurrency(datos.deuda_total)}</div>
          <div className="text-sm opacity-75">Deuda actual</div>
        </div>
      </div>
    </div>
  )
}
