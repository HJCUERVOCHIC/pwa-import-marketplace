import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import WhatsAppButtonDetalle from './WhatsAppButtonDetalle'

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

async function getProducto(id) {
  const { data, error } = await supabase
    .from('productos')
    .select('*, listas_oferta(*)')
    .eq('id', id)
    .eq('estado', 'publicado')
    .single()
  
  if (error) return null
  return data
}

function formatearPrecioCOP(precio) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(precio)
}

// Meta tags dinámicos para WhatsApp/Facebook
export async function generateMetadata({ params }) {
  const { idLista, idProducto } = await params
  const producto = await getProducto(idProducto)
  
  if (!producto) {
    return { title: 'Producto no encontrado - Chic Import USA' }
  }

  const precio = formatearPrecioCOP(producto.precio_final_cop)
  const imagen = producto.imagenes?.[0] || 'https://pwa-import-marketplace.vercel.app/og-image.jpg'
  const urlProducto = `https://pwa-import-marketplace.vercel.app/catalogo/${idLista}/${idProducto}`
  
  // Descripción con precio para WhatsApp
  const descripcionOG = `${precio}${producto.marca ? ` • ${producto.marca}` : ''}${producto.descripcion ? ` • ${producto.descripcion.substring(0, 100)}` : ''}`

  return {
    title: `${producto.titulo} - Chic Import USA`,
    description: descripcionOG,
    metadataBase: new URL('https://pwa-import-marketplace.vercel.app'),
    openGraph: {
      title: `${producto.titulo} | Chic Import USA`,
      description: descripcionOG,
      url: urlProducto,
      images: [
        {
          url: imagen,
          width: 1200,
          height: 630,
          alt: producto.titulo,
          type: 'image/jpeg',
        }
      ],
      type: 'website',
      siteName: 'Chic Import USA',
      locale: 'es_CO',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${producto.titulo} | Chic Import USA`,
      description: descripcionOG,
      images: [imagen],
    },
    other: {
      'og:image:secure_url': imagen,
      'og:price:amount': producto.precio_final_cop,
      'og:price:currency': 'COP',
    },
  }
}

export default async function ProductoPage({ params }) {
  const { idLista, idProducto } = await params
  const producto = await getProducto(idProducto)

  if (!producto) {
    notFound()
  }

  const precio = formatearPrecioCOP(producto.precio_final_cop)
  const categoriaInfo = CATEGORIAS[producto.categoria] || CATEGORIAS.otros

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

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center text-xs text-gray-500 gap-1 overflow-x-auto">
            <Link href="/catalogo" className="hover:text-blue-700 transition-colors whitespace-nowrap">
              Catálogo
            </Link>
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href={`/catalogo/${idLista}`} className="hover:text-blue-700 transition-colors whitespace-nowrap">
              {producto.listas_oferta?.titulo || 'Lista'}
            </Link>
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium truncate">{producto.titulo}</span>
          </nav>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="lg:flex">
            
            {/* Galería de Imágenes */}
            <div className="lg:w-1/2">
              <div className="aspect-square relative bg-gray-100">
                {producto.imagenes?.[0] ? (
                  <img
                    src={producto.imagenes[0]}
                    alt={producto.titulo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Badge Categoría */}
                <span 
                  className="absolute top-4 left-4 text-white text-xs font-medium px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(30, 64, 175, 0.9)' }}
                >
                  {categoriaInfo.icon} {categoriaInfo.label}
                </span>
              </div>
              
              {/* Thumbnails */}
              {producto.imagenes?.length > 1 && (
                <div className="flex gap-2 p-3 bg-gray-50 overflow-x-auto">
                  {producto.imagenes.map((img, index) => (
                    <div 
                      key={index}
                      className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                        index === 0 ? 'border-blue-600' : 'border-gray-200'
                      }`}
                    >
                      <img src={img} alt={`${producto.titulo} ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info del Producto */}
            <div className="lg:w-1/2 p-5 lg:p-8 flex flex-col">
              
              {/* Título y Marca */}
              <div className="mb-4">
                <h1 
                  className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-1"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {producto.titulo}
                </h1>
                {producto.marca && (
                  <p className="text-gray-500">
                    Marca: <span className="font-medium text-gray-700">{producto.marca}</span>
                  </p>
                )}
              </div>

              {/* Precio Destacado */}
              <div 
                className="rounded-xl p-5 mb-5"
                style={{ background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.05) 0%, rgba(30, 58, 138, 0.1) 100%)' }}
              >
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Precio</p>
                <p 
                  className="text-4xl lg:text-5xl font-bold"
                  style={{ color: '#1e40af', fontFamily: 'Playfair Display, serif' }}
                >
                  {precio}
                </p>
              </div>

              {/* Descripción */}
              {producto.descripcion && (
                <div className="mb-5">
                  <h2 
                    className="text-lg font-semibold text-gray-900 mb-2"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    Descripción
                  </h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {producto.descripcion}
                  </p>
                </div>
              )}

              {/* Botón WhatsApp */}
              <div className="mt-auto">
                <WhatsAppButtonDetalle producto={producto} idLista={idLista} />
              </div>
            </div>
          </div>
        </div>

        {/* Botón Volver */}
        <div className="mt-4">
          <Link 
            href={`/catalogo/${idLista}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a la lista
          </Link>
        </div>
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