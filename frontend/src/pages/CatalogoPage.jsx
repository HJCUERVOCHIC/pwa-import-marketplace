import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Calendar, Tag, ArrowRight } from 'lucide-react'
import PublicLayout from '../components/PublicLayout'
import { getListasPublicas } from '../services/catalogoService'

/**
 * Página de Catálogo Público
 * Muestra todas las listas publicadas y cerradas
 * Accesible sin autenticación
 */
function CatalogoPage() {
  const navigate = useNavigate()
  const [listas, setListas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    cargarListas()
  }, [])

  async function cargarListas() {
    try {
      const { data, error } = await getListasPublicas()
      
      if (error) {
        setError(error)
      } else {
        setListas(data || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600"></div>
        </div>
      </PublicLayout>
    )
  }

  if (error) {
    return (
      <PublicLayout>
        <div className="empty-state bg-card border border-neutral-border rounded-lg shadow-sm">
          <div className="empty-state-icon">
            <Package className="w-16 h-16 text-danger" />
          </div>
          <h3 className="empty-state-title">Error al cargar el catálogo</h3>
          <p className="empty-state-text">{error}</p>
          <button 
            onClick={cargarListas}
            className="btn btn-primary btn-md"
          >
            Reintentar
          </button>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-neutral-charcoal mb-4">
          Catálogo de Ofertas
        </h1>
        <p className="text-lg text-neutral-slate max-w-2xl mx-auto">
          Descubre nuestras ofertas exclusivas de productos importados de Estados Unidos
        </p>
      </div>

      {/* Lista de Ofertas */}
      {listas.length === 0 ? (
        <div className="empty-state bg-card border border-neutral-border rounded-lg shadow-sm">
          <div className="empty-state-icon">
            <Package className="w-16 h-16" />
          </div>
          <h3 className="empty-state-title">
            No hay ofertas disponibles
          </h3>
          <p className="empty-state-text">
            Por el momento no tenemos ofertas publicadas. Vuelve pronto para ver nuestras novedades.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listas.map((lista) => (
            <ListaCard 
              key={lista.id} 
              lista={lista}
              onClick={() => navigate(`/catalogo/${lista.id}`)}
            />
          ))}
        </div>
      )}
    </PublicLayout>
  )
}

/**
 * Card de Lista para el catálogo público
 */
function ListaCard({ lista, onClick }) {
  const formatearFecha = (fecha) => {
    if (!fecha) return ''
    const date = new Date(fecha)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div 
      onClick={onClick}
      className="card p-6 cursor-pointer hover-lift group"
    >
      {/* Header con estado */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-display font-bold text-neutral-charcoal mb-1 group-hover:text-gold-600 transition-colors">
            {lista.titulo}
          </h3>
          {lista.descripcion && (
            <p className="text-sm text-neutral-slate line-clamp-2">
              {lista.descripcion}
            </p>
          )}
        </div>
        <span className={`badge badge-${lista.estado} ml-3`}>
          {lista.estado}
        </span>
      </div>

      {/* Metadata */}
      <div className="space-y-2 pt-4 border-t border-neutral-border mb-4">
        <div className="flex items-center gap-2 text-sm text-neutral-stone">
          <Calendar className="w-4 h-4" />
          <span>{formatearFecha(lista.fecha_oferta)}</span>
        </div>
      </div>

      {/* Call to Action */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-border">
        <span className="text-sm font-medium text-gold-700">
          Ver productos
        </span>
        <ArrowRight className="w-5 h-5 text-gold-600 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  )
}

export default CatalogoPage
