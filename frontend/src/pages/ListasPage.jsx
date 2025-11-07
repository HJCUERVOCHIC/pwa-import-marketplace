import { useState, useEffect } from 'react'
import { Plus, Calendar, DollarSign, Package } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import { useNavigate } from 'react-router-dom'
import ModalCrearLista from '../components/ModalCrearLista'

function ListasPage() {
  const [listas, setListas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    cargarListas()
  }, [])

  async function cargarListas() {
    try {
      const { data, error } = await supabase
        .from('listas_oferta')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setListas(data || [])
    } catch (error) {
      console.error('Error cargando listas:', error)
      alert('Error al cargar las listas')
    } finally {
      setLoading(false)
    }
  }

  const handleListaCreada = (nuevaLista) => {
    // Agregar la nueva lista al inicio del array
    setListas(prev => [nuevaLista, ...prev])
  }

  const estadoColors = {
    borrador: 'bg-yellow-100 text-yellow-800',
    publicada: 'bg-green-100 text-green-800',
    cerrada: 'bg-gray-100 text-gray-800',
    archivada: 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando listas...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Listas de Oferta</h2>
          <p className="text-gray-600 mt-1">
            Gestiona tus catálogos de productos importados
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Lista
        </button>
      </div>

      {/* Lista de ofertas */}
      {listas.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay listas de oferta
          </h3>
          <p className="text-gray-600 mb-4">
            Comienza creando tu primera lista para agregar productos
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Crear Primera Lista
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listas.map((lista) => (
            <div
              key={lista.id}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/admin/listas/${lista.id}/productos`)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {lista.titulo}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColors[lista.estado]}`}>
                  {lista.estado}
                </span>
              </div>

              {lista.descripcion && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {lista.descripcion}
                </p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {new Date(lista.fecha_oferta).toLocaleDateString('es-CO')}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  TRM: ${lista.trm_lista?.toLocaleString('es-CO')}
                </div>
                <div className="text-gray-500">
                  TAX: {lista.tax_modo_lista === 'porcentaje' 
                    ? `${lista.tax_porcentaje_lista}%` 
                    : `$${lista.tax_usd_lista} USD`
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para crear lista */}
      <ModalCrearLista
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onListaCreada={handleListaCreada}
      />
    </div>
  )
}
export default ListasPage
