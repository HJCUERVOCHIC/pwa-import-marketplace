import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import WhatsAppButtonCatalogo from './WhatsAppButtonCatalogo'

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

const CATEGORIAS = {
  calzado: { label: 'Calzado', icon: '👟' },
  ropa: { label: 'Ropa', icon: '👕' },
  tecnologia: { label: 'Tecnología', icon: '📱' },
  hogar: { label: 'Hogar', icon: '🏠' },
  deportes: { label: 'Deportes', icon: '⚽' },
  belleza: { label: 'Belleza', icon: '💄' },
  juguetes: { label: 'Juguetes', icon: '🧸' },
  otros: { label: 'Otros', icon: '📦' }
}

async function getLista(id) {
  const { data, error } = await supabase
    .from('listas_oferta')
    .select('*')
    .eq('id', id)
    .in('estado', ['publicada', 'cerrada'])
    .single()
  
  if (error) return null
  return data
}

async function getProductos(idLista) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id_lista', idLista)
    .eq('estado', 'publicado')
    .order('created_at', { ascending: false })
  
  if (error) return []
  return data || []
}

function formatearPrecioCOP(precio) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(precio)
}

export async function generateMetadata({ params }) {
  const { idLista } = await params
  const lista = await getLista(idLista)
  
  if (!lista) {
    return { title: 'Lista no encontrada' }
  }
  
  return {
    title: `${lista.titulo} | Chic Import USA`,
    description: lista.descripcion || `Productos de ${lista.titulo}`,
  }
}

// Desactivar caché - siempre obtener datos frescos
export const dynamic = 'force-dynamic'

export default async function ListaPublicaPage({ params }) {
  const { idLista } = await params
  const lista = await getLista(idLista)
  
  if (!lista) {
    notFound()
  }
  
  const productos = await getProductos(idLista)

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
            <Link 
              href="/catalogo"
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* Info de Lista - Compacta */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                {lista.titulo}
              </h2>
              <p className="text-xs text-gray-500">{productos.length} productos disponibles</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              lista.estado === 'publicada' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {lista.estado === 'publicada' ? 'Activa' : 'Cerrada'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Productos */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        {productos.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl p-12 max-w-md mx-auto shadow-sm">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(30, 64, 175, 0.1)' }}
              >
                <svg className="w-8 h-8" style={{ color: '#1e40af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                No hay productos disponibles
              </h3>
              <p className="text-gray-500 text-sm">
                Esta lista aún no tiene productos publicados.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {productos.map((producto) => {
              const categoriaInfo = CATEGORIAS[producto.categoria] || CATEGORIAS.otros
              
              return (
                <article 
                  key={producto.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  {/* Imagen */}
                  <Link href={`/catalogo/${idLista}/${producto.id}`} className="block">
                    <div className="aspect-square relative overflow-hidden bg-gray-100">
                      {producto.imagenes?.[0] ? (
                        <img
                          src={producto.imagenes[0]}
                          alt={producto.titulo}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Badge Categoría */}
                      <span 
                        className="absolute top-2 left-2 text-white text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(30, 64, 175, 0.9)' }}
                      >
                        {categoriaInfo.icon} {categoriaInfo.label}
                      </span>
                    </div>
                  </Link>
                  
                  {/* Info */}
                  <div className="p-3 flex-1 flex flex-col">
                    <Link href={`/catalogo/${idLista}/${producto.id}`}>
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight hover:text-blue-700 transition-colors">
                        {producto.titulo}
                      </h3>
                    </Link>
                    
                    {producto.marca && (
                      <p className="text-[11px] text-gray-500 mt-0.5">{producto.marca}</p>
                    )}
                    
                    {/* Precio */}
                    <p 
                      className="font-bold text-lg mt-auto pt-2"
                      style={{ color: '#1e40af', fontFamily: 'Playfair Display, serif' }}
                    >
                      {formatearPrecioCOP(producto.precio_final_cop)}
                    </p>
                    
                    {/* Botón WhatsApp */}
                    <div className="mt-2">
                      <WhatsAppButtonCatalogo producto={producto} idLista={idLista} />
                    </div>
                  </div>
                </article>
              )
            })}
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