'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const CATEGORIAS = [
  { value: 'calzado', label: 'Calzado' },
  { value: 'ropa', label: 'Ropa' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'hogar', label: 'Hogar' },
  { value: 'deportes', label: 'Deportes' },
  { value: 'belleza', label: 'Belleza' },
  { value: 'juguetes', label: 'Juguetes' },
  { value: 'otros', label: 'Otros' }
]

const ESTADOS_PRODUCTO = {
  borrador: { label: 'Borrador', color: 'bg-yellow-100 text-yellow-800' },
  listo_para_publicar: { label: 'Listo', color: 'bg-blue-100 text-blue-800' },
  publicado: { label: 'Publicado', color: 'bg-green-100 text-green-800' },
  oculto: { label: 'Oculto', color: 'bg-gray-100 text-gray-800' }
}

export default function ProductosPage() {
  const router = useRouter()
  const params = useParams()
  const idLista = params.id

  const [lista, setLista] = useState(null)
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [precioManual, setPrecioManual] = useState(false)
  const [calculos, setCalculos] = useState(null)
  const [imagenesPreview, setImagenesPreview] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)

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

  useEffect(() => {
    if (idLista) {
      checkAuth()
      cargarDatos()
    }
  }, [idLista])

  useEffect(() => {
    if (formData.precio_base_usd && lista) {
      calcularValores()
    }
  }, [formData.precio_base_usd, formData.margen_porcentaje, precioManual, lista])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
    }
  }

  const cargarDatos = async () => {
    try {
      const { data: listaData, error: listaError } = await supabase
        .from('listas_oferta')
        .select('*')
        .eq('id', idLista)
        .single()

      if (listaError) throw listaError
      setLista(listaData)

      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('*')
        .eq('id_lista', idLista)
        .order('created_at', { ascending: false })

      if (productosError) throw productosError
      setProductos(productosData || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const redondearAMil = (valor) => Math.round(valor / 1000) * 1000

  const formatearCOP = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor)
  }

  const calcularValores = () => {
    if (!lista) return

    const precioBase = parseFloat(formData.precio_base_usd) || 0
    const margen = parseFloat(formData.margen_porcentaje) || 0
    const trm = parseFloat(lista.trm_lista) || 0

    let taxUsd = 0
    if (lista.tax_modo_lista === 'porcentaje') {
      taxUsd = precioBase * (parseFloat(lista.tax_porcentaje_lista) / 100)
    } else {
      taxUsd = parseFloat(lista.tax_usd_lista) || 0
    }

    const costoTotalUsd = precioBase + taxUsd
    const costoTotalCop = redondearAMil(costoTotalUsd * trm)
    const precioSugeridoCop = redondearAMil(costoTotalCop * (1 + margen / 100))

    let precioFinalCop = precioSugeridoCop
    if (!precioManual) {
      setFormData(prev => ({ ...prev, precio_final_cop: precioSugeridoCop.toString() }))
    } else if (formData.precio_final_cop) {
      precioFinalCop = parseFloat(formData.precio_final_cop)
    }

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleImageUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    try {
      const uploadedUrls = []

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const filePath = `productos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('productos-imagenes')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('productos-imagenes')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      setImagenesPreview(prev => [...prev, ...uploadedUrls])
      setFormData(prev => ({ ...prev, imagenes: [...prev.imagenes, ...uploadedUrls] }))
      e.target.value = ''
    } catch (error) {
      console.error('Error subiendo imagenes:', error)
      alert('Error al subir las imagenes')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleImageRemove = (index) => {
    setImagenesPreview(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({ ...prev, imagenes: prev.imagenes.filter((_, i) => i !== index) }))
  }

  const validarFormulario = () => {
    const newErrors = {}

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El titulo es obligatorio'
    }

    if (!formData.precio_base_usd || parseFloat(formData.precio_base_usd) <= 0) {
      newErrors.precio_base_usd = 'El precio base debe ser mayor a 0'
    }

    if (formData.imagenes.length === 0) {
      newErrors.imagenes = 'Agrega al menos una imagen'
    }

    if (calculos && formData.precio_final_cop) {
      const precioFinal = parseFloat(formData.precio_final_cop)
      if (precioFinal < calculos.costoTotalCop) {
        newErrors.precio_final_cop = `El precio no puede ser menor al costo (${formatearCOP(calculos.costoTotalCop)})`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validarFormulario()) return

    setActionLoading(true)
    try {
      const dataToInsert = {
        id_lista: lista.id,
        titulo: formData.titulo.trim(),
        marca: formData.marca.trim() || null,
        categoria: formData.categoria,
        descripcion: formData.descripcion.trim() || null,
        imagenes: formData.imagenes,
        precio_base_usd: parseFloat(formData.precio_base_usd),
        margen_porcentaje: parseFloat(formData.margen_porcentaje) || null,
        costo_total_cop: calculos?.costoTotalCop,
        precio_final_cop: parseFloat(formData.precio_final_cop),
        ganancia_cop: calculos?.gananciaCop,
        estado: 'borrador'
      }

      const { data, error } = await supabase
        .from('productos')
        .insert([dataToInsert])
        .select()
        .single()

      if (error) throw error

      setProductos(prev => [data, ...prev])
      setShowModal(false)
      resetForm()
      alert('Producto creado exitosamente')
    } catch (error) {
      console.error('Error creando producto:', error)
      alert('Error al crear el producto: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const resetForm = () => {
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
    setPrecioManual(false)
    setErrors({})
  }

  // Acciones de Producto
  const getAccionesProducto = (estado, estadoLista) => {
    if (['cerrada', 'archivada'].includes(estadoLista)) return []

    const acciones = {
      borrador: ['marcar_listo'],
      listo_para_publicar: estadoLista === 'publicada' ? ['publicar'] : [],
      publicado: ['ocultar'],
      oculto: ['publicar']
    }
    return acciones[estado] || []
  }

  const handleMarcarListo = async (producto) => {
    if (!producto.costo_total_cop || !producto.precio_final_cop || !producto.ganancia_cop) {
      alert('El producto debe tener calculos completos')
      return
    }

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('productos')
        .update({ estado: 'listo_para_publicar', updated_at: new Date().toISOString() })
        .eq('id', producto.id)

      if (error) throw error
      alert('Producto marcado como listo')
      cargarDatos()
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePublicarProducto = async (producto) => {
    if (lista.estado !== 'publicada') {
      alert('La lista debe estar publicada primero')
      return
    }

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('productos')
        .update({ estado: 'publicado', updated_at: new Date().toISOString() })
        .eq('id', producto.id)

      if (error) throw error
      alert('Producto publicado')
      cargarDatos()
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleOcultarProducto = async (producto) => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('productos')
        .update({ estado: 'oculto', updated_at: new Date().toISOString() })
        .eq('id', producto.id)

      if (error) throw error
      alert('Producto ocultado')
      cargarDatos()
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const listaModificable = lista && !['cerrada', 'archivada'].includes(lista.estado)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  if (!lista) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Lista no encontrada</p>
          <Link href="/admin/listas" className="text-blue-600 hover:underline">
            Volver a Listas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/listas" className="text-blue-600 hover:text-blue-800">
                ← Volver a Listas
              </Link>
            </div>
            {listaModificable && (
              <div className="flex items-center">
                <button
                  onClick={() => { resetForm(); setShowModal(true); }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  + Agregar Producto
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Header de Lista */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lista.titulo}</h1>
              {lista.descripcion && <p className="text-gray-600 mt-1">{lista.descripcion}</p>}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              lista.estado === 'publicada' ? 'bg-green-100 text-green-800' :
              lista.estado === 'cerrada' ? 'bg-gray-100 text-gray-800' :
              lista.estado === 'archivada' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {lista.estado}
            </span>
          </div>

          {!listaModificable && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-yellow-800">
                Esta lista esta <strong>{lista.estado}</strong> y no se pueden agregar ni modificar productos.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">TRM</p>
              <p className="text-xl font-bold">${lista.trm_lista?.toLocaleString('es-CO')}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">TAX</p>
              <p className="text-xl font-bold">
                {lista.tax_modo_lista === 'porcentaje' ? `${lista.tax_porcentaje_lista}%` : `$${lista.tax_usd_lista} USD`}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Productos</p>
              <p className="text-xl font-bold">{productos.length}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Publicados</p>
              <p className="text-xl font-bold">{productos.filter(p => p.estado === 'publicado').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Productos */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {productos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">No hay productos en esta lista</p>
            {listaModificable && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Agregar Primer Producto
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.map((producto) => {
              const estadoInfo = ESTADOS_PRODUCTO[producto.estado] || ESTADOS_PRODUCTO.borrador
              const acciones = getAccionesProducto(producto.estado, lista.estado)

              return (
                <div key={producto.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {producto.imagenes?.[0] ? (
                    <img src={producto.imagenes[0]} alt={producto.titulo} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">Sin imagen</span>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{producto.titulo}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${estadoInfo.color}`}>
                        {estadoInfo.label}
                      </span>
                    </div>

                    {producto.marca && <p className="text-sm text-gray-500 mb-2">{producto.marca}</p>}

                    <div className="space-y-1 text-sm border-t pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Precio base:</span>
                        <span className="font-medium">${producto.precio_base_usd} USD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Costo:</span>
                        <span className="font-medium">{formatearCOP(producto.costo_total_cop || 0)}</span>
                      </div>
                      <div className="flex justify-between text-lg pt-2 border-t">
                        <span className="font-medium text-gray-700">Precio:</span>
                        <span className="font-bold text-green-600">{formatearCOP(producto.precio_final_cop || 0)}</span>
                      </div>
                      <div className="flex justify-between bg-emerald-50 -mx-4 px-4 py-2">
                        <span className="text-emerald-700">Ganancia:</span>
                        <span className="font-bold text-emerald-700">{formatearCOP(producto.ganancia_cop || 0)}</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    {acciones.length > 0 && (
                      <div className="flex gap-2 mt-4 pt-3 border-t">
                        {acciones.includes('marcar_listo') && (
                          <button
                            onClick={() => handleMarcarListo(producto)}
                            disabled={actionLoading}
                            className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            Marcar Listo
                          </button>
                        )}
                        {acciones.includes('publicar') && (
                          <button
                            onClick={() => handlePublicarProducto(producto)}
                            disabled={actionLoading}
                            className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            Publicar
                          </button>
                        )}
                        {acciones.includes('ocultar') && (
                          <button
                            onClick={() => handleOcultarProducto(producto)}
                            disabled={actionLoading}
                            className="flex-1 bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                          >
                            Ocultar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal Agregar Producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white rounded-t-lg z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Agregar Producto</h3>
                <p className="text-sm text-gray-500">Lista: {lista.titulo}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna Izquierda */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Informacion del Producto</h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titulo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md ${errors.titulo ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Ej: iPhone 15 Pro Max"
                    />
                    {errors.titulo && <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                    <input
                      type="text"
                      name="marca"
                      value={formData.marca}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Ej: Apple"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {CATEGORIAS.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imagenes <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                      className="w-full"
                    />
                    {errors.imagenes && <p className="text-red-500 text-sm mt-1">{errors.imagenes}</p>}
                    {uploadingImages && <p className="text-blue-600 text-sm mt-1">Subiendo imagenes...</p>}

                    {imagenesPreview.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {imagenesPreview.map((url, index) => (
                          <div key={index} className="relative group">
                            <img src={url} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded" />
                            <button
                              type="button"
                              onClick={() => handleImageRemove(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs opacity-0 group-hover:opacity-100"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna Derecha - Calculadora */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Calculadora de Precios</h4>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">Parametros de la Lista</p>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div className="flex justify-between">
                        <span>TRM:</span>
                        <span className="font-medium">${lista.trm_lista?.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TAX:</span>
                        <span className="font-medium">
                          {lista.tax_modo_lista === 'porcentaje' ? `${lista.tax_porcentaje_lista}%` : `$${lista.tax_usd_lista} USD`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Base (USD) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="precio_base_usd"
                      value={formData.precio_base_usd}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md ${errors.precio_base_usd ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="99.99"
                      step="0.01"
                      min="0"
                    />
                    {errors.precio_base_usd && <p className="text-red-500 text-sm mt-1">{errors.precio_base_usd}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Margen de Ganancia (%)</label>
                    <input
                      type="number"
                      name="margen_porcentaje"
                      value={formData.margen_porcentaje}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="25"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  {calculos && (
                    <div className="bg-gray-50 border rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">TAX (USD):</span>
                        <span className="font-medium">${calculos.taxUsd}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Costo Total (USD):</span>
                        <span className="font-medium">${calculos.costoTotalUsd}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Costo Total (COP):</span>
                          <span className="font-semibold text-red-600">{formatearCOP(calculos.costoTotalCop)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Precio Sugerido:</span>
                        <span className="font-medium text-blue-600">{formatearCOP(calculos.precioSugeridoCop)}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Precio Final (COP) <span className="text-red-500">*</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={precioManual}
                          onChange={(e) => setPrecioManual(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-gray-600">Editar manualmente</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      name="precio_final_cop"
                      value={formData.precio_final_cop}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md text-xl font-bold ${errors.precio_final_cop ? 'border-red-500' : 'border-gray-300'} ${!precioManual ? 'bg-gray-50' : ''}`}
                      disabled={!precioManual}
                      readOnly={!precioManual}
                    />
                    {errors.precio_final_cop && <p className="text-red-500 text-sm mt-1">{errors.precio_final_cop}</p>}
                  </div>

                  {calculos && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-900">Ganancia Esperada:</span>
                        <span className="text-xl font-bold text-green-700">{formatearCOP(calculos.gananciaCop)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || uploadingImages}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}