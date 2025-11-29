import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

// Componente Logo reutilizable
const LogoChic = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
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

export default async function ListaPublicaPage({ params }) {
  const { idLista } = await params
  const lista = await getLista(idLista)
  
  if (!lista) {
    notFound()
  }
  
  const productos = await getProductos(idLista)

  return (
    <div className="min-h-screen bg-neutrals-ivory flex flex-col">
      {/* Navbar */}
      <nav className="navbar-chic sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/catalogo" className="flex items-center gap-3">
              <LogoChic size="md" />
              <div>
                <h1 className="font-display text-lg font-semibold text-neutrals-black">
                  Chic Import USA
                </h1>
                <p className="text-xs text-neutrals-graySoft -mt-1">Productos Premium</p>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-neutrals-grayBorder">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center text-sm">
            <Link href="/catalogo" className="text-neutrals-graySoft hover:text-brand-primary transition-colors">
              Catálogo
            </Link>
            <svg className="w-4 h-4 mx-2 text-neutrals-grayBorder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-neutrals-black font-medium">{lista.titulo}</span>
          </nav>
        </div>
      </div>

      {/* Header de Lista */}
      <header className="gradient-gold py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in-up">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="font-display text-3xl sm:text-4xl font-semibold text-neutrals-black mb-2">
                  {lista.titulo}
                </h1>
                {lista.descripcion && (
                  <p className="text-neutrals-grayStrong max-w-2xl">
                    {lista.descripcion}
                  </p>
                )}
              </div>
              <span className={`badge ${
                lista.estado === 'publicada' ? 'badge-success' : 'badge-neutral'
              }`}>
                {lista.estado === 'publicada' ? 'Lista Activa' : 'Lista Cerrada'}
              </span>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              <div className="card-premium p-4">
                <p className="text-xs text-neutrals-graySoft uppercase tracking-wide">TRM</p>
                <p className="font-display text-xl font-semibold text-neutrals-black">
                  ${lista.trm_lista?.toLocaleString('es-CO')}
                </p>
              </div>
              <div className="card-premium p-4">
                <p className="text-xs text-neutrals-graySoft uppercase tracking-wide">TAX</p>
                <p className="font-display text-xl font-semibold text-neutrals-black">
                  {lista.tax_modo_lista === 'porcentaje' 
                    ? `${lista.tax_porcentaje_lista}%` 
                    : `$${lista.tax_usd_lista} USD`}
                </p>
              </div>
              <div className="card-premium p-4">
                <p className="text-xs text-neutrals-graySoft uppercase tracking-wide">Productos</p>
                <p className="font-display text-xl font-semibold text-brand-primary">
                  {productos.length}
                </p>
              </div>
              {lista.fecha_oferta && (
                <div className="card-premium p-4">
                  <p className="text-xs text-neutrals-graySoft uppercase tracking-wide">Fecha</p>
                  <p className="font-display text-lg font-semibold text-neutrals-black">
                    {new Date(lista.fecha_oferta).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Productos Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {productos.length === 0 ? (
          <div className="text-center py-16">
            <div className="card-premium p-12 max-w-md mx-auto">
              <div className="w-16 h-16 bg-brand-primarySoft rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="font-display text-xl text-neutrals-black mb-2">
                No hay productos disponibles
              </h3>
              <p className="text-neutrals-graySoft">
                Esta lista aún no tiene productos publicados.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-neutrals-black">
                Productos Disponibles
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productos.map((producto, index) => (
                <Link 
                  key={producto.id}
                  href={`/catalogo/${idLista}/${producto.id}`}
                  className="stagger-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <article className="card-premium overflow-hidden group h-full flex flex-col">
                    {/* Imagen */}
                    <div className="aspect-square relative overflow-hidden bg-neutrals-grayBg">
                      {producto.imagenes?.[0] ? (
                        <img
                          src={producto.imagenes[0]}
                          alt={producto.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-neutrals-grayBorder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Badge de categoría */}
                      {producto.categoria && (
                        <span className="absolute top-3 left-3 badge badge-gold text-xs capitalize">
                          {producto.categoria}
                        </span>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-display text-lg font-semibold text-neutrals-black group-hover:text-brand-primaryDark transition-colors line-clamp-2">
                        {producto.titulo}
                      </h3>
                      
                      {producto.marca && (
                        <p className="text-sm text-neutrals-graySoft mt-1">
                          {producto.marca}
                        </p>
                      )}
                      
                      <div className="mt-auto pt-4">
                        <p className="price-gold price-gold-lg">
                          {formatearPrecioCOP(producto.precio_final_cop)}
                        </p>
                        <p className="text-xs text-neutrals-graySoft mt-1">
                          Base: ${producto.precio_base_usd} USD
                        </p>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer-chic py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoChic size="sm" />
              <span className="font-display text-sm text-neutrals-grayStrong">
                Chic Import USA
              </span>
            </div>
            <p className="footer-text text-center sm:text-right">
              © {new Date().getFullYear()} Chic Import USA. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}