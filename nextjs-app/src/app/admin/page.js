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
      className={`rounded-full shadow-lg ${className}`}
      priority
    />
  )
}

// Componente Donut Chart
const DonutChart = ({ data, total }) => {
  // Calcular ángulos para el gráfico
  let currentAngle = 0
  const segments = data.map((item, index) => {
    const angle = (item.count / total) * 360
    const startAngle = currentAngle
    currentAngle += angle
    return { ...item, startAngle, angle }
  })

  // Crear el gradiente cónico para CSS
  const conicGradient = segments.map((seg, i) => {
    const start = seg.startAngle
    const end = start + seg.angle
    return `${seg.color} ${start}deg ${end}deg`
  }).join(', ')

  return (
    <div className="flex items-center gap-6">
      {/* Donut */}
      <div className="relative w-[120px] h-[120px]">
        <div 
          className="w-full h-full rounded-full shadow-lg"
          style={{ 
            background: `conic-gradient(${conicGradient})`,
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.3), 0 0 20px rgba(212, 175, 55, 0.15)'
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[70px] h-[70px] bg-white rounded-full flex items-center justify-center">
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-neutrals-black">{total}</div>
              <div className="text-[10px] text-neutrals-graySoft">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-col gap-2">
        {data.map((item, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 text-sm px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-neutrals-grayStrong">{item.label}</span>
            <span className="ml-auto font-semibold text-neutrals-black">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [listaActiva, setListaActiva] = useState(null)
  const [productosPorCategoria, setProductosPorCategoria] = useState([])
  const [totalProductos, setTotalProductos] = useState(0)
  const [totalPedidos, setTotalPedidos] = useState(0)

  // Colores para las categorías del donut (paleta midnight + dorado)
  const categoryColors = {
    'Zapatos': '#0f172a',
    'Ropa': '#1e3a8a',
    'Bolsos': '#D4AF37',
    'Accesorios': '#3b82f6',
    'Otros': '#60a5fa',
    'default': '#94a3b8'
  }

  useEffect(() => {
    checkAuth()
    loadDashboardData()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }
    setUser(session.user)
  }

  const loadDashboardData = async () => {
    try {
      // 1. Obtener la lista más reciente publicada
      const { data: listaData, error: listaError } = await supabase
        .from('listas_oferta')
        .select('*')
        .eq('estado', 'publicada')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (listaError && listaError.code !== 'PGRST116') {
        console.error('Error cargando lista:', listaError)
      }

      if (listaData) {
        setListaActiva(listaData)

        // 2. Obtener productos de la lista activa agrupados por categoría
        const { data: productosData, error: productosError } = await supabase
          .from('productos')
          .select('categoria')
          .eq('id_lista', listaData.id)
          .in('estado', ['publicado', 'listo_para_publicar'])

        if (productosError) {
          console.error('Error cargando productos:', productosError)
        }

        if (productosData) {
          // Agrupar por categoría
          const categorias = {}
          productosData.forEach(p => {
            const cat = p.categoria || 'Otros'
            categorias[cat] = (categorias[cat] || 0) + 1
          })

          // Convertir a array para el donut
          const categoriasArray = Object.entries(categorias).map(([label, count]) => ({
            label,
            count,
            color: categoryColors[label] || categoryColors['default']
          }))

          // Ordenar por cantidad descendente
          categoriasArray.sort((a, b) => b.count - a.count)

          setProductosPorCategoria(categoriasArray)
          setTotalProductos(productosData.length)
        }

        // 3. Contar pedidos (cuando exista la tabla)
        setTotalPedidos(0) // Placeholder
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutrals-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-elegant border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutrals-graySoft">Cargando dashboard...</p>
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
                <Link href="/admin" className="nav-link active">
                  Dashboard
                </Link>
                <Link href="/admin/listas" className="nav-link">
                  Listas
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/catalogo" 
                target="_blank"
                className="btn-secondary text-sm hidden sm:flex"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Ver Catálogo
              </Link>
              
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
          <Link href="/admin" className="flex-1 py-3 text-center text-sm font-medium text-blue-elegant border-b-2 border-blue-elegant">
            Dashboard
          </Link>
          <Link href="/admin/listas" className="flex-1 py-3 text-center text-sm font-medium text-neutrals-graySoft">
            Listas
          </Link>
        </div>
      </div>

      {/* Header */}
      <header className="page-header py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in-up">
            <h1 className="font-display text-3xl font-semibold text-neutrals-black">
              Dashboard
            </h1>
            <p className="text-neutrals-grayStrong mt-1">
              Bienvenido, {user?.email}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {listaActiva ? (
          <>
            {/* Top Section: Lista Activa + Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Card Lista Activa - Midnight + Dorado */}
              <div 
                className="rounded-2xl p-6 text-white relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                  boxShadow: '0 10px 40px rgba(15, 23, 42, 0.5)'
                }}
              >
                {/* Decorative circles */}
                <div 
                  className="absolute -top-1/2 -right-[30%] w-[200px] h-[200px] rounded-full"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                />
                <div 
                  className="absolute -bottom-[30%] -left-[20%] w-[150px] h-[150px] rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                />

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-white mb-1">
                        {listaActiva.titulo}
                      </h3>
                      <p className="text-white/70 text-sm">
                        Publicada: {formatDate(listaActiva.created_at)}
                      </p>
                    </div>
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: 'linear-gradient(135deg, #D4AF37, #f4d03f)',
                        color: '#0f172a',
                        boxShadow: '0 4px 15px rgba(212, 175, 55, 0.5)'
                      }}
                    >
                      ✨ Activa
                    </span>
                  </div>

                  <div className="flex gap-8 mt-6">
                    <div>
                      <div 
                        className="font-display text-3xl font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #D4AF37, #f4d03f)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {totalProductos}
                      </div>
                      <div className="text-white/60 text-sm">Productos</div>
                    </div>
                    <div>
                      <div 
                        className="font-display text-3xl font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #D4AF37, #f4d03f)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        ${listaActiva.trm_lista?.toLocaleString('es-CO')}
                      </div>
                      <div className="text-white/60 text-sm">TRM</div>
                    </div>
                    <div>
                      <div 
                        className="font-display text-3xl font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #D4AF37, #f4d03f)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {listaActiva.tax_modo_lista === 'porcentaje' 
                          ? `${listaActiva.tax_porcentaje_lista}%` 
                          : `$${listaActiva.tax_usd_lista}`}
                      </div>
                      <div className="text-white/60 text-sm">TAX</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Donut Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h4 className="font-display text-lg font-semibold text-neutrals-black mb-6 flex items-center gap-2">
                  <span>📊</span> Productos por Categoría
                </h4>
                
                {productosPorCategoria.length > 0 ? (
                  <DonutChart data={productosPorCategoria} total={totalProductos} />
                ) : (
                  <div className="text-center py-8 text-neutrals-graySoft">
                    <p>No hay productos en esta lista</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pedidos */}
              <div className="bg-white rounded-2xl p-6 shadow-lg flex items-center gap-5 hover:shadow-xl transition-shadow">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
                    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.3)'
                  }}
                >
                  📦
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-neutrals-black">
                    {totalPedidos}
                  </div>
                  <div className="text-neutrals-graySoft">Pedidos recibidos</div>
                </div>
              </div>

              {/* Valor Vendido - Próximamente */}
              <div 
                className="rounded-2xl p-6 flex items-center gap-5"
                style={{
                  background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.2)'
                }}
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37, #f4d03f)',
                    boxShadow: '0 8px 20px rgba(212, 175, 55, 0.4)'
                  }}
                >
                  💰
                </div>
                <div>
                  <div 
                    className="font-display text-xl font-bold"
                    style={{ color: '#D4AF37' }}
                  >
                    Próximamente
                  </div>
                  <div className="text-white/60">Valor vendido</div>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="mt-8">
              <h3 className="font-display text-xl text-neutrals-black mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link 
                  href={`/admin/listas/${listaActiva.id}/productos`}
                  className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all group flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-blue-elegantLight rounded-xl flex items-center justify-center group-hover:bg-blue-elegant transition-colors"
                       style={{ backgroundColor: '#dbeafe' }}>
                    <svg className="w-6 h-6 text-blue-elegant group-hover:text-white transition-colors" style={{ color: '#1e40af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-neutrals-black">Ver Productos</p>
                    <p className="text-sm text-neutrals-graySoft">De la lista activa</p>
                  </div>
                  <svg className="w-5 h-5 text-neutrals-graySoft ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link 
                  href="/admin/listas"
                  className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all group flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-blue-elegant transition-colors"
                       style={{ backgroundColor: '#dbeafe' }}>
                    <svg className="w-6 h-6 group-hover:text-white transition-colors" style={{ color: '#1e40af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-neutrals-black">Gestionar Listas</p>
                    <p className="text-sm text-neutrals-graySoft">Ver todas las listas</p>
                  </div>
                  <svg className="w-5 h-5 text-neutrals-graySoft ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link 
                  href={`/catalogo/${listaActiva.id}`}
                  target="_blank"
                  className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all group flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-blue-elegant transition-colors"
                       style={{ backgroundColor: '#dbeafe' }}>
                    <svg className="w-6 h-6 group-hover:text-white transition-colors" style={{ color: '#1e40af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-neutrals-black">Ver Catálogo</p>
                    <p className="text-sm text-neutrals-graySoft">Como lo ven los clientes</p>
                  </div>
                  <svg className="w-5 h-5 text-neutrals-graySoft ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </>
        ) : (
          /* Estado vacío - No hay listas publicadas */
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl p-12 max-w-md mx-auto shadow-lg">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl"
                style={{
                  background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
                  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.3)'
                }}
              >
                📋
              </div>
              <h3 className="font-display text-2xl text-neutrals-black mb-2">
                No hay listas activas
              </h3>
              <p className="text-neutrals-graySoft mb-6">
                Crea y publica tu primera lista para ver las estadísticas aquí.
              </p>
              <Link
                href="/admin/listas"
                className="btn-primary inline-flex"
              >
                Ir a Listas
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}