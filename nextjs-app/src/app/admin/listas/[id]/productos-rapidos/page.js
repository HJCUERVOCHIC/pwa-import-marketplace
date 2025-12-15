'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
// Motor Unificado de Cálculo de Precios - ÚNICA fuente de verdad
import { calculatePricing, crearPricingInput, formatearCOP } from '@/lib/pricingEngine'

const ITEMS_PER_PAGE = 12

export default function ProductosRapidosPage() {
  const router = useRouter()
  const params = useParams()
  const idLista = params.id

  const [lista, setLista] = useState(null)
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [productoEditando, setProductoEditando] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [calculos, setCalculos] = useState(null)
  const [imagenesPreview, setImagenesPreview] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [hasCameraSupport, setHasCameraSupport] = useState(false)
  const [consecutivoActual, setConsecutivoActual] = useState(1)
  const [showAll, setShowAll] = useState(false)

  // FormData ultra simplificado - solo imagen, precio y descuento
  const [formData, setFormData] = useState({
    imagenes: [],
    precio_base_usd: '',
    margen_porcentaje: '25',
    descuento_porcentaje: '0'
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (idLista) {
      checkAuth()
      cargarLista()
    }
  }, [idLista])

  useEffect(() => {
    if (lista) {
      cargarProductos()
      cargarUltimoConsecutivo()
    }
  }, [lista])

  useEffect(() => {
    if (formData.precio_base_usd && lista) {
      calcularValores()
    }
  }, [formData.precio_base_usd, formData.margen_porcentaje, formData.descuento_porcentaje, lista])

  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const hasCamera = devices.some(device => device.kind === 'videoinput')
          setHasCameraSupport(hasCamera)
        } else {
          const userAgent = navigator.userAgent || ''
          const isMobile = /android|iphone|ipad|ipod/i.test(userAgent.toLowerCase())
          setHasCameraSupport(isMobile)
        }
      } catch (error) {
        setHasCameraSupport(false)
      }
    }
    checkCameraSupport()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
    }
  }

  const cargarLista = async () => {
    try {
      const { data: listaData, error: listaError } = await supabase
        .from('listas_oferta')
        .select('*')
        .eq('id', idLista)
        .single()

      if (listaError) throw listaError
      setLista(listaData)
    } catch (error) {
      console.error('Error cargando lista:', error)
    }
  }

  const cargarProductos = async () => {
    setLoading(true)
    try {
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('*')
        .eq('id_lista', idLista)
        .order('created_at', { ascending: false })

      if (productosError) throw productosError
      setProductos(productosData || [])
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarUltimoConsecutivo = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('titulo')
        .eq('id_lista', idLista)
        .like('titulo', 'PROD-%')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        const ultimoTitulo = data[0].titulo
        const match = ultimoTitulo.match(/PROD-(\d+)/)
        if (match) {
          setConsecutivoActual(parseInt(match[1]) + 1)
        }
      }
    } catch (error) {
      console.error('Error cargando consecutivo:', error)
    }
  }

  const generarTituloConsecutivo = () => {
    return `PROD-${String(consecutivoActual).padStart(4, '0')}`
  }

  /**
   * Calcula todos los valores usando el Motor Unificado de Precios
   * IMPORTANTE: Esta es la ÚNICA forma de calcular precios en este componente
   */
  const calcularValores = () => {
    if (!lista || !formData.precio_base_usd) return

    // Crear input para el motor usando el helper
    const pricingInput = crearPricingInput({
      lista,
      precio_base_usd: parseFloat(formData.precio_base_usd),
      margen_porcentaje: parseFloat(formData.margen_porcentaje) || 0,
      descuento_porcentaje: parseFloat(formData.descuento_porcentaje) || 0,
      precio_final_manual_cop: null
    })

    // Ejecutar el motor de precios
    const resultado = calculatePricing(pricingInput)

    if (!resultado.valid) {
      console.error('Error en cálculo de precios:', resultado.error)
      return
    }

    // Mapear resultados del motor al formato esperado por la UI
    setCalculos({
      // Valores del motor (fuente de verdad)
      precio_con_tax_usd: resultado.precio_con_tax_usd,
      costo_total_usd: resultado.costo_total_usd,
      costo_total_cop: resultado.costo_total_cop,
      precio_sugerido_cop: resultado.precio_sugerido_cop,
      precio_final_cop: resultado.precio_final_cop,
      ganancia_cop: resultado.ganancia_cop,
      valor_producto_cop: resultado.valor_producto_cop,
      descuento_cop: resultado.descuento_cop,
      
      // Valores adicionales para UI
      descuentoPorcentaje: parseFloat(formData.descuento_porcentaje) || 0,
      ahorroTotal: resultado.valor_producto_cop - resultado.precio_final_cop,
      tiene_descuento: resultado.tiene_descuento
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validarFormulario = () => {
    const newErrors = {}
    if (!formData.precio_base_usd || parseFloat(formData.precio_base_usd) <= 0) {
      newErrors.precio_base_usd = 'El precio base debe ser mayor a 0'
    }
    if (formData.imagenes.length === 0) {
      newErrors.imagenes = 'Debes agregar al menos una imagen'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploadingImages(true)
    const nuevasUrls = []

    try {
      for (const file of files) {
        let fileExt = file.name.split('.').pop()
        
        if (!fileExt || fileExt === file.name) {
          const mimeToExt = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/heic': 'heic',
            'image/heif': 'heif'
          }
          fileExt = mimeToExt[file.type] || 'jpg'
        }

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `productos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('productos-imagenes')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('productos-imagenes')
          .getPublicUrl(filePath)

        nuevasUrls.push(publicUrl)
      }

      setFormData(prev => ({
        ...prev,
        imagenes: [...prev.imagenes, ...nuevasUrls]
      }))
      setImagenesPreview(prev => [...prev, ...nuevasUrls])
      
      e.target.value = ''
    } catch (error) {
      console.error('Error subiendo imágenes:', error)
      alert('Error al subir imágenes: ' + error.message)
    } finally {
      setUploadingImages(false)
    }
  }

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index)
    }))
    setImagenesPreview(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validarFormulario()) return

    if (!calculos || !calculos.precio_final_cop) {
      alert('Error: No se pudieron calcular los precios. Verifica los datos ingresados.')
      return
    }

    setActionLoading(true)
    try {
      const tituloAutomatico = modoEdicion ? productoEditando.titulo : generarTituloConsecutivo()
      
      // TODOS los valores calculados vienen del Motor de Precios (pricingEngine.js)
      // Ya NO hay trigger en la BD - el frontend es la ÚNICA fuente de cálculos
      const datosProducto = {
        titulo: tituloAutomatico,
        marca: null,
        categoria: 'otros',
        descripcion: null,
        imagenes: formData.imagenes,
        estado: 'publicado',
        
        // Inputs del usuario
        precio_base_usd: parseFloat(formData.precio_base_usd),
        margen_porcentaje: parseFloat(formData.margen_porcentaje) || null,
        
        // Valores calculados por el Motor de Precios
        costo_total_usd: calculos.costo_total_usd,
        costo_total_cop: calculos.costo_total_cop,
        precio_sugerido_cop: calculos.precio_sugerido_cop,
        precio_final_cop: calculos.precio_final_cop,
        ganancia_cop: calculos.ganancia_cop,
        valor_producto_cop: calculos.valor_producto_cop, // Precio sin descuento (para mostrar tachado)
      }

      let error

      if (modoEdicion && productoEditando) {
        const resultado = await supabase
          .from('productos')
          .update(datosProducto)
          .eq('id', productoEditando.id)
        
        error = resultado.error
      } else {
        const resultado = await supabase
          .from('productos')
          .insert([{ ...datosProducto, id_lista: idLista }])
        
        error = resultado.error
        
        if (!error) {
          setConsecutivoActual(prev => prev + 1)
        }
      }

      if (error) throw error

      setShowModal(false)
      resetForm()
      cargarProductos()
    } catch (error) {
      alert(`Error al ${modoEdicion ? 'actualizar' : 'crear'} producto: ` + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      imagenes: [],
      precio_base_usd: '',
      margen_porcentaje: '25',
      descuento_porcentaje: '0'
    })
    setErrors({})
    setCalculos(null)
    setImagenesPreview([])
    setModoEdicion(false)
    setProductoEditando(null)
  }

  const handleEditarProducto = (producto) => {
    setModoEdicion(true)
    setProductoEditando(producto)
    
    // Calcular el descuento aplicado basándose en valor_producto_cop vs precio_final_cop
    let descuentoCalculado = 0
    const valorSinDescuento = producto.valor_producto_cop || producto.precio_sugerido_cop || 0
    if (valorSinDescuento && producto.precio_final_cop && 
        producto.precio_final_cop < valorSinDescuento) {
      descuentoCalculado = Math.round(
        ((valorSinDescuento - producto.precio_final_cop) / valorSinDescuento) * 100
      )
    }
    
    setFormData({
      imagenes: producto.imagenes || [],
      precio_base_usd: producto.precio_base_usd?.toString() || '',
      margen_porcentaje: producto.margen_porcentaje?.toString() || '25',
      descuento_porcentaje: descuentoCalculado.toString()
    })
    setImagenesPreview(producto.imagenes || [])
    setShowModal(true)
  }

  const handleEliminarProducto = async (producto) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar "${producto.titulo}"?\n\nEsta acción no se puede deshacer.`
    )
    
    if (!confirmar) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', producto.id)

      if (error) throw error

      cargarProductos()
    } catch (error) {
      alert('Error al eliminar: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Función para generar imagen tipo ficha del producto (solo precios, sin título/descripción)
  const generarImagenProducto = async (producto) => {
    // valor_producto_cop = precio SIN descuento
    // precio_final_cop = precio CON descuento
    const precioFinal = producto.precio_final_cop || 0
    const valorSinDescuento = producto.valor_producto_cop || producto.precio_sugerido_cop || 0
    const tieneDescuento = valorSinDescuento > precioFinal && precioFinal > 0
    const descuentoPorcentaje = tieneDescuento 
      ? Math.round(((valorSinDescuento - precioFinal) / valorSinDescuento) * 100)
      : 0
    
    return new Promise(async (resolve, reject) => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Dimensiones
        const anchoCanvas = 800
        const altoImagen = 700
        const altoBloque = tieneDescuento ? 180 : 140
        const altoCanvas = altoImagen + altoBloque
        
        canvas.width = anchoCanvas
        canvas.height = altoCanvas
        
        // Fondo blanco
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, anchoCanvas, altoCanvas)
        
        // Cargar imagen del producto
        if (producto.imagenes?.[0]) {
          const img = new window.Image()
          img.crossOrigin = 'anonymous'
          
          img.onload = () => {
            // Calcular proporciones para centrar y cubrir
            const imgRatio = img.width / img.height
            const canvasRatio = anchoCanvas / altoImagen
            
            let drawWidth, drawHeight, drawX, drawY
            
            if (imgRatio > canvasRatio) {
              drawHeight = altoImagen
              drawWidth = img.width * (altoImagen / img.height)
              drawX = (anchoCanvas - drawWidth) / 2
              drawY = 0
            } else {
              drawWidth = anchoCanvas
              drawHeight = img.height * (anchoCanvas / img.width)
              drawX = 0
              drawY = (altoImagen - drawHeight) / 2
            }
            
            // Fondo gris claro para la zona de imagen
            ctx.fillStyle = '#F3F4F6'
            ctx.fillRect(0, 0, anchoCanvas, altoImagen)
            
            // Dibujar imagen
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
            
            // Badge de descuento en la imagen
            if (tieneDescuento) {
              ctx.fillStyle = '#EF4444'
              ctx.beginPath()
              ctx.roundRect(20, 20, 120, 50, 8)
              ctx.fill()
              ctx.fillStyle = '#FFFFFF'
              ctx.font = 'bold 28px Arial, sans-serif'
              ctx.textAlign = 'center'
              ctx.fillText(`-${descuentoPorcentaje}%`, 80, 55)
              ctx.textAlign = 'left'
            }
            
            // Bloque inferior con gradiente naranja
            const gradient = ctx.createLinearGradient(0, altoImagen, 0, altoCanvas)
            gradient.addColorStop(0, '#f97316')
            gradient.addColorStop(1, '#ea580c')
            ctx.fillStyle = gradient
            ctx.fillRect(0, altoImagen, anchoCanvas, altoBloque)
            
            // Contenido del bloque
            const padding = 30
            let yPos = altoImagen + 45
            
            if (tieneDescuento) {
              // Precio tachado
              ctx.fillStyle = 'rgba(255,255,255,0.7)'
              ctx.font = '24px Arial, sans-serif'
              const precioTachado = formatearCOP(valorSinDescuento)
              ctx.fillText(precioTachado, padding, yPos)
              
              // Línea de tachado
              const textWidth = ctx.measureText(precioTachado).width
              ctx.strokeStyle = 'rgba(255,255,255,0.7)'
              ctx.lineWidth = 2
              ctx.beginPath()
              ctx.moveTo(padding, yPos - 8)
              ctx.lineTo(padding + textWidth, yPos - 8)
              ctx.stroke()
              
              // Precio con descuento (grande)
              yPos += 55
              ctx.fillStyle = '#FFFFFF'
              ctx.font = 'bold 52px Arial, sans-serif'
              ctx.fillText(formatearCOP(precioFinal), padding, yPos)
              
              // Texto de ahorro
              yPos += 35
              ctx.fillStyle = '#FEF08A'
              ctx.font = 'bold 20px Arial, sans-serif'
              ctx.fillText(`🔥 Ahorras ${formatearCOP(valorSinDescuento - precioFinal)}`, padding, yPos)
            } else {
              // Solo precio (grande)
              yPos += 15
              ctx.fillStyle = '#FFFFFF'
              ctx.font = 'bold 52px Arial, sans-serif'
              ctx.fillText(formatearCOP(precioFinal), padding, yPos)
            }
            
            // Logo de la tienda (derecha)
            ctx.fillStyle = 'rgba(255,255,255,0.9)'
            ctx.font = 'italic 18px Arial, sans-serif'
            ctx.textAlign = 'right'
            ctx.fillText('Chic Import USA', anchoCanvas - padding, altoCanvas - 25)
            ctx.textAlign = 'left'
            
            // Convertir a blob
            canvas.toBlob((blob) => {
              resolve(blob)
            }, 'image/jpeg', 0.92)
          }
          
          img.onerror = () => {
            reject(new Error('No se pudo cargar la imagen'))
          }
          
          img.src = producto.imagenes[0]
        } else {
          reject(new Error('El producto no tiene imagen'))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  // Compartir por WhatsApp - Imagen generada con precios + registrar en BD
  const handleCompartirWhatsApp = async (producto) => {
    try {
      setActionLoading(true)
      
      if (!producto.imagenes?.[0]) {
        alert('El producto no tiene imagen para compartir')
        setActionLoading(false)
        return
      }

      // Registrar en BD que se compartió
      const ahora = new Date().toISOString()
      const vecesCompartido = (producto.veces_compartido || 0) + 1
      
      await supabase
        .from('productos')
        .update({ 
          ultimo_compartido: ahora,
          veces_compartido: vecesCompartido
        })
        .eq('id', producto.id)

      // Generar imagen tipo ficha con precios
      const imagenBlob = await generarImagenProducto(producto)
      const file = new File([imagenBlob], `producto-${producto.id}.jpg`, { type: 'image/jpeg' })

      // Compartir (sin mensaje de texto, la imagen ya tiene toda la info)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file]
        })
      } else {
        // Fallback: descargar imagen
        const url = URL.createObjectURL(imagenBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `producto-${producto.id}.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        alert('Imagen descargada. Puedes compartirla manualmente en WhatsApp.')
      }

      // Recargar para mostrar el contador actualizado
      cargarProductos()
      
    } catch (error) {
      console.log('Error compartiendo:', error)
      if (error.name !== 'AbortError') {
        alert('Error al compartir: ' + error.message)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const listaModificable = lista?.estado === 'borrador' || lista?.estado === 'publicada'
  const productosVisibles = showAll ? productos : productos.slice(0, ITEMS_PER_PAGE)
  const hayMasProductos = productos.length > ITEMS_PER_PAGE

  if (!lista) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-elegant border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutrals-graySoft">Cargando...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Header */}
      <header className="bg-white border-b-[3px] border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <Link 
                  href="/admin/listas"
                  className="text-neutrals-graySoft hover:text-neutrals-black"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-neutrals-black">
                  {lista.titulo}
                </h1>
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  ⚡ RÁPIDO
                </span>
              </div>
              <p className="text-sm text-neutrals-graySoft mt-1 ml-9">
                Solo imagen, precio y descuento
              </p>
            </div>

            <div className="flex items-center gap-6 sm:gap-8">
              <div className="text-center">
                <p className="font-display text-2xl font-bold" style={{ color: '#D4AF37' }}>
                  ${lista.trm_lista?.toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-neutrals-graySoft uppercase tracking-wide">TRM</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold" style={{ color: '#D4AF37' }}>
                  {lista.tax_modo_lista === 'porcentaje' 
                    ? `${lista.tax_porcentaje_lista}%` 
                    : `$${lista.tax_usd_lista}`}
                </p>
                <p className="text-xs text-neutrals-graySoft uppercase tracking-wide">TAX</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-orange-500">
                  {productos.length}
                </p>
                <p className="text-xs text-neutrals-graySoft uppercase tracking-wide">Productos</p>
              </div>
            </div>
          </div>

          {listaModificable && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Agregar Producto</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Lista de Productos */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutrals-graySoft">Cargando productos...</p>
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-16">
            <div className="card-premium p-12 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl" style={{ backgroundColor: '#fff7ed' }}>
                ⚡
              </div>
              <h3 className="font-display text-xl text-neutrals-black mb-2">
                No hay productos
              </h3>
              <p className="text-neutrals-graySoft mb-6">
                Agrega productos rápidos a esta lista.
              </p>
              {listaModificable && (
                <button
                  onClick={() => { resetForm(); setShowModal(true); }}
                  className="px-5 py-2.5 rounded-lg font-medium text-white"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                >
                  Agregar Producto
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {productosVisibles.map((producto, index) => {
                // valor_producto_cop = precio SIN descuento (para mostrar tachado)
                // precio_final_cop = precio CON descuento (precio de venta)
                // Fallback a precio_sugerido_cop para productos antiguos sin valor_producto_cop
                const valorSinDescuento = producto.valor_producto_cop || producto.precio_sugerido_cop || 0
                const precioFinal = producto.precio_final_cop || 0
                
                // Hay descuento si valor_sin_descuento > precio_final
                const tieneDescuento = valorSinDescuento > precioFinal && precioFinal > 0
                
                // Calcular porcentaje de descuento para mostrar badge
                const descuentoPorcentaje = tieneDescuento 
                  ? Math.round(((valorSinDescuento - precioFinal) / valorSinDescuento) * 100)
                  : 0

                return (
                  <article 
                    key={producto.id} 
                    className="card-premium overflow-hidden flex flex-col"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    {/* Imagen */}
                    <div className="aspect-square relative bg-neutrals-grayBg">
                      {producto.imagenes?.[0] ? (
                        <img 
                          src={producto.imagenes[0]} 
                          alt={producto.titulo} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-10 h-10 text-neutrals-grayBorder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Badge de descuento */}
                      {tieneDescuento && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                          -{descuentoPorcentaje}%
                        </span>
                      )}

                      {/* Contador de compartidos */}
                      {producto.veces_compartido > 0 && (
                        <span className="absolute top-2 right-2 bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          {producto.veces_compartido}
                        </span>
                      )}
                    </div>

                    {/* Info y Acciones */}
                    <div className="p-3 flex-1 flex flex-col">
                      {/* Código */}
                      <p className="text-xs text-neutrals-graySoft mb-1">{producto.titulo}</p>
                      
                      {/* Precios */}
                      <div className="mb-3">
                        {tieneDescuento ? (
                          <>
                            <p className="text-xs text-neutrals-graySoft line-through">
                              {formatearCOP(valorSinDescuento)}
                            </p>
                            <p className="font-display text-lg font-bold text-red-500">
                              {formatearCOP(precioFinal)}
                            </p>
                          </>
                        ) : (
                          <p className="font-display text-lg font-bold" style={{ color: '#D4AF37' }}>
                            {formatearCOP(precioFinal)}
                          </p>
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div className="mt-auto space-y-2">
                        {/* Botón WhatsApp - Principal */}
                        <button
                          onClick={() => handleCompartirWhatsApp(producto)}
                          disabled={actionLoading}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-white text-sm font-medium transition-all"
                          style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Compartir
                        </button>

                        {/* Editar y Eliminar */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditarProducto(producto)}
                            disabled={actionLoading}
                            className="flex-1 py-1.5 rounded border border-neutrals-grayBorder text-xs text-neutrals-grayStrong hover:bg-neutrals-grayBg transition-all"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminarProducto(producto)}
                            disabled={actionLoading}
                            className="flex-1 py-1.5 rounded border border-red-200 text-xs text-red-500 hover:bg-red-50 transition-all"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Botón Ver Más */}
            {hayMasProductos && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  {showAll ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Ver todos ({productos.length - ITEMS_PER_PAGE} más)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal Agregar/Editar Producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-premium max-w-lg w-full max-h-[90vh] flex flex-col animate-fade-in-up">
            {/* Header del Modal */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-neutrals-grayBorder bg-white rounded-t-chic flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-neutrals-black">
                    {modoEdicion ? 'Editar Producto' : 'Nuevo Producto'}
                  </h3>
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    ⚡
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutrals-graySoft">
                  {modoEdicion 
                    ? `Editando: ${productoEditando?.titulo}` 
                    : `Código: ${generarTituloConsecutivo()}`}
                </p>
              </div>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }} 
                className="text-neutrals-graySoft hover:text-neutrals-black flex-shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">

                {/* Info de la lista */}
                <div className="bg-neutrals-grayBg rounded-lg p-3 flex justify-between text-sm">
                  <span className="text-neutrals-graySoft">TRM: <strong className="text-neutrals-black">${lista.trm_lista?.toLocaleString('es-CO')}</strong></span>
                  <span className="text-neutrals-graySoft">TAX: <strong className="text-neutrals-black">
                    {lista.tax_modo_lista === 'porcentaje' 
                      ? `${lista.tax_porcentaje_lista}%` 
                      : `$${lista.tax_usd_lista} USD`}
                  </strong></span>
                </div>

                {/* Precio Base */}
                <div>
                  <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                    Precio Base (USD) <span className="text-feedback-error">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-neutrals-grayStrong font-medium text-lg">$</span>
                    <input
                      type="number"
                      name="precio_base_usd"
                      value={formData.precio_base_usd}
                      onChange={handleChange}
                      className={`input-chic flex-1 ${errors.precio_base_usd ? 'border-feedback-error' : ''}`}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  {errors.precio_base_usd && (
                    <p className="text-feedback-error text-sm mt-1">{errors.precio_base_usd}</p>
                  )}
                </div>

                {/* Margen y Descuento */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                      Margen
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="margen_porcentaje"
                        value={formData.margen_porcentaje}
                        onChange={handleChange}
                        className="input-chic flex-1"
                        placeholder="25"
                      />
                      <span className="text-neutrals-grayStrong font-medium">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                      Descuento
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="descuento_porcentaje"
                        value={formData.descuento_porcentaje}
                        onChange={handleChange}
                        className="input-chic flex-1"
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                      <span className="text-neutrals-grayStrong font-medium">%</span>
                    </div>
                  </div>
                </div>

                {/* Resumen de cálculos - Usando Motor de Precios */}
                {calculos && (
                  <div 
                    className="rounded-xl p-4 space-y-2"
                    style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-white/80">Precio + Tax (USD):</span>
                      <span className="text-white font-medium">${calculos.precio_con_tax_usd}</span>
                    </div>
                    
                    {calculos.descuentoPorcentaje > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">- Descuento ({calculos.descuentoPorcentaje}%):</span>
                        <span className="text-yellow-300 font-medium">-${(calculos.precio_con_tax_usd - calculos.costo_total_usd).toFixed(2)} USD</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm border-t border-white/20 pt-2">
                      <span className="text-white/80">Costo final (COP):</span>
                      <span className="text-white font-medium">{formatearCOP(calculos.costo_total_cop)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">+ Margen ({formData.margen_porcentaje}%):</span>
                      <span className="text-white font-medium">{formatearCOP(calculos.precio_sugerido_cop - calculos.costo_total_cop)}</span>
                    </div>
                    
                    {calculos.descuentoPorcentaje > 0 ? (
                      <>
                        <div className="flex justify-between items-center pt-2 border-t border-white/20">
                          <span className="text-white/80">Valor sin descuento:</span>
                          <span className="text-white/60 line-through text-sm">
                            {formatearCOP(calculos.valor_producto_cop)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-white/20 rounded-lg p-2 -mx-1">
                          <span className="text-white font-medium text-sm">
                            🔥 Precio con -{calculos.descuentoPorcentaje}%
                          </span>
                          <span className="font-display text-2xl font-bold text-white">
                            {formatearCOP(calculos.precio_final_cop)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Cliente ahorra:</span>
                          <span className="text-yellow-300 font-bold">
                            {formatearCOP(calculos.descuento_cop)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-white/20">
                          <span className="text-white/80">Tu ganancia:</span>
                          <span className={`font-bold ${calculos.ganancia_cop >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            {formatearCOP(calculos.ganancia_cop)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center bg-white/20 rounded-lg p-2 -mx-1 mt-2">
                          <span className="text-white font-medium">Precio Venta:</span>
                          <span className="font-display text-2xl font-bold text-white">
                            {formatearCOP(calculos.precio_final_cop)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-white/20">
                          <span className="text-white/80">Tu ganancia:</span>
                          <span className="text-green-300 font-bold">
                            {formatearCOP(calculos.ganancia_cop)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Imagen - Se muestra después de calcular precios */}
                {calculos && (
                  <div>
                    <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                      📷 Imagen del Producto <span className="text-feedback-error">*</span>
                    </label>
                    <div className={`border-2 border-dashed rounded-lg p-4 ${errors.imagenes ? 'border-feedback-error' : 'border-neutrals-grayBorder'}`}>
                      {imagenesPreview.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {imagenesPreview.map((url, index) => (
                            <div key={index} className="relative aspect-square">
                              <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-feedback-error text-white rounded-full flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {uploadingImages && (
                        <div className="flex flex-col items-center justify-center py-4">
                          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                          <span className="text-sm text-neutrals-graySoft">Subiendo...</span>
                        </div>
                      )}

                      {!uploadingImages && (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <label 
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                              hasCameraSupport
                                ? 'border-orange-500 bg-orange-50 text-orange-600 cursor-pointer hover:bg-orange-100'
                                : 'border-neutrals-grayBorder bg-neutrals-grayBg text-neutrals-graySoft cursor-not-allowed opacity-60'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium text-sm">Tomar Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={!hasCameraSupport || uploadingImages}
                            />
                          </label>

                          <label className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-neutrals-grayBorder bg-white text-neutrals-grayStrong cursor-pointer hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium text-sm">Subir Imagen</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={uploadingImages}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    {errors.imagenes && (
                      <p className="text-feedback-error text-sm mt-1">{errors.imagenes}</p>
                    )}
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex-1 btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !calculos}
                    className="flex-1 py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                  >
                    {actionLoading ? 'Guardando...' : (modoEdicion ? 'Guardar' : 'Agregar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}