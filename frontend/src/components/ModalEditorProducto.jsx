import { useState, useEffect } from 'react'
import { X, Upload, Trash2, Calculator, DollarSign, Percent, Camera } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import { uploadMultipleImages, deleteImage } from '../services/uploadService'

const CATEGORIAS = [
  { value: 'calzado', label: 'Calzado' },
  { value: 'ropa', label: 'Ropa' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'hogar', label: 'Hogar' },
  { value: 'deportes', label: 'Deportes' },
  { value: 'belleza', label: 'Belleza' },
  { value: 'juguetes', label: 'Juguetes' },
  { value: 'otros', label: 'Otros' }
]

function ModalEditorProducto({ isOpen, onClose, lista, onProductoCreado }) {
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [precioManual, setPrecioManual] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    marca: '',
    categoria: 'tecnologia',
    descripcion: '',
    imagenes: [],
    precio_base_usd: '',
    margen_porcentaje: '25',
    precio_final_cop: ''
  })
  const [errors, setErrors] = useState({})
  const [calculos, setCalculos] = useState(null)
  const [imagenesPreview, setImagenesPreview] = useState([])

  // IMPORTANTE: Todos los hooks ANTES de cualquier return condicional
  
  const redondearAMil = (valor) => {
    return Math.round(valor / 1000) * 1000
  }

  const formatearMonedaCOP = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor)
  }

  const calcularValores = () => {
    if (!lista) return
    
    const precioBase = parseFloat(formData.precio_base_usd) || 0
    const margen = parseFloat(formData.margen_porcentaje) || 0
    const trm = parseFloat(lista.trm_lista) || 0

    // Calcular TAX según modo de la lista
    let taxUsd = 0
    if (lista.tax_modo_lista === 'porcentaje') {
      taxUsd = precioBase * (parseFloat(lista.tax_porcentaje_lista) / 100)
    } else if (lista.tax_modo_lista === 'valor_fijo_usd') {
      taxUsd = parseFloat(lista.tax_usd_lista) || 0
    }

    const costoTotalUsd = precioBase + taxUsd
    const costoTotalCop = redondearAMil(costoTotalUsd * trm)
    const precioSugeridoCop = redondearAMil(costoTotalCop * (1 + margen / 100))
    
    // Si NO es manual, actualizar automáticamente el precio final
    let precioFinalCop = precioSugeridoCop
    if (precioManual && formData.precio_final_cop) {
      // Si es manual, usar el valor ingresado
      precioFinalCop = parseFloat(formData.precio_final_cop)
    } else {
      // Si NO es manual, usar el precio sugerido
      precioFinalCop = precioSugeridoCop
      setFormData(prev => ({
        ...prev,
        precio_final_cop: precioSugeridoCop.toString()
      }))
    }
    
    // Calcular ganancia: Precio Final - Costo Total
    const gananciaCop = redondearAMil(precioFinalCop - costoTotalCop)

    setCalculos({
      taxUsd: taxUsd.toFixed(2),
      costoTotalUsd: costoTotalUsd.toFixed(2),
      costoTotalCop,
      precioSugeridoCop,
      precioFinalCop,
      gananciaCop
    })
  }

  // Recalcular cuando cambien precio_base_usd o margen_porcentaje
  useEffect(() => {
    if (formData.precio_base_usd && lista) {
      calcularValores()
    }
  }, [formData.precio_base_usd, formData.margen_porcentaje, precioManual, lista])

  // Recalcular ganancia cuando cambie precio_final_cop manualmente
  useEffect(() => {
    if (precioManual && calculos && formData.precio_final_cop) {
      const precioFinal = parseFloat(formData.precio_final_cop)
      if (!isNaN(precioFinal)) {
        const nuevaGanancia = redondearAMil(precioFinal - calculos.costoTotalCop)
        
        if (nuevaGanancia !== calculos.gananciaCop) {
          setCalculos(prev => ({
            ...prev,
            precioFinalCop: precioFinal,
            gananciaCop: nuevaGanancia
          }))
        }
      }
    }
  }, [formData.precio_final_cop, precioManual])

  // Return condicional DESPUÉS de todos los hooks
  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const handleImagenFromDevice = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)

    try {
      // Subir imágenes a Supabase Storage
      const uploadedUrls = await uploadMultipleImages(files, 'productos')

      // Agregar URLs a preview y formData
      setImagenesPreview(prev => [...prev, ...uploadedUrls])
      setFormData(prev => ({
        ...prev,
        imagenes: [...prev.imagenes, ...uploadedUrls]
      }))

      // Limpiar el input para poder volver a seleccionar la misma imagen
      e.target.value = ''
    } catch (error) {
      console.error('Error subiendo imágenes:', error)
      alert('Error al subir las imágenes. Intenta de nuevo.')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleImagenRemove = async (index) => {
    const imageUrl = imagenesPreview[index]
    
    // Eliminar de Supabase Storage (solo si no es Base64)
    if (imageUrl && !imageUrl.startsWith('data:')) {
      await deleteImage(imageUrl)
    }
    
    // Eliminar de preview y formData
    setImagenesPreview(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index)
    }))
  }

  const validarFormulario = () => {
    const newErrors = {}

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio'
    } else if (formData.titulo.trim().length < 3) {
      newErrors.titulo = 'El título debe tener al menos 3 caracteres'
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Selecciona una categoría'
    }

    if (!formData.precio_base_usd || parseFloat(formData.precio_base_usd) <= 0) {
      newErrors.precio_base_usd = 'El precio base debe ser mayor a 0'
    }

    if (formData.margen_porcentaje && parseFloat(formData.margen_porcentaje) < 0) {
      newErrors.margen_porcentaje = 'El margen no puede ser negativo'
    }

    // Validar precio final vs costo
    if (calculos && formData.precio_final_cop) {
      const precioFinal = parseFloat(formData.precio_final_cop)
      if (precioFinal < calculos.costoTotalCop) {
        newErrors.precio_final_cop = `El precio no puede ser menor al costo (${formatearMonedaCOP(calculos.costoTotalCop)})`
      }
    }

    if (formData.imagenes.length === 0) {
      newErrors.imagenes = 'Agrega al menos una imagen'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validarFormulario()) {
      return
    }

    setLoading(true)

    try {
      const dataToInsert = {
        id_lista: lista.id,
        titulo: formData.titulo.trim(),
        marca: formData.marca.trim() || null,
        categoria: formData.categoria,
        descripcion: formData.descripcion.trim() || null,
        imagenes: formData.imagenes,
        precio_base_usd: parseFloat(formData.precio_base_usd),
        margen_porcentaje: formData.margen_porcentaje ? parseFloat(formData.margen_porcentaje) : null,
        precio_final_cop: parseFloat(formData.precio_final_cop),
        estado: 'borrador'
      }

      const { data, error } = await supabase
        .from('productos')
        .insert([dataToInsert])
        .select()
        .single()

      if (error) throw error

      if (onProductoCreado) {
        onProductoCreado(data)
      }

      onClose()

      // Resetear formulario
      setPrecioManual(false)
      setFormData({
        titulo: '',
        marca: '',
        categoria: 'tecnologia',
        descripcion: '',
        imagenes: [],
        precio_base_usd: '',
        margen_porcentaje: '25',
        precio_final_cop: ''
      })
      setImagenesPreview([])
      setCalculos(null)

      alert('Producto creado exitosamente')
    } catch (error) {
      console.error('Error creando producto:', error)
      alert('Error al crear el producto: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-5xl w-full my-8">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Agregar Producto</h3>
            <p className="text-sm text-gray-500 mt-1">Lista: {lista?.titulo}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Izquierda - Información del Producto */}
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Información del Producto</h4>
                
                {/* Título */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    className={`input-field ${errors.titulo ? 'border-red-500' : ''}`}
                    placeholder="Ej: iPhone 15 Pro Max 256GB"
                    disabled={loading}
                  />
                  {errors.titulo && (
                    <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>
                  )}
                </div>

                {/* Marca */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    name="marca"
                    value={formData.marca}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ej: Apple"
                    disabled={loading}
                  />
                </div>

                {/* Categoría */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className={`input-field ${errors.categoria ? 'border-red-500' : ''}`}
                    disabled={loading}
                  >
                    {CATEGORIAS.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  {errors.categoria && (
                    <p className="text-red-500 text-sm mt-1">{errors.categoria}</p>
                  )}
                </div>

                {/* Descripción */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="input-field"
                    rows="3"
                    placeholder="Descripción del producto"
                    disabled={loading}
                  />
                </div>

                {/* Imágenes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imágenes <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    {/* Botón para tomar foto */}
                    <label className={`btn-secondary flex items-center justify-center gap-2 ${uploadingImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <Camera className="w-4 h-4" />
                      {uploadingImages ? 'Subiendo...' : '📷 Tomar Foto'}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImagenFromDevice}
                        className="hidden"
                        disabled={loading || uploadingImages}
                        multiple
                      />
                    </label>
                    
                    {/* Botón para subir desde galería */}
                    <label className={`btn-secondary flex items-center justify-center gap-2 ${uploadingImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <Upload className="w-4 h-4" />
                      {uploadingImages ? 'Subiendo...' : '🖼️ Desde Galería'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImagenFromDevice}
                        className="hidden"
                        disabled={loading || uploadingImages}
                        multiple
                      />
                    </label>
                  </div>
                  
                  <p className="text-gray-500 text-xs mb-2 italic">
                    📱 "Tomar Foto" abre la cámara en dispositivos móviles. En PC ambos abren el selector de archivos.
                  </p>
                  
                  {errors.imagenes && (
                    <p className="text-red-500 text-sm mb-2">{errors.imagenes}</p>
                  )}

                  {uploadingImages && (
                    <p className="text-blue-600 text-sm mb-2 flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                      Subiendo imágenes a Supabase Storage...
                    </p>
                  )}

                  {imagenesPreview.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {imagenesPreview.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleImagenRemove(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={loading || uploadingImages}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-gray-500 text-xs">
                    ✓ Las imágenes se guardan automáticamente en Supabase Storage
                  </p>
                </div>
              </div>
            </div>

            {/* Columna Derecha - Calculadora de Precios */}
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Calculadora de Precios
                </h4>

                {/* Parámetros de la Lista (Solo Lectura) */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Parámetros de la Lista</p>
                  <div className="space-y-1 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>TRM:</span>
                      <span className="font-medium">${lista?.trm_lista?.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TAX:</span>
                      <span className="font-medium">
                        {lista?.tax_modo_lista === 'porcentaje'
                          ? `${lista?.tax_porcentaje_lista}%`
                          : `$${lista?.tax_usd_lista} USD`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Precio Base USD */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Base (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="precio_base_usd"
                      value={formData.precio_base_usd}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.precio_base_usd ? 'border-red-500' : ''}`}
                      placeholder="99.99"
                      step="0.01"
                      min="0"
                      disabled={loading}
                    />
                  </div>
                  {errors.precio_base_usd && (
                    <p className="text-red-500 text-sm mt-1">{errors.precio_base_usd}</p>
                  )}
                </div>

                {/* Margen % */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Margen de Ganancia (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="margen_porcentaje"
                      value={formData.margen_porcentaje}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.margen_porcentaje ? 'border-red-500' : ''}`}
                      placeholder="25"
                      step="0.01"
                      min="0"
                      disabled={loading}
                    />
                  </div>
                  {errors.margen_porcentaje && (
                    <p className="text-red-500 text-sm mt-1">{errors.margen_porcentaje}</p>
                  )}
                </div>

                {/* Resultados del Cálculo */}
                {calculos && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">TAX (USD):</span>
                      <span className="font-medium">${calculos.taxUsd}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Costo Total (USD):</span>
                      <span className="font-medium">${calculos.costoTotalUsd}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2"></div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Costo Total (COP):</span>
                      <span className="font-semibold text-red-600">
                        {formatearMonedaCOP(calculos.costoTotalCop)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Precio Sugerido (COP):</span>
                      <span className="font-medium text-blue-600">
                        {formatearMonedaCOP(calculos.precioSugeridoCop)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Precio Final COP (Editable) */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Precio Final de Venta (COP) <span className="text-red-500">*</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={precioManual}
                        onChange={(e) => setPrecioManual(e.target.checked)}
                        className="rounded border-gray-300"
                        disabled={loading}
                      />
                      <span className="text-gray-600">Editar manualmente</span>
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      type="text"
                      name="precio_final_cop"
                      value={formData.precio_final_cop ? parseInt(formData.precio_final_cop).toLocaleString('es-CO') : ''}
                      onChange={(e) => {
                        // Remover formato y guardar solo números
                        const rawValue = e.target.value.replace(/\D/g, '')
                        handleChange({ target: { name: 'precio_final_cop', value: rawValue } })
                      }}
                      className={`input-field pl-7 pr-3 font-bold text-xl text-right ${
                        errors.precio_final_cop ? 'border-red-500' : ''
                      } ${!precioManual ? 'bg-gray-50' : ''}`}
                      placeholder="0"
                      disabled={loading || !precioManual}
                      readOnly={!precioManual}
                    />
                  </div>
                  {errors.precio_final_cop && (
                    <p className="text-red-500 text-sm mt-1">{errors.precio_final_cop}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {precioManual 
                      ? 'Puedes ajustar el precio final manualmente (se redondea a miles)'
                      : 'Se actualiza automáticamente con el precio sugerido (redondeado a miles)'}
                  </p>
                </div>

                {/* Ganancia */}
                {calculos && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-900">Ganancia Esperada:</span>
                      <span className="text-xl font-bold text-green-700">
                        {formatearMonedaCOP(calculos.gananciaCop)}
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Precio Final - Costo Total
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading || uploadingImages}
            >
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalEditorProducto