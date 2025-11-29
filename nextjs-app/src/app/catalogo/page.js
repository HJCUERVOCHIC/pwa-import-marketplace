import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

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

async function getListasPublicas() {
  const { data, error } = await supabase
    .from('listas_oferta')
    .select('*')
    .in('estado', ['publicada', 'cerrada'])
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching listas:', error)
    return []
  }
  return data || []
}

export const metadata = {
  title: 'Catálogo | Chic Import USA',
  description: 'Explora nuestro catálogo de productos importados premium. Calzado, ropa, tecnología y más.',
}

export default async function CatalogoPage() {
  const listas = await getListasPublicas()

  return (
    <div className="min-h-screen bg-neutrals-ivory">
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
            
            <Link 
              href="/auth" 
              className="nav-link text-neutrals-graySoft hover:text-neutrals-black"
            >
              Administrador
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="gradient-gold py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <LogoChic size="xl" className="mx-auto mb-6" />
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-neutrals-black mb-4">
              Catálogo de Productos
            </h1>
            <p className="text-lg text-neutrals-grayStrong max-w-2xl mx-auto">
              Descubre nuestra exclusiva selección de productos importados con la mejor calidad y precios competitivos.
            </p>
            <div className="divider-gold w-24 mx-auto mt-8"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {listas.length === 0 ? (
          <div className="text-center py-16">
            <div className="card-premium p-12 max-w-md mx-auto">
              <div className="w-16 h-16 bg-brand-primarySoft rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="font-display text-xl text-neutrals-black mb-2">
                No hay catálogos disponibles
              </h3>
              <p className="text-neutrals-graySoft">
                Próximamente tendremos nuevos productos para ti.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl text-neutrals-black">
                Listas Disponibles
              </h2>
              <span className="badge badge-gold">
                {listas.length} {listas.length === 1 ? 'lista' : 'listas'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listas.map((lista, index) => (
                <Link 
                  key={lista.id} 
                  href={`/catalogo/${lista.id}`}
                  className="stagger-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <article className="card-premium overflow-hidden group cursor-pointer h-full">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-brand-primarySoft to-white p-6 border-b border-neutrals-grayBorder">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-display text-xl font-semibold text-neutrals-black group-hover:text-brand-primaryDark transition-colors">
                            {lista.titulo}
                          </h3>
                          {lista.descripcion && (
                            <p className="text-sm text-neutrals-graySoft mt-1 line-clamp-2">
                              {lista.descripcion}
                            </p>
                          )}
                        </div>
                        <span className={`badge ml-3 ${
                          lista.estado === 'publicada' ? 'badge-success' : 'badge-neutral'
                        }`}>
                          {lista.estado === 'publicada' ? 'Activa' : 'Cerrada'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutrals-grayBg rounded-lg p-3">
                          <p className="text-xs text-neutrals-graySoft uppercase tracking-wide">TRM</p>
                          <p className="font-semibold text-neutrals-black">
                            ${lista.trm_lista?.toLocaleString('es-CO')}
                          </p>
                        </div>
                        <div className="bg-neutrals-grayBg rounded-lg p-3">
                          <p className="text-xs text-neutrals-graySoft uppercase tracking-wide">TAX</p>
                          <p className="font-semibold text-neutrals-black">
                            {lista.tax_modo_lista === 'porcentaje' 
                              ? `${lista.tax_porcentaje_lista}%` 
                              : `$${lista.tax_usd_lista} USD`}
                          </p>
                        </div>
                      </div>
                      
                      {lista.fecha_oferta && (
                        <div className="mt-4 flex items-center text-sm text-neutrals-graySoft">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(lista.fecha_oferta).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Card Footer */}
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-between text-sm text-brand-primary font-medium group-hover:text-brand-primaryDark transition-colors">
                        <span>Ver productos</span>
                        <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
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
      <footer className="footer-chic mt-auto py-8">
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