import Link from 'next/link'
import { getListasPublicas } from '@/services/catalogoService'

export const metadata = {
  title: 'Catalogo - Chic Import USA',
  description: 'Descubre productos importados de calidad al mejor precio.',
}

export default async function CatalogoPage() {
  const { data: listas, error } = await getListasPublicas()

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error cargando el catalogo</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Catalogo de Productos
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listas?.map((lista) => (
            <Link 
              key={lista.id} 
              href={`/catalogo/${lista.id}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {lista.titulo}
              </h2>
              <p className="text-gray-600 text-sm">
                {lista.descripcion || 'Ver productos disponibles'}
              </p>
              <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                lista.estado === 'publicada' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {lista.estado === 'publicada' ? 'Disponible' : 'Cerrada'}
              </span>
            </Link>
          ))}
        </div>

        {(!listas || listas.length === 0) && (
          <p className="text-center text-gray-500 py-12">
            No hay listas disponibles en este momento.
          </p>
        )}
      </div>
    </div>
  )
}