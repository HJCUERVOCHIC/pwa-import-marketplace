import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Calendar, Tag } from 'lucide-react'
import PublicLayout from '../components/PublicLayout'
import { getListaPublicaById, getProductosPublicos, formatearPrecioCOP, formatearFecha } from '../services/catalogoService'

/**
 * Página de Productos de una Lista (Catálogo Público)
 * Muestra productos publicados de una lista específica
 * Accesible sin autenticación
 */
function CatalogoListaPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lista, setLista] = useState(null)
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [id])

  async function cargarDatos() {
    try {
      // Cargar lista
      const { data: listaData, error: listaError } = await getListaPublicaById(id)
      if (listaError) throw new Error(listaError)
      
      if (!listaData) {
        setError('Lista no encontrada o no disponible')
        setLoading(false)
        return
      }

      setLista(listaData)

      // Cargar productos
      const { data: productosData, error: productosError } = await getProductosPublicos(id)
      if (productosError) throw new Error(productosError)

      setProductos(productosData || [])
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

  if (error || !lista) {
    return (
      <PublicLayout>
        <div className="empty-state bg-card border border-neutral-border rounded-lg shadow-sm">
          <div className="empty-state-icon">
            <Package className="w-16 h-16 text-danger" />
          </div>
          <h3 className="empty-state-title">Lista no disponible</h3>
          <p className="empty-state-text">
            {error || 'La lista que buscas no existe o no está disponible'}
          </p>
          <button 
            onClick={() => navigate('/catalogo')}
            className="btn btn-primary btn-md"
          >
            Volver al Catálogo
          </button>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      {/* Breadcrumb / Back button */}
      <button
        onClick={() => navigate('/catalogo')}
        className="flex items-center gap-2 text-neutral-slate hover:text-gold-600 mb-6 transition-colors duration-base font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver al Catálogo
      </button>

      {/* Header de la lista */}
      <div className="card p-6 md:p-8 mb-8 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-neutral-charcoal">
                {lista.titulo}
              </h1>
              <span className={`badge badge-${lista.estado}`}>
                {lista.estado}
              </span>
            </div>
            {lista.descripcion && (
              <p className="text-lg text-neutral-slate">{lista.descripcion}</p>
            )}
          </div>
        </div>

        {/* Metadata de la lista */}
        <div className="flex flex-wrap gap-6 pt-6 border-t border-neutral-border">
          <div className="flex items-center gap-2 text-neutral-slate">
            <Calendar className="w-5 h-5 text-gold-600" />
            <span className="text-sm font-medium">
              {formatearFecha(lista.fecha_oferta)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-neutral-slate">
            <Package className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium">
              {lista.productos_count || productos.length} producto(s) disponible(s)
            </span>
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      {productos.length === 0 ? (
        <div className="empty-state bg-card border border-neutral-border rounded-lg shadow-sm">
          <div className="empty-state-icon">
            <Package className="w-16 h-16" />
          </div>
          <h3 className="empty-state-title">
            No hay productos disponibles
          </h3>
          <p className="empty-state-text">
            Esta lista aún no tiene productos publicados
          </p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display font-bold text-neutral-charcoal">
              Productos Disponibles
            </h2>
            <span className="text-neutral-stone">
              {productos.length} producto{productos.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productos.map((producto) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                onClick={() => navigate(`/catalogo/${id}/${producto.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </PublicLayout>
  )
}

/**
 * Card de Producto para catálogo público
 */
function ProductoCard({ producto, onClick }) {
  return (
    <div
      onClick={onClick}
      className="card p-0 overflow-hidden cursor-pointer hover-lift group"
    >
      {/* Imagen del producto */}
      {producto.imagenes?.[0] ? (
        <div className="relative w-full h-48 bg-neutral-gray overflow-hidden">
          <img
            src={producto.imagenes[0]}
            alt={producto.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-slow"
          />
        </div>
      ) : (
        <div className="relative w-full h-48 bg-neutral-gray flex items-center justify-center">
          <Package className="w-12 h-12 text-neutral-stone opacity-50" />
        </div>
      )}

      {/* Contenido */}
      <div className="p-4">
        {/* Título y marca */}
        <div className="mb-3">
          <h3 className="text-lg font-display font-semibold text-neutral-charcoal mb-1 line-clamp-2 group-hover:text-gold-600 transition-colors">
            {producto.titulo}
          </h3>
          {producto.marca && (
            <p className="text-sm text-neutral-stone font-medium">
              {producto.marca}
            </p>
          )}
        </div>

        {/* Precio */}
        <div className="pt-3 border-t border-neutral-border">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gold-700 font-medium">Precio</span>
            <span className="text-2xl font-display font-bold text-gold-600">
              {formatearPrecioCOP(producto.precio_final_cop)}
            </span>
          </div>
          <p className="text-xs text-neutral-stone mt-1">COP (Pesos colombianos)</p>
        </div>

        {/* Call to action */}
        <button className="btn btn-outline btn-sm w-full mt-4">
          Ver Detalles
        </button>
      </div>
    </div>
  )
}

export default CatalogoListaPage
