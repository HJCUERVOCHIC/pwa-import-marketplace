import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import PublicLayout from '../components/PublicLayout'
import { getProductoPublicoById, formatearPrecioCOP } from '../services/catalogoService'
import BotonCompartirWhatsApp from '../components/BotonCompartirWhatsApp'
import { compartirProducto, generarUrlProducto } from '../services/whatsappService'
import { APP_CONFIG } from '../config/app.config'

/**
 * Página de Detalle de Producto (Catálogo Público)
 * Muestra información completa de un producto publicado
 * Accesible sin autenticación
 * Session 012: Incluye Open Graph meta tags para WhatsApp rich previews
 */
function CatalogoProductoPage() {
  const { id: idLista, idProducto } = useParams()
  const navigate = useNavigate()
  const [producto, setProducto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imagenActual, setImagenActual] = useState(0)

  useEffect(() => {
    cargarProducto()
  }, [idProducto])

  async function cargarProducto() {
    try {
      const { data, error } = await getProductoPublicoById(idProducto)
      
      if (error) throw new Error(error)
      
      if (!data) {
        setError('Producto no encontrado o no disponible')
      } else {
        setProducto(data)
        setImagenActual(0)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const siguienteImagen = () => {
    if (producto?.imagenes) {
      setImagenActual((prev) => (prev + 1) % producto.imagenes.length)
    }
  }

  const imagenAnterior = () => {
    if (producto?.imagenes) {
      setImagenActual((prev) => 
        prev === 0 ? producto.imagenes.length - 1 : prev - 1
      )
    }
  }

  // Generar meta tags para Open Graph (WhatsApp, Facebook, etc.)
  const generarMetaTags = () => {
    if (!producto) return null

    const urlProducto = generarUrlProducto(idLista, idProducto)
    const imagenProducto = producto.imagenes && producto.imagenes.length > 0 
      ? producto.imagenes[0] 
      : `${APP_CONFIG.publicUrl}/default-product-image.jpg`
    
    const titulo = producto.titulo
    const precio = formatearPrecioCOP(producto.precio_final_cop)
    const descripcion = producto.descripcion 
      ? producto.descripcion.substring(0, 150) + (producto.descripcion.length > 150 ? '...' : '')
      : `${producto.marca ? producto.marca + ' - ' : ''}${precio}`

    return (
      <Helmet>
        {/* Meta tags básicos */}
        <title>{titulo} - {APP_CONFIG.siteName}</title>
        <meta name="description" content={descripcion} />
        
        {/* Open Graph meta tags (Facebook, WhatsApp, LinkedIn) */}
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content={APP_CONFIG.siteName} />
        <meta property="og:title" content={titulo} />
        <meta property="og:description" content={descripcion} />
        <meta property="og:image" content={imagenProducto} />
        <meta property="og:url" content={urlProducto} />
        
        {/* Dimensiones de imagen recomendadas para WhatsApp */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={titulo} />
        
        {/* Meta tags específicos de producto */}
        <meta property="product:price:amount" content={producto.precio_final_cop} />
        <meta property="product:price:currency" content="COP" />
        {producto.marca && <meta property="product:brand" content={producto.marca} />}
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={titulo} />
        <meta name="twitter:description" content={descripcion} />
        <meta name="twitter:image" content={imagenProducto} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={urlProducto} />
      </Helmet>
    )
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

  if (error || !producto) {
    return (
      <PublicLayout>
        <Helmet>
          <title>Producto no disponible - {APP_CONFIG.siteName}</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="empty-state bg-card border border-neutral-border rounded-lg shadow-sm">
          <div className="empty-state-icon">
            <Package className="w-16 h-16 text-danger" />
          </div>
          <h3 className="empty-state-title">Producto no disponible</h3>
          <p className="empty-state-text">
            {error || 'El producto que buscas no existe o no está disponible'}
          </p>
          <button 
            onClick={() => navigate(`/catalogo/${idLista}`)}
            className="btn btn-primary btn-md"
          >
            Volver a la Lista
          </button>
        </div>
      </PublicLayout>
    )
  }

  const tieneImagenes = producto.imagenes && producto.imagenes.length > 0

  return (
    <PublicLayout>
      {/* Meta tags para Open Graph */}
      {generarMetaTags()}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <button
          onClick={() => navigate('/catalogo')}
          className="text-neutral-slate hover:text-gold-600 transition-colors"
        >
          Catálogo
        </button>
        <span className="text-neutral-stone">/</span>
        <button
          onClick={() => navigate(`/catalogo/${idLista}`)}
          className="text-neutral-slate hover:text-gold-600 transition-colors"
        >
          {producto.lista?.titulo || 'Lista'}
        </button>
        <span className="text-neutral-stone">/</span>
        <span className="text-neutral-charcoal font-medium">
          {producto.titulo}
        </span>
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate(`/catalogo/${idLista}`)}
        className="flex items-center gap-2 text-neutral-slate hover:text-gold-600 mb-6 transition-colors duration-base font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver a Productos
      </button>

      {/* Grid de 2 columnas: Imagen | Detalles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna 1: Carrusel de Imágenes */}
        <div className="card p-6">
          {tieneImagenes ? (
            <div className="space-y-4">
              {/* Imagen principal */}
              <div className="relative aspect-square bg-neutral-gray rounded-lg overflow-hidden">
                <img
                  src={producto.imagenes[imagenActual]}
                  alt={`${producto.titulo} - Imagen ${imagenActual + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Controles de navegación */}
                {producto.imagenes.length > 1 && (
                  <>
                    <button
                      onClick={imagenAnterior}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-md transition-all"
                    >
                      <ChevronLeft className="w-6 h-6 text-neutral-charcoal" />
                    </button>
                    <button
                      onClick={siguienteImagen}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-md transition-all"
                    >
                      <ChevronRight className="w-6 h-6 text-neutral-charcoal" />
                    </button>

                    {/* Indicadores */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {producto.imagenes.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setImagenActual(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === imagenActual
                              ? 'bg-gold-600 w-6'
                              : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Miniaturas */}
              {producto.imagenes.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {producto.imagenes.map((imagen, index) => (
                    <button
                      key={index}
                      onClick={() => setImagenActual(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        index === imagenActual
                          ? 'border-gold-600 shadow-md'
                          : 'border-transparent hover:border-gold-300'
                      }`}
                    >
                      <img
                        src={imagen}
                        alt={`Miniatura ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-square bg-neutral-gray rounded-lg flex items-center justify-center">
              <Package className="w-24 h-24 text-neutral-stone opacity-30" />
            </div>
          )}
        </div>

        {/* Columna 2: Información del Producto */}
        <div className="space-y-6">
          {/* Título y Marca */}
          <div className="card p-6">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-neutral-charcoal mb-3">
              {producto.titulo}
            </h1>
            {producto.marca && (
              <p className="text-lg text-neutral-slate font-medium">
                Marca: <span className="text-gold-600">{producto.marca}</span>
              </p>
            )}
          </div>

          {/* Precio */}
          <div className="card p-6 bg-gradient-to-br from-gold-50 to-gold-100">
            <p className="text-sm text-gold-700 font-medium mb-2 uppercase tracking-wide">
              Precio Final
            </p>
            <p className="text-4xl font-display font-bold text-gold-600 mb-1">
              {formatearPrecioCOP(producto.precio_final_cop)}
            </p>
            <p className="text-sm text-gold-700">COP (Pesos colombianos)</p>
          </div>

          {/* Descripción */}
          {producto.descripcion && (
            <div className="card p-6">
              <h2 className="text-xl font-display font-bold text-neutral-charcoal mb-3">
                Descripción
              </h2>
              <p className="text-neutral-slate leading-relaxed whitespace-pre-line">
                {producto.descripcion}
              </p>
            </div>
          )}

          {/* Call to Action */}
          <div className="card p-6 bg-emerald-50 border-2 border-emerald-200">
            <h3 className="text-lg font-display font-bold text-emerald-900 mb-2">
              ¿Interesado en este producto?
            </h3>
            <p className="text-sm text-emerald-800 mb-4">
              Contáctanos por WhatsApp para más información sobre disponibilidad, envíos y métodos de pago.
            </p>
            <BotonCompartirWhatsApp
              onClick={() => compartirProducto(producto, idLista)}
              variant="default"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

export default CatalogoProductoPage
