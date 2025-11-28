import Link from 'next/link'
import { getListaPublicaById, getProductosPublicos, formatearPrecioCOP } from '@/services/catalogoService'

export async function generateMetadata({ params }) {
  const { idLista } = await params
  const { data: lista } = await getListaPublicaById(idLista)
  
  return {
    title: lista ? `${lista.titulo} - Chic Import USA` : 'Lista no encontrada',
    description: lista?.descripcion || 'Ver productos disponibles en esta lista.',
  }
}

export default async function ListaPage({ params }) {
  const { idLista } = await params
  const { data: lista, error: listaError } = await getListaPublicaById(idLista)
  const { data: productos, error: productosError } = await getProductosPublicos(idLista)

  if (listaError || !lista) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Lista no encontrada</p>
          <Link href="/catalogo" className="text-blue-600 hover:underline">
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/catalogo" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Volver al catálogo
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{lista.titulo}</h1>
        {lista.descripcion && (
          <p className="text-gray-600 mb-8">{lista.descripcion}</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productos?.map((producto) => (
            <Link 
              key={producto.id} 
              href={`/catalogo/${idLista}/${producto.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {producto.imagenes && producto.imagenes[0] ? (
                <img 
                  src={producto.imagenes[0]} 
                  alt={producto.titulo}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">Sin imagen</span>
                </div>
              )}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                  {producto.titulo}
                </h2>
                {producto.marca && (
                  <p className="text-sm text-gray-500 mb-2">{producto.marca}</p>
                )}
                <p className="text-xl font-bold text-green-600">
                  {formatearPrecioCOP(producto.precio_final_cop)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {(!productos || productos.length === 0) && (
          <p className="text-center text-gray-500 py-12">
            No hay productos disponibles en esta lista.
          </p>
        )}
      </div>
    </div>
  )
}
