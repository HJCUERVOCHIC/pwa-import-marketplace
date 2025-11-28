import Link from 'next/link'
import { getProductoPublicoById, formatearPrecioCOP } from '@/services/catalogoService'

export async function generateMetadata({ params }) {
  const { idLista, idProducto } = await params
  const { data: producto } = await getProductoPublicoById(idProducto)
  
  if (!producto) {
    return {
      title: 'Producto no encontrado - Chic Import USA',
    }
  }

  const precio = formatearPrecioCOP(producto.precio_final_cop)
  const imagen = producto.imagenes?.[0] || 'https://pwa-import-marketplace-3gv5.vercel.app/og-image.jpg'
  const descripcion = producto.descripcion 
    ? producto.descripcion.substring(0, 150) 
    : `${producto.marca ? producto.marca + ' - ' : ''}${precio}`

  return {
    title: `${producto.titulo} - Chic Import USA`,
    description: descripcion,
    openGraph: {
      title: producto.titulo,
      description: `${producto.marca ? producto.marca + ' - ' : ''}${precio}`,
      images: [
        {
          url: imagen,
          width: 1200,
          height: 630,
          alt: producto.titulo,
        },
      ],
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
  const { data: producto, error } = await getProductoPublicoById(idProducto)

  if (error || !producto) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Producto no encontrado</p>
          <Link href={`/catalogo/${idLista}`} className="text-blue-600 hover:underline">
            Volver a la lista
          </Link>
        </div>
      </div>
    )
  }

  const precio = formatearPrecioCOP(producto.precio_final_cop)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href={`/catalogo/${idLista}`} className="text-blue-600 hover:underline mb-6 inline-block">
          Volver a la lista
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2">
              {producto.imagenes && producto.imagenes[0] ? (
                <img 
                  src={producto.imagenes[0]} 
                  alt={producto.titulo}
                  className="w-full h-64 md:h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">Sin imagen</span>
                </div>
              )}
            </div>

            <div className="md:w-1/2 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {producto.titulo}
              </h1>
              
              {producto.marca && (
                <p className="text-gray-600 mb-4">
                  Marca: <span className="font-medium">{producto.marca}</span>
                </p>
              )}

              <p className="text-3xl font-bold text-green-600 mb-6">
                {precio}
              </p>

              {producto.descripcion && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">Descripcion</h2>
                  <p className="text-gray-600 whitespace-pre-line">{producto.descripcion}</p>
                </div>
              )}

              <a 
                href={`https://wa.me/?text=${encodeURIComponent(`¡Mira este producto!\n\n*${producto.titulo}*\n${producto.marca ? `Marca: ${producto.marca}\n` : ''}Precio: ${precio}\n\nhttps://pwa-import-marketplace-jx2h.vercel.app/catalogo/${idLista}/${idProducto}`)}`}
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                Compartir por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}