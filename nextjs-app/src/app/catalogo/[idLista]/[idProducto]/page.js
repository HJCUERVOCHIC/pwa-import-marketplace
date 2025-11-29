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
  const descripcion = producto.descripcion 
    ? producto.descripcion.substring(0, 150) 
    : `${producto.marca ? producto.marca + ' - ' : ''}${precio}`

  return {
    title: `${producto.titulo} - Chic Import USA`,
    description: descripcion,
    openGraph: {
      title: producto.titulo,
      description: `${producto.marca ? producto.marca + ' - ' : ''}${precio}`,
      images: [{
        url: imagen,
        width: 1200,
        height: 630,
        alt: producto.titulo,
      }],
      type: 'website',
      siteName: 'Chic Import USA',
    },
    twitter: {
      card: 'summary_large_image',
      title: producto.titulo,
      description: `${producto.marca ? producto.marca + ' - ' : ''}${precio}`,
      images: [imagen],
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
  const whatsappMessage = encodeURIComponent(
    `¡Mira este producto!\n\n*${producto.titulo}*\n${producto.marca ? `Marca: ${producto.marca}\n` : ''}Precio: ${precio}\n\nhttps://pwa-import-marketplace.vercel.app/catalogo/${idLista}/${idProducto}`
  )

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
          <nav className="flex items-center text-sm flex-wrap gap-1">
            <Link href="/catalogo" className="text-neutrals-graySoft hover:text-brand-primary transition-colors">
              Catálogo
            </Link>
            <svg className="w-4 h-4 mx-1 text-neutrals-grayBorder flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href={`/catalogo/${idLista}`} className="text-neutrals-graySoft hover:text-brand-primary transition-colors">
              {producto.listas_oferta?.titulo || 'Lista'}
            </Link>
            <svg className="w-4 h-4 mx-1 text-neutrals-grayBorder flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-neutrals-black font-medium truncate">{producto.titulo}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-premium overflow-hidden animate-fade-in-up">
          <div className="lg:flex">
            {/* Galería de imágenes */}
            <div className="lg:w-1/2">
              <div className="aspect-square relative bg-neutrals-grayBg">
                {producto.imagenes?.[0] ? (
                  <img
                    src={producto.imagenes[0]}
                    alt={producto.titulo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-20 h-20 text-neutrals-grayBorder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Categoría badge */}
                {producto.categoria && (
                  <span className="absolute top-4 left-4 badge badge-gold capitalize">
                    {producto.categoria}
                  </span>
                )}
              </div>
              
              {/* Thumbnails si hay más imágenes */}
              {producto.imagenes?.length > 1 && (
                <div className="flex gap-2 p-4 bg-white border-t border-neutrals-grayBorder overflow-x-auto">
                  {producto.imagenes.map((img, index) => (
                    <div 
                      key={index}
                      className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                        index === 0 ? 'border-brand-primary' : 'border-neutrals-grayBorder'
                      }`}
                    >
                      <img src={img} alt={`${producto.titulo} ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info del producto */}
            <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col">
              {/* Título y marca */}
              <div className="mb-6">
                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-neutrals-black mb-2">
                  {producto.titulo}
                </h1>
                {producto.marca && (
                  <p className="text-neutrals-graySoft">
                    Marca: <span className="font-medium text-neutrals-grayStrong">{producto.marca}</span>
                  </p>
                )}
              </div>

              {/* Precio destacado */}
              <div className="bg-gradient-to-r from-brand-primarySoft to-white rounded-xl p-6 mb-6">
                <p className="text-xs text-neutrals-graySoft uppercase tracking-wide mb-1">Precio</p>
                <p className="price-gold text-4xl sm:text-5xl">
                  {precio}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm text-neutrals-graySoft">
                  <span>Base: ${producto.precio_base_usd} USD</span>
                  <span className="text-neutrals-grayBorder">|</span>
                  <span>Margen: {producto.margen_porcentaje}%</span>
                </div>
              </div>

              {/* Descripción */}
              {producto.descripcion && (
                <div className="mb-6">
                  <h2 className="font-display text-lg font-semibold text-neutrals-black mb-2">
                    Descripción
                  </h2>
                  <p className="text-neutrals-grayStrong whitespace-pre-line leading-relaxed">
                    {producto.descripcion}
                  </p>
                </div>
              )}

              {/* Detalles adicionales */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-neutrals-grayBg rounded-lg p-4">
                  <p className="text-xs text-neutrals-graySoft uppercase tracking-wide">Costo Total</p>
                  <p className="font-semibold text-neutrals-black">
                    {formatearPrecioCOP(producto.costo_total_cop || 0)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-600 uppercase tracking-wide">Ganancia</p>
                  <p className="font-semibold text-green-600">
                    {formatearPrecioCOP(producto.ganancia_cop || 0)}
                  </p>
                </div>
              </div>

              {/* Botón de WhatsApp */}
              <div className="mt-auto">
                <a
                  href={`https://wa.me/?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp w-full text-lg py-4"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Compartir por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Botón volver */}
        <div className="mt-6">
          <Link 
            href={`/catalogo/${idLista}`}
            className="btn-secondary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a la lista
          </Link>
        </div>
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