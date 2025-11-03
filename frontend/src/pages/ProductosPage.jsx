import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Package } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import ModalEditorProducto from '../components/ModalEditorProducto'

function ProductosPage() {
  const { idLista } = useParams()
  const navigate = useNavigate()
  const [lista, setLista] = useState(null)
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [idLista])

  async function cargarDatos() {
    try {
      // Cargar lista
      const { data: listaData, error: listaError } = await supabase
        .from('listas_oferta')
        .select('*')
        .eq('id', idLista)
        .single()

      if (listaError) throw listaError
      setLista(listaData)

      // Cargar productos
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('*')
        .eq('id_lista', idLista)
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
    // Agregar el nuevo producto al inicio del array
    setProductos(prev => [nuevoProducto, ...prev])
  }

  const estadoColors = {
    borrador: 'bg-yellow-100 text-yellow-800',
    listo_para_publicar: 'bg-blue-100 text-blue-800',
    publicado: 'bg-green-100 text-green-800',
    oculto: 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando productos...</div>
      </div>
    )
  }

  if (!lista) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Lista no encontrada</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">
          Volver
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver a Listas
      </button>

      <div className="card mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {lista.titulo}
            </h2>
            {lista.descripcion && (
              <p className="text-gray-600">{lista.descripcion}</p>
            )}
          </div>
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <Plus className="w-5 h-5" />
            Agregar Producto
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500">TRM</p>
            <p className="text-lg font-semibold">
              ${lista.trm_lista?.toLocaleString('es-CO')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">TAX</p>
            <p className="text-lg font-semibold">
              {lista.tax_modo_lista === 'porcentaje'
                ? `${lista.tax_porcentaje_lista}%`
                : `$${lista.tax_usd_lista} USD`}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Productos</p>
            <p className="text-lg font-semibold">{productos.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${estadoColors[lista.estado]}`}>
              {lista.estado}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      {productos.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay productos en esta lista
          </h3>
          <p className="text-gray-600 mb-4">
            Comienza agregando tu primer producto importado
          </p>
          <button 
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <Plus className="w-5 h-5" />
            Agregar Primer Producto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productos.map((producto) => (
            <div key={producto.id} className="card hover:shadow-md transition-shadow">
              {producto.imagenes?.[0] && (
                <img
                  src={producto.imagenes[0]}
                  alt={producto.titulo}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {producto.titulo}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColors[producto.estado]}`}>
                  {producto.estado.replace('_', ' ')}
                </span>
              </div>

              {producto.marca && (
                <p className="text-sm text-gray-500 mb-2">{producto.marca}</p>
              )}

              <div className="space-y-1 text-sm mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio base:</span>
                  <span className="font-medium">${producto.precio_base_usd} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Costo total:</span>
                  <span className="font-medium">
                    ${producto.costo_total_cop?.toLocaleString('es-CO')} COP
                  </span>
                </div>
                <div className="flex justify-between text-primary-600">
                  <span className="font-medium">Precio final:</span>
                  <span className="font-bold">
                    ${producto.precio_final_cop?.toLocaleString('es-CO')} COP
                  </span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Ganancia:</span>
                  <span className="font-medium">
                    ${producto.ganancia_cop?.toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Editor de Producto */}
      <ModalEditorProducto
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        lista={lista}
        onProductoCreado={handleProductoCreado}
      />
    </div>
  )
}
export default ProductosPage