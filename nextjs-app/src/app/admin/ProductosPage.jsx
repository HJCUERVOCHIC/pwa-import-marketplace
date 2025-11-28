import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Package, DollarSign, TrendingUp } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import ModalEditorProducto from '../components/ModalEditorProducto'
import AccionesLista from '../components/AccionesLista'
import AccionesProducto from '../components/AccionesProducto'
import BotonCompartirWhatsApp from '../components/BotonCompartirWhatsApp'
import { 
  compartirProducto, 
  compartirLista, 
  puedeCompartirseProducto, 
  puedeCompartirseLista 
} from '../services/whatsappService'

function ProductosPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lista, setLista] = useState(null)
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [id])

  async function cargarDatos() {
    try {
      // Cargar lista
      const { data: listaData, error: listaError } = await supabase
        .from('listas_oferta')
        .select('*')
        .eq('id', id)
        .single()

      if (listaError) throw listaError
      setLista(listaData)

      // Cargar productos
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('*')
        .eq('id_lista', id)
        .order('created_at', { ascending: false })

      if (productosError) throw productosError
      setProductos(productosData || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleProductoCreado = (nuevoProducto) => {
    setProductos(prev => [nuevoProducto, ...prev])
  }

  const handleActualizacion = () => {
    cargarDatos() // Recargar todo después de cambios de estado
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600"></div>
      </div>
    )
  }

  if (!lista) {
    return (
      <div className="empty-state bg-card border border-neutral-border rounded-lg shadow-sm">
        <div className="empty-state-icon">
          <Package className="w-16 h-16" />
        </div>
        <h3 className="empty-state-title">Lista no encontrada</h3>
        <p className="empty-state-text">La lista que buscas no existe o fue eliminada</p>
        <button 
          onClick={() => navigate('/admin/listas')} 
          className="btn btn-primary btn-md"
        >
          Volver a Listas
        </button>
      </div>
    )
  }

  // Verificar si la lista permite modificaciones
  const listaModificable = !['cerrada', 'archivada'].includes(lista.estado)

  return (
    <div>
      {/* Breadcrumb / Back button */}
      <button
        onClick={() => navigate('/admin/listas')}
        className="flex items-center gap-2 text-neutral-slate hover:text-gold-600 mb-6 transition-colors duration-base font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver a Listas
      </button>

      {/* Header de la lista */}
      <div className="card p-6 mb-8 shadow-md">
        {/* Título y acciones */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-display font-bold text-neutral-charcoal">
                {lista.titulo}
              </h2>
              <span className={`badge badge-${lista.estado}`}>
                {lista.estado}
              </span>
            </div>
            {lista.descripcion && (
              <p className="text-neutral-slate">{lista.descripcion}</p>
            )}
          </div>

          {/* Acciones de la lista */}
          <div className="flex flex-wrap gap-3">
            <AccionesLista 
              lista={lista}
              onActualizacion={handleActualizacion}
            />

            {/* Boton Compartir Lista por WhatsApp */}
            {lista && puedeCompartirseLista(lista, productos) && (
              <BotonCompartirWhatsApp
                onClick={() => compartirLista(lista, productos, lista.id)}
                variant="default"
              />
            )}
            
            {listaModificable && (
              <button 
                className="btn btn-primary btn-md flex items-center gap-2 shadow-md hover:shadow-gold"
                onClick={() => setShowModal(true)}
              >
                <Plus className="w-5 h-5" />
                Agregar Producto
              </button>
            )}
          </div>
        </div>

        {/* Warning si la lista está cerrada o archivada */}
        {!listaModificable && (
          <div className="bg-yellow-50 border-l-4 border-warning rounded-md p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Esta lista está{' '}
              <span className="font-semibold">{lista.estado}</span> y no se pueden
              agregar ni modificar productos.
            </p>
          </div>
        )}

        {/* Stats de la lista */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-neutral-border">
          <div className="bg-gold-50 rounded-md p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-gold-600" />
              <p className="text-xs text-neutral-stone uppercase tracking-wide font-medium">TRM</p>
            </div>
            <p className="text-xl font-display font-bold text-neutral-charcoal">
              ${lista.trm_lista?.toLocaleString('es-CO')}
            </p>
          </div>

          <div className="bg-emerald-50 rounded-md p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-neutral-stone uppercase tracking-wide font-medium">TAX</p>
            </div>
            <p className="text-xl font-display font-bold text-neutral-charcoal">
              {lista.tax_modo_lista === 'porcentaje'
                ? `${lista.tax_porcentaje_lista}%`
                : `$${lista.tax_usd_lista} USD`}
            </p>
          </div>

          <div className="bg-gold-50 rounded-md p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-gold-600" />
              <p className="text-xs text-neutral-stone uppercase tracking-wide font-medium">Productos</p>
            </div>
            <p className="text-xl font-display font-bold text-neutral-charcoal">
              {productos.length}
            </p>
          </div>

          <div className="bg-neutral-gray rounded-md p-4">
            <p className="text-xs text-neutral-stone uppercase tracking-wide font-medium mb-1">
              Publicados
            </p>
            <p className="text-xl font-display font-bold text-neutral-charcoal">
              {productos.filter(p => p.estado === 'publicado').length}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      {productos.length === 0 ? (
        <div className="empty-state bg-card border border-neutral-border rounded-lg shadow-sm">
          <div className="empty-state-icon">
            <Package className="w-16 h-16" />
          </div>
          <h3 className="empty-state-title">
            No hay productos en esta lista
          </h3>
          <p className="empty-state-text">
            Comienza agregando tu primer producto importado a esta lista
          </p>
          {listaModificable && (
            <button 
              className="btn btn-primary btn-md inline-flex items-center gap-2"
              onClick={() => setShowModal(true)}
            >
              <Plus className="w-5 h-5" />
              Agregar Primer Producto
            </button>
          )}
        </div>
      ) : (
        <div>
          {/* Header de productos */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-display font-bold text-neutral-charcoal">
              Productos ({productos.length})
            </h3>
          </div>

          {/* Grid de productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.map((producto) => (
              <div 
                key={producto.id} 
                className="card p-0 overflow-hidden hover-lift"
              >
                {/* Imagen del producto */}
                {producto.imagenes?.[0] ? (
                  <div className="relative w-full h-48 bg-neutral-gray">
                    <img
                      src={producto.imagenes[0]}
                      alt={producto.titulo}
                      className="w-full h-full object-cover"
                    />
                    {/* Badge de estado sobre la imagen */}
                    <span className={`badge badge-${producto.estado} absolute top-3 right-3 shadow-md`}>
                      {producto.estado.replace('_', ' ')}
                    </span>
                  </div>
                ) : (
                  <div className="relative w-full h-48 bg-neutral-gray flex items-center justify-center">
                    <Package className="w-12 h-12 text-neutral-stone opacity-50" />
                    <span className={`badge badge-${producto.estado} absolute top-3 right-3 shadow-md`}>
                      {producto.estado.replace('_', ' ')}
                    </span>
                  </div>
                )}

                {/* Contenido del producto */}
                <div className="p-5">
                  {/* Título y marca */}
                  <div className="mb-3">
                    <h4 className="text-lg font-display font-semibold text-neutral-charcoal mb-1 line-clamp-2">
                      {producto.titulo}
                    </h4>
                    {producto.marca && (
                      <p className="text-sm text-neutral-stone font-medium">{producto.marca}</p>
                    )}
                  </div>

                  {/* Precios */}
                  <div className="space-y-2 pt-4 border-t border-neutral-border mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-stone">Precio base:</span>
                      <span className="font-semibold text-neutral-charcoal">
                        ${producto.precio_base_usd} USD
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-stone">Costo total:</span>
                      <span className="font-semibold text-neutral-charcoal">
                        ${producto.costo_total_cop?.toLocaleString('es-CO')} COP
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-neutral-border">
                      <span className="text-sm font-medium text-gold-700">Precio final:</span>
                      <span className="text-lg font-display font-bold text-gold-600">
                        ${producto.precio_final_cop?.toLocaleString('es-CO')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm bg-emerald-50 -mx-5 px-5 py-2">
                      <span className="text-emerald-700 font-medium">Ganancia:</span>
                      <span className="font-bold text-emerald-700">
                        ${producto.ganancia_cop?.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  </div>

                  {/* Acciones del producto */}
                  <div className="pt-3 border-t border-neutral-border space-y-2">
                    <AccionesProducto
                      producto={producto}
                      estadoLista={lista.estado}
                      onActualizacion={handleActualizacion}
                      variante="compacto"
                    />

                    {/* Boton Compartir Producto por WhatsApp */}
                    {puedeCompartirseProducto(producto) && (
                      <BotonCompartirWhatsApp
                        onClick={() => compartirProducto(producto, lista.id)}
                        variant="compact"
                        className="w-full"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Editor de Producto */}
      {listaModificable && (
        <ModalEditorProducto
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          lista={lista}
          onProductoCreado={handleProductoCreado}
        />
      )}
    </div>
  )
}

export default ProductosPage
