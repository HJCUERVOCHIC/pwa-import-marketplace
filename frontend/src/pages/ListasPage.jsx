import { useState, useEffect } from 'react'
import { Plus, Calendar, DollarSign, Package, FileText } from 'lucide-react'
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
    setListas(prev => [nuevaLista, ...prev])
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-charcoal">
            Listas de Oferta
          </h2>
          <p className="text-neutral-slate mt-2">
            Gestiona tus catálogos de productos importados
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary btn-md flex items-center gap-2 shadow-md hover:shadow-gold"
        >
          <Plus className="w-5 h-5" />
          Nueva Lista
        </button>
      </div>

      {/* Lista de ofertas */}
      {listas.length === 0 ? (
        <div className="empty-state bg-card border border-neutral-border rounded-lg shadow-sm">
          <div className="empty-state-icon">
            <FileText className="w-16 h-16" />
          </div>
          <h3 className="empty-state-title">
            No hay listas de oferta
          </h3>
          <p className="empty-state-text">
            Comienza creando tu primera lista para agregar productos
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary btn-md inline-flex items-center gap-2"
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
              className="card-clickable p-6 hover-lift"
              onClick={() => navigate(`/admin/listas/${lista.id}/productos`)}
            >
              {/* Header con título y badge */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-display font-semibold text-neutral-charcoal flex-1 pr-3">
                  {lista.titulo}
                </h3>
                <span className={`badge badge-${lista.estado} flex-shrink-0`}>
                  {lista.estado}
                </span>
              </div>

              {/* Descripción */}
              {lista.descripcion && (
                <p className="text-neutral-slate text-sm mb-4 line-clamp-2">
                  {lista.descripcion}
                </p>
              )}

              {/* Metadata */}
              <div className="space-y-3 pt-4 border-t border-neutral-border">
                <div className="flex items-center gap-2 text-sm text-neutral-stone">
                  <Calendar className="w-4 h-4 text-gold-500" />
                  <span className="font-medium">Fecha:</span>
                  <span>{new Date(lista.fecha_oferta).toLocaleDateString('es-CO')}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-neutral-stone">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">TRM:</span>
                  <span className="font-semibold text-neutral-charcoal">
                    ${lista.trm_lista?.toLocaleString('es-CO')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-neutral-stone">
                  <Package className="w-4 h-4 text-gold-500" />
                  <span className="font-medium">TAX:</span>
                  <span className="text-neutral-charcoal">
                    {lista.tax_modo_lista === 'porcentaje' 
                      ? `${lista.tax_porcentaje_lista}%` 
                      : `$${lista.tax_usd_lista} USD`
                    }
                  </span>
                </div>
              </div>

              {/* Footer hover indicator */}
              <div className="mt-4 pt-4 border-t border-neutral-border opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gold-600 font-medium">Ver detalles</span>
                  <svg 
                    className="w-5 h-5 text-gold-600 transform group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
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
