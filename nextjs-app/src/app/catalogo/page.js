import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

// Componente Logo
const LogoChic = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 80, height: 80 }
  }
  const { width, height } = sizes[size] || sizes.md
  
  return (
    <Image
      src="/logo.jpg"
      alt="Chic Import USA"
      width={width}
      height={height}
      className={`rounded-full ${className}`}
      priority
    />
  )
}

async function getListasPublicas() {
  const { data, error } = await supabase
    .from('listas_oferta')
    .select('*')
    .in('estado', ['publicada', 'cerrada'])
    .order('created_at', { ascending: false })
  
  if (error) return []
  return data || []
}

async function getProductosCount(idLista) {
  const { count, error } = await supabase
    .from('productos')
    .select('*', { count: 'exact', head: true })
    .eq('id_lista', idLista)
    .eq('estado', 'publicado')
  
  if (error) return 0
  return count || 0
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export const metadata = {
  title: 'Catálogo | Chic Import USA',
  description: 'Explora nuestro catálogo de productos importados premium.',
}

// Desactivar caché - siempre obtener datos frescos
export const dynamic = 'force-dynamic'

export default async function CatalogoPage() {
  const listas = await getListasPublicas()
  
  // Obtener conteo de productos para cada lista
  const listasConConteo = await Promise.all(
    listas.map(async (lista) => ({
      ...lista,
      productosCount: await getProductosCount(lista.id)
    }))
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Header Compacto Azul */}
      <nav 
        className="sticky top-0 z-50 px-4 py-3"
        style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <Link href="/catalogo" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-lg">
                <LogoChic size="sm" className="w-full h-full" />
              </div>
              <div>
                <h1 className="font-semibold text-white text-base leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Chic Import USA
                </h1>
                <p className="text-blue-200 text-[10px]">Productos Premium Importados</p>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Título de Sección */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            Nuestras Ofertas
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Selecciona una lista para ver los productos disponibles
          </p>
        </div>
      </div>

      {/* Grid de Listas */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        {listasConConteo.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl p-12 max-w-md mx-auto shadow-sm">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(30, 64, 175, 0.1)' }}
              >
                <svg className="w-8 h-8" style={{ color: '#1e40af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                No hay ofertas disponibles
              </h3>
              <p className="text-gray-500 text-sm">
                Próximamente tendremos nuevas ofertas para ti.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listasConConteo.map((lista) => (
              <Link 
                key={lista.id}
                href={`/catalogo/${lista.id}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                {/* Encabezado de la card */}
                <div 
                  className="p-5"
                  style={{ background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.05) 0%, rgba(30, 58, 138, 0.1) 100%)' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 
                        className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors"
                        style={{ fontFamily: 'Playfair Display, serif' }}
                      >
                        {lista.titulo}
                      </h3>
                      {lista.descripcion && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {lista.descripcion}
                        </p>
                      )}
                    </div>
                    <span className={`ml-3 flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                      lista.estado === 'publicada' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {lista.estado === 'publicada' ? 'Activa' : 'Cerrada'}
                    </span>
                  </div>
                </div>
                
                {/* Info de la lista */}
                <div className="p-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Productos */}
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {lista.productosCount} {lista.productosCount === 1 ? 'producto' : 'productos'}
                        </span>
                      </div>
                      
                      {/* Fecha */}
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {formatearFecha(lista.fecha_oferta || lista.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Flecha */}
                    <svg 
                      className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer Mínimo */}
      <footer className="bg-white border-t border-gray-100 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <LogoChic size="sm" />
              <span className="text-sm text-gray-600" style={{ fontFamily: 'Playfair Display, serif' }}>
                Chic Import USA
              </span>
            </div>
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}