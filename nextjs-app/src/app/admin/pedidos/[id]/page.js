'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
// Servicio de WhatsApp (solo para descargar imágenes)
import { descargarImagenes } from '@/services/whatsappService'

// =====================================================
// CONSTANTES DE ESTADOS (ESPECIFICACIÓN EXACTA)
// =====================================================

// Estados del PEDIDO
const ESTADOS_PEDIDO = {
  solicitado: { label: 'Solicitado', color: 'bg-blue-100 text-blue-800', icon: '📋' },
  en_gestion: { label: 'En Gestión', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: '❌' },
  confirmado: { label: 'Confirmado', color: 'bg-purple-100 text-purple-800', icon: '✅' },
  enviado: { label: 'Enviado', color: 'bg-cyan-100 text-cyan-800', icon: '✈️' },
  entregado: { label: 'Entregado', color: 'bg-green-100 text-green-800', icon: '📦' }
}

// Estados del ITEM (4 estados exactos según especificación)
const ESTADOS_ITEM = {
  solicitado: { label: 'Solicitado', color: 'bg-gray-100 text-gray-800', icon: '📋' },
  encontrado: { label: 'Encontrado', color: 'bg-yellow-100 text-yellow-800', icon: '🔍' },
  confirmado: { label: 'Confirmado', color: 'bg-green-100 text-green-800', icon: '✅' },
  rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: '❌' }
}

// Opciones de sexo/género
const OPCIONES_SEXO = [
  { value: '', label: 'No especificado' },
  { value: 'hombre', label: 'Hombre' },
  { value: 'mujer', label: 'Mujer' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'niños', label: 'Niños' }
]

// Estados manuales del pedido (solo estos se pueden cambiar manualmente)
const ESTADOS_MANUALES_PEDIDO = ['confirmado', 'enviado', 'entregado']

export default function DetallePedidoPage() {
  const router = useRouter()
  const params = useParams()
  const pedidoId = params.id

  const [pedido, setPedido] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Modal editar pedido (fechas/notas/estado manual)
  const [showModalEditar, setShowModalEditar] = useState(false)
  const [editarPedido, setEditarPedido] = useState({
    estado_pedido: '',
    fecha_probable_envio: '',
    fecha_entrega: '',
    notas_internas: ''
  })

  // Modal editar item (talla, sexo, descripción)
  const [showModalEditarItem, setShowModalEditarItem] = useState(false)
  const [itemEditando, setItemEditando] = useState(null)
  const [datosItem, setDatosItem] = useState({
    talla: '',
    genero: '',
    descripcion_detallada: ''
  })

  // Modal para marcar como encontrado (con subida de imagen)
  const [showModalEncontrado, setShowModalEncontrado] = useState(false)
  const [itemParaEncontrar, setItemParaEncontrar] = useState(null)
  const [imagenesEncontrado, setImagenesEncontrado] = useState([])
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const inputFileRef = useRef(null)

  // Modal ver imágenes
  const [showModalImagenes, setShowModalImagenes] = useState(false)
  const [imagenesVer, setImagenesVer] = useState([])

  useEffect(() => {
    if (pedidoId) {
      checkAuth()
      cargarPedido()
      cargarItems()
    }
  }, [pedidoId])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
    }
  }

  const cargarPedido = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          cliente:clientes(*)
        `)
        .eq('id', pedidoId)
        .single()

      if (error) throw error
      setPedido(data)
    } catch (error) {
      console.error('Error cargando pedido:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarItems = async () => {
    try {
      const { data, error } = await supabase
        .from('pedido_items')
        .select(`
          *,
          producto:productos(id, titulo, imagenes, categoria)
        `)
        .eq('pedido_id', pedidoId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error cargando items:', error)
    }
  }

  // =====================================================
  // FUNCIONES DE EDICIÓN DE ITEM
  // =====================================================

  const abrirModalEditarItem = (item) => {
    setItemEditando(item)
    setDatosItem({
      talla: item.talla || '',
      genero: item.genero || '',
      descripcion_detallada: item.descripcion_detallada || ''
    })
    setShowModalEditarItem(true)
  }

  const guardarDatosItem = async () => {
    if (!itemEditando) return
    setActionLoading(true)

    try {
      const { error } = await supabase
        .from('pedido_items')
        .update({
          talla: datosItem.talla.trim() || null,
          genero: datosItem.genero || null,
          descripcion_detallada: datosItem.descripcion_detallada.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemEditando.id)

      if (error) throw error

      await cargarItems()
      setShowModalEditarItem(false)
      setItemEditando(null)
    } catch (error) {
      alert('Error al guardar: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  // =====================================================
  // FUNCIONES PARA ESTADO "ENCONTRADO"
  // =====================================================

  const abrirModalEncontrado = (item) => {
    // Validación: solo se puede pasar a encontrado desde solicitado
    if (item.estado_item !== 'solicitado') {
      alert('Solo se puede marcar como encontrado desde el estado "Solicitado"')
      return
    }
    setItemParaEncontrar(item)
    setImagenesEncontrado([])
    setShowModalEncontrado(true)
  }

  const subirImagenEncontrado = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen')
      return
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar los 5MB')
      return
    }

    setSubiendoImagen(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${pedidoId}/${itemParaEncontrar.id}/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('pedido-items-encontrados')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('pedido-items-encontrados')
        .getPublicUrl(fileName)

      setImagenesEncontrado(prev => [...prev, publicUrl])
    } catch (error) {
      alert('Error al subir imagen: ' + error.message)
    } finally {
      setSubiendoImagen(false)
      if (inputFileRef.current) {
        inputFileRef.current.value = ''
      }
    }
  }

  const eliminarImagenEncontrado = (index) => {
    setImagenesEncontrado(prev => prev.filter((_, i) => i !== index))
  }

  const confirmarEncontrado = async () => {
    // VALIDACIÓN OBLIGATORIA: Al menos 1 imagen
    if (imagenesEncontrado.length === 0) {
      alert('⚠️ Debes subir AL MENOS 1 imagen del producto encontrado')
      return
    }

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('pedido_items')
        .update({
          estado_item: 'encontrado',
          imagenes_encontrado: imagenesEncontrado,
          fecha_estado_cambio: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', itemParaEncontrar.id)

      if (error) throw error

      await cargarItems()
      await cargarPedido() // Recargar pedido para ver cambio de estado automático
      setShowModalEncontrado(false)
      setItemParaEncontrar(null)
      setImagenesEncontrado([])

      // Mostrar opción de enviar WhatsApp
      const enviarWA = window.confirm(
        '✅ Producto marcado como ENCONTRADO.\n\n¿Deseas enviar el mensaje de confirmación por WhatsApp al cliente?'
      )
      if (enviarWA) {
        // Recargar el item actualizado para enviar WhatsApp
        const { data: itemActualizado } = await supabase
          .from('pedido_items')
          .select('*')
          .eq('id', itemParaEncontrar.id)
          .single()
        
        if (itemActualizado) {
          enviarWhatsApp(itemActualizado)
        }
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  // =====================================================
  // GENERAR IMAGEN DE CONFIRMACIÓN CON CANVAS
  // Combina todas las fotos en UNA SOLA imagen + texto
  // =====================================================

  const generarImagenConfirmacionPedido = async (item, imagenesUrls) => {
    // Asegurar que imagenesUrls sea un array
    const urls = Array.isArray(imagenesUrls) ? imagenesUrls : [imagenesUrls]
    
    return new Promise(async (resolve, reject) => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Dimensiones
        const anchoCanvas = 800
        const altoBloque = 380 // Bloque de texto inferior
        
        // Calcular alto de la zona de imágenes según cantidad
        const cantidadImagenes = urls.length
        const altoImagen = cantidadImagenes === 1 ? 500 : 400 // Más bajo si hay 2 para que quepa todo
        const anchoImagen = cantidadImagenes === 1 ? anchoCanvas : anchoCanvas / 2 // Dividir si hay 2
        
        const altoCanvas = altoImagen + altoBloque
        
        canvas.width = anchoCanvas
        canvas.height = altoCanvas
        
        // Cargar todas las imágenes primero
        const cargarImagen = (url) => {
          return new Promise((resolveImg) => {
            const img = new window.Image()
            img.crossOrigin = 'anonymous'
            
            const timeout = setTimeout(() => {
              console.log('Timeout cargando imagen')
              resolveImg(null)
            }, 5000)
            
            img.onload = () => {
              clearTimeout(timeout)
              resolveImg(img)
            }
            
            img.onerror = () => {
              clearTimeout(timeout)
              console.log('Error cargando imagen')
              resolveImg(null)
            }
            
            img.src = url
          })
        }
        
        // Cargar todas las imágenes en paralelo
        const imagenesPromises = urls.map(url => cargarImagen(url))
        const imagenesCargadas = await Promise.all(imagenesPromises)
        
        // Función para dibujar una imagen COMPLETA en una posición (sin recortar)
        const dibujarImagenEnPosicion = (img, x, y, ancho, alto) => {
          // Fondo gris para el área
          ctx.fillStyle = '#F3F4F6'
          ctx.fillRect(x, y, ancho, alto)
          
          if (!img) {
            // Placeholder si no hay imagen
            ctx.fillStyle = '#9CA3AF'
            ctx.font = '80px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('📦', x + ancho / 2, y + alto / 2 + 25)
            ctx.textAlign = 'left'
            return
          }
          
          // Método CONTAIN: mostrar imagen completa sin recortar
          const imgRatio = img.width / img.height
          const areaRatio = ancho / alto
          
          let drawWidth, drawHeight, drawX, drawY
          
          if (imgRatio > areaRatio) {
            // Imagen más ancha que el área - ajustar por ancho
            drawWidth = ancho
            drawHeight = ancho / imgRatio
            drawX = x
            drawY = y + (alto - drawHeight) / 2
          } else {
            // Imagen más alta que el área - ajustar por alto
            drawHeight = alto
            drawWidth = alto * imgRatio
            drawX = x + (ancho - drawWidth) / 2
            drawY = y
          }
          
          // Dibujar imagen completa (sin recorte)
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
        }
        
        // Fondo blanco total
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, anchoCanvas, altoCanvas)
        
        // Fondo gris claro para la zona de imágenes
        ctx.fillStyle = '#F3F4F6'
        ctx.fillRect(0, 0, anchoCanvas, altoImagen)
        
        // Dibujar las imágenes según cantidad
        if (cantidadImagenes === 1) {
          // Una sola imagen centrada
          dibujarImagenEnPosicion(imagenesCargadas[0], 0, 0, anchoCanvas, altoImagen)
        } else {
          // Dos imágenes lado a lado
          dibujarImagenEnPosicion(imagenesCargadas[0], 0, 0, anchoImagen, altoImagen)
          dibujarImagenEnPosicion(imagenesCargadas[1], anchoImagen, 0, anchoImagen, altoImagen)
          
          // Línea divisoria entre imágenes
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(anchoImagen, 0)
          ctx.lineTo(anchoImagen, altoImagen)
          ctx.stroke()
        }
        
        // Badge "ENCONTRADO" en la imagen
        ctx.fillStyle = '#16A34A' // Verde
        ctx.beginPath()
        ctx.roundRect(20, 20, 200, 50, 8)
        ctx.fill()
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 22px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('ENCONTRADO', 120, 52)
        ctx.textAlign = 'left'
        
        // Badge de cantidad de fotos (si hay más de 1)
        if (cantidadImagenes > 1) {
          ctx.fillStyle = '#3B82F6' // Azul
          ctx.beginPath()
          ctx.roundRect(anchoCanvas - 100, 20, 80, 40, 8)
          ctx.fill()
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 18px Arial, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(`${cantidadImagenes} fotos`, anchoCanvas - 60, 47)
          ctx.textAlign = 'left'
        }
        
        // Bloque inferior con gradiente azul
        const gradient = ctx.createLinearGradient(0, altoImagen, 0, altoCanvas)
        gradient.addColorStop(0, '#0f172a')
        gradient.addColorStop(1, '#1e3a8a')
        ctx.fillStyle = gradient
        ctx.fillRect(0, altoImagen, anchoCanvas, altoBloque)
        
        // Contenido del bloque
        const padding = 30
        let yPos = altoImagen + 35
        
        // Encabezado
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 22px Arial, sans-serif'
        ctx.fillText('Chic Import USA', padding, yPos)
        
        // Línea separadora
        yPos += 20
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(padding, yPos)
        ctx.lineTo(anchoCanvas - padding, yPos)
        ctx.stroke()
        
        // Título del producto
        yPos += 35
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 24px Arial, sans-serif'
        const tituloOriginal = item.titulo_articulo || 'Producto'
        const titulo = tituloOriginal.length > 40 
          ? tituloOriginal.substring(0, 40) + '...' 
          : tituloOriginal
        ctx.fillText('Producto: ' + titulo, padding, yPos)
        
        // Información del producto
        yPos += 38
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.font = '20px Arial, sans-serif'
        ctx.fillText('Sexo: ' + (item.genero || 'No especificado'), padding, yPos)
        
        yPos += 30
        ctx.fillText('Talla: ' + (item.talla || 'No especificada'), padding, yPos)
        
        // Detalles (si hay)
        if (item.descripcion_detallada) {
          yPos += 30
          const detalles = item.descripcion_detallada.length > 45 
            ? item.descripcion_detallada.substring(0, 45) + '...' 
            : item.descripcion_detallada
          ctx.fillText('Detalles: ' + detalles, padding, yPos)
        }
        
        // Línea separadora
        yPos += 28
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.beginPath()
        ctx.moveTo(padding, yPos)
        ctx.lineTo(anchoCanvas - padding, yPos)
        ctx.stroke()
        
        // Mensaje de confirmación
        yPos += 32
        ctx.fillStyle = '#FEF08A' // Amarillo
        ctx.font = 'bold 20px Arial, sans-serif'
        ctx.fillText('Por favor confirma respondiendo:', padding, yPos)
        
        yPos += 40
        ctx.fillStyle = '#4ADE80' // Verde claro
        ctx.font = 'bold 26px Arial, sans-serif'
        ctx.fillText('CONFIRMAR', padding, yPos)
        
        ctx.fillStyle = '#F87171' // Rojo claro
        ctx.fillText('RECHAZAR', padding + 260, yPos)
        
        // Footer
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.font = 'italic 18px Arial, sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText('Gracias por confiar en Chic Import USA', anchoCanvas - padding, altoCanvas - 25)
        ctx.textAlign = 'left'
        
        // Convertir a blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('No se pudo generar la imagen'))
          }
        }, 'image/jpeg', 0.92)
        
      } catch (error) {
        console.error('Error generando imagen:', error)
        reject(error)
      }
    })
  }

  // =====================================================
  // ENVÍO DE WHATSAPP (USA SERVICIO CENTRALIZADO)
  // =====================================================

  const enviarWhatsApp = async (item) => {
    if (!pedido?.cliente?.telefono) {
      alert('El cliente no tiene número de teléfono registrado')
      return
    }

    // Verificar que tenga imágenes
    if (!item.imagenes_encontrado || item.imagenes_encontrado.length === 0) {
      alert('No hay imágenes del producto encontrado para compartir')
      return
    }

    // Limpiar número de teléfono (solo dígitos)
    const telefonoLimpio = pedido.cliente.telefono.replace(/\D/g, '')

    setActionLoading(true)
    
    try {
      // Generar UNA SOLA imagen con todas las fotos combinadas + texto
      const imagenBlob = await generarImagenConfirmacionPedido(
        item, 
        item.imagenes_encontrado // Pasar todas las URLs
      )
      
      const nombreArchivo = `confirmacion_${item.titulo_articulo.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
      const file = new File([imagenBlob], nombreArchivo, { type: 'image/jpeg' })
      
      // Intentar compartir con Web Share API
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] })
        
        // Registrar que el mensaje fue enviado
        await supabase
          .from('pedido_items')
          .update({
            whatsapp_enviado: true,
            fecha_whatsapp_enviado: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)

        await cargarItems()
        
        // Abrir WhatsApp con el número del cliente después de compartir
        setTimeout(() => {
          window.open(`https://wa.me/${telefonoLimpio}`, '_blank')
        }, 500)
      } else {
        // Fallback: descargar imagen y abrir WhatsApp
        const url = URL.createObjectURL(imagenBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = nombreArchivo
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        // Registrar que el mensaje fue enviado
        await supabase
          .from('pedido_items')
          .update({
            whatsapp_enviado: true,
            fecha_whatsapp_enviado: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)

        await cargarItems()
        
        // Abrir WhatsApp con el número del cliente
        setTimeout(() => {
          window.open(`https://wa.me/${telefonoLimpio}`, '_blank')
        }, 500)
      }
    } catch (error) {
      console.log('Error compartiendo:', error)
      // Si el usuario cancela, no mostrar error
      if (error.name !== 'AbortError') {
        alert('Error al generar imagen: ' + error.message)
      }
    } finally {
      setActionLoading(false)
    }
  }

  // Función auxiliar para descargar imágenes manualmente (las originales sin canvas)
  const handleDescargarImagenes = async (item) => {
    if (!item.imagenes_encontrado || item.imagenes_encontrado.length === 0) {
      alert('No hay imágenes para descargar')
      return
    }

    setActionLoading(true)
    try {
      await descargarImagenes(
        item.imagenes_encontrado, 
        `${item.titulo_articulo.replace(/[^a-zA-Z0-9]/g, '_')}`
      )
      alert('✅ Imágenes descargadas')
    } catch (error) {
      alert('Error al descargar imágenes: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  // =====================================================
  // CONFIRMAR / RECHAZAR ITEM
  // =====================================================

  const confirmarItem = async (item) => {
    // VALIDACIÓN: Solo se puede confirmar desde estado "encontrado"
    if (item.estado_item !== 'encontrado') {
      alert('⚠️ Solo se puede confirmar un artículo que esté en estado "Encontrado"')
      return
    }

    const confirmar = window.confirm(
      `¿Confirmar el artículo "${item.titulo_articulo}"?\n\nEsto indica que el cliente aceptó el producto.`
    )
    if (!confirmar) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('pedido_items')
        .update({
          estado_item: 'confirmado',
          fecha_estado_cambio: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)

      if (error) throw error

      await cargarItems()
      await cargarPedido()
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const rechazarItem = async (item) => {
    // Se puede rechazar desde "encontrado" (cliente no confirma)
    // También se podría rechazar desde "solicitado" si el producto no se consigue
    if (item.estado_item !== 'encontrado' && item.estado_item !== 'solicitado') {
      alert('Solo se puede rechazar un artículo en estado "Solicitado" o "Encontrado"')
      return
    }

    const confirmar = window.confirm(
      `¿Rechazar el artículo "${item.titulo_articulo}"?\n\n⚠️ El artículo será EXCLUIDO de los totales del pedido.`
    )
    if (!confirmar) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('pedido_items')
        .update({
          estado_item: 'rechazado',
          fecha_estado_cambio: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)

      if (error) throw error

      await cargarItems()
      await cargarPedido() // Los totales se recalculan automáticamente
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  // =====================================================
  // ELIMINAR ITEM
  // =====================================================

  const eliminarItem = async (item) => {
    const confirmar = window.confirm(`¿Eliminar "${item.titulo_articulo}" del pedido?`)
    if (!confirmar) return

    try {
      const { error } = await supabase
        .from('pedido_items')
        .delete()
        .eq('id', item.id)

      if (error) throw error
      await cargarItems()
      await cargarPedido()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  // =====================================================
  // MODAL EDITAR PEDIDO (ESTADO MANUAL, FECHAS, NOTAS)
  // =====================================================

  const abrirModalEditar = () => {
    setEditarPedido({
      estado_pedido: pedido.estado_pedido || 'solicitado',
      fecha_probable_envio: pedido.fecha_probable_envio?.split('T')[0] || '',
      fecha_entrega: pedido.fecha_entrega?.split('T')[0] || '',
      notas_internas: pedido.notas_internas || ''
    })
    setShowModalEditar(true)
  }

  const guardarCambiosPedido = async () => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          estado_pedido: editarPedido.estado_pedido,
          fecha_probable_envio: editarPedido.fecha_probable_envio || null,
          fecha_entrega: editarPedido.fecha_entrega || null,
          notas_internas: editarPedido.notas_internas.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoId)

      if (error) throw error
      await cargarPedido()
      setShowModalEditar(false)
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================

  const formatearCOP = (valor) => {
    if (!valor) return '$0'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor)
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatearFechaHora = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNombreCliente = (cliente) => {
    if (!cliente) return 'Sin cliente'
    const partes = [cliente.nombres, cliente.apellidos].filter(Boolean)
    return partes.length > 0 ? partes.join(' ') : cliente.telefono
  }

  // Calcular si el estado del pedido se puede editar manualmente
  const puedeEditarEstadoPedido = () => {
    // Solo permitir cambio manual a estados manuales cuando hay items confirmados
    const itemsConfirmados = items.filter(i => i.estado_item === 'confirmado').length
    return itemsConfirmados > 0 || ESTADOS_MANUALES_PEDIDO.includes(pedido?.estado_pedido)
  }

  // =====================================================
  // RENDER: ESTADOS DE CARGA
  // =====================================================

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-elegant border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutrals-graySoft">Cargando pedido...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!pedido) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <p className="text-neutrals-graySoft">Pedido no encontrado</p>
          <Link href="/admin/pedidos" className="btn-primary mt-4">
            Volver a Pedidos
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const estadoInfo = ESTADOS_PEDIDO[pedido.estado_pedido] || ESTADOS_PEDIDO.solicitado

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <AdminLayout>
      {/* Header */}
      <header className="bg-white border-b-[3px] border-blue-elegant">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/pedidos"
                className="p-2 hover:bg-neutrals-grayBg rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-neutrals-grayStrong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-2xl font-semibold text-neutrals-black">
                    {pedido.codigo_pedido || `Pedido #${pedido.id.slice(0, 8)}`}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}>
                    {estadoInfo.icon} {estadoInfo.label}
                  </span>
                </div>
                <p className="text-neutrals-graySoft text-sm">
                  Creado el {formatearFecha(pedido.created_at)}
                </p>
              </div>
            </div>

            <button
              onClick={abrirModalEditar}
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar Pedido
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Info del pedido */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tarjeta Cliente */}
            <div className="card-premium p-5">
              <h3 className="font-semibold text-neutrals-black mb-4 flex items-center gap-2">
                <span>👤</span> Cliente
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-elegant to-blue-800 flex items-center justify-center text-white font-semibold">
                  {(pedido.cliente?.nombres?.[0] || pedido.cliente?.telefono?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-neutrals-black">
                    {getNombreCliente(pedido.cliente)}
                  </p>
                  <a 
                    href={`https://wa.me/${pedido.cliente?.telefono?.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-elegant hover:underline flex items-center gap-1"
                  >
                    <span>📱</span> {pedido.cliente?.telefono}
                  </a>
                </div>
              </div>
            </div>

            {/* Tarjeta Fechas */}
            <div className="card-premium p-5">
              <h3 className="font-semibold text-neutrals-black mb-4 flex items-center gap-2">
                <span>📅</span> Fechas
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutrals-graySoft">Solicitud:</span>
                  <span className="font-medium">{formatearFecha(pedido.fecha_solicitud)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutrals-graySoft">Envío aprox:</span>
                  <span className={pedido.fecha_probable_envio ? 'font-medium' : 'text-neutrals-graySoft'}>
                    {formatearFecha(pedido.fecha_probable_envio)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutrals-graySoft">Entrega:</span>
                  <span className={pedido.fecha_entrega ? 'font-medium text-green-600' : 'text-neutrals-graySoft'}>
                    {formatearFecha(pedido.fecha_entrega)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta Totales */}
            <div className="card-premium p-5">
              <h3 className="font-semibold text-neutrals-black mb-4 flex items-center gap-2">
                <span>💰</span> Totales
                <span className="text-xs font-normal text-neutrals-graySoft ml-auto">
                  (excluye rechazados)
                </span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutrals-graySoft">Items:</span>
                  <span className="font-medium">{pedido.total_items || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutrals-graySoft">Costo:</span>
                  <span className="font-medium">{formatearCOP(pedido.total_costo_cop)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutrals-graySoft">Venta:</span>
                  <span className="font-semibold text-lg">{formatearCOP(pedido.total_venta_cop)}</span>
                </div>
                <div className="pt-3 border-t border-neutrals-grayBorder">
                  <div className="flex justify-between">
                    <span className="text-neutrals-graySoft">Ganancia:</span>
                    <span className={`font-bold text-lg ${pedido.total_ganancia_cop >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatearCOP(pedido.total_ganancia_cop)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notas */}
            {pedido.notas_internas && (
              <div className="card-premium p-5">
                <h3 className="font-semibold text-neutrals-black mb-3 flex items-center gap-2">
                  <span>📝</span> Notas
                </h3>
                <p className="text-sm text-neutrals-grayStrong whitespace-pre-wrap">
                  {pedido.notas_internas}
                </p>
              </div>
            )}
          </div>

          {/* Columna Derecha - Items del pedido */}
          <div className="lg:col-span-2">
            <div className="card-premium">
              {/* Header Items */}
              <div className="flex items-center justify-between p-5 border-b border-neutrals-grayBorder">
                <h3 className="font-semibold text-neutrals-black flex items-center gap-2">
                  <span>📦</span> Artículos ({items.length})
                </h3>
                {/* Leyenda de estados */}
                <div className="flex items-center gap-2 text-xs">
                  {Object.entries(ESTADOS_ITEM).map(([key, { label, color }]) => (
                    <span key={key} className={`px-2 py-0.5 rounded ${color}`}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lista de Items */}
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutrals-grayBg rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-neutrals-graySoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-neutrals-graySoft mb-2">No hay artículos en este pedido</p>
                  <p className="text-sm text-neutrals-graySoft">
                    Para agregar artículos, ve a una <strong>Lista de Productos</strong> y usa el botón "Agregar a Pedido"
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutrals-grayBorder">
                  {items.map((item) => {
                    const estadoItem = ESTADOS_ITEM[item.estado_item] || ESTADOS_ITEM.solicitado
                    const esRechazado = item.estado_item === 'rechazado'
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`p-4 transition-colors ${esRechazado ? 'bg-red-50/50 opacity-60' : 'hover:bg-neutrals-grayBg/30'}`}
                      >
                        <div className="flex gap-4">
                          {/* Imagen */}
                          <div className="w-20 h-20 rounded-lg bg-neutrals-grayBg flex-shrink-0 overflow-hidden relative">
                            {item.producto?.imagenes?.[0] ? (
                              <img 
                                src={item.producto.imagenes[0]} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl">📦</span>
                              </div>
                            )}
                            {/* Badge de imágenes encontrado */}
                            {item.imagenes_encontrado?.length > 0 && (
                              <button
                                onClick={() => {
                                  setImagenesVer(item.imagenes_encontrado)
                                  setShowModalImagenes(true)
                                }}
                                className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 text-white rounded-full text-xs flex items-center justify-center shadow-md hover:bg-green-700"
                                title="Ver imágenes del producto encontrado"
                              >
                                📸
                              </button>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className={`font-medium text-neutrals-black line-clamp-1 ${esRechazado ? 'line-through' : ''}`}>
                                  {item.titulo_articulo}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-neutrals-graySoft">
                                  {item.cantidad > 1 && <span>Cant: {item.cantidad}</span>}
                                  {item.talla && <span>📏 {item.talla}</span>}
                                  {item.genero && <span>👤 {item.genero}</span>}
                                </div>
                                {item.descripcion_detallada && (
                                  <p className="text-xs text-neutrals-graySoft mt-1 line-clamp-1">
                                    📝 {item.descripcion_detallada}
                                  </p>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${estadoItem.color}`}>
                                {estadoItem.icon} {estadoItem.label}
                              </span>
                            </div>

                            {/* Precios */}
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className={`text-neutrals-graySoft ${esRechazado ? 'line-through' : ''}`}>
                                Costo: {formatearCOP(item.costo_cop)}
                              </span>
                              <span className={`font-semibold text-neutrals-black ${esRechazado ? 'line-through' : ''}`}>
                                Venta: {formatearCOP(item.precio_venta_cop)}
                              </span>
                              {!esRechazado && item.ganancia_cop > 0 && (
                                <span className="text-green-600 text-xs">
                                  +{formatearCOP(item.ganancia_cop)}
                                </span>
                              )}
                            </div>

                            {/* WhatsApp enviado */}
                            {item.whatsapp_enviado && (
                              <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                <span>✅</span> WhatsApp enviado: {formatearFechaHora(item.fecha_whatsapp_enviado)}
                              </div>
                            )}

                            {/* Acciones según estado */}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              {/* SOLICITADO: Puede editar info, marcar encontrado o rechazar */}
                              {item.estado_item === 'solicitado' && (
                                <>
                                  <button
                                    onClick={() => abrirModalEditarItem(item)}
                                    className="text-xs px-3 py-1.5 rounded-full bg-neutrals-grayBg text-neutrals-grayStrong hover:bg-neutrals-grayBorder transition-colors"
                                  >
                                    ✏️ Editar info
                                  </button>
                                  <button
                                    onClick={() => abrirModalEncontrado(item)}
                                    className="text-xs px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                                  >
                                    🔍 Marcar encontrado
                                  </button>
                                  <button
                                    onClick={() => rechazarItem(item)}
                                    className="text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  >
                                    ❌ Rechazar
                                  </button>
                                </>
                              )}

                              {/* ENCONTRADO: Puede enviar WhatsApp, confirmar o rechazar */}
                              {item.estado_item === 'encontrado' && (
                                <>
                                  <button
                                    onClick={() => abrirModalEditarItem(item)}
                                    className="text-xs px-3 py-1.5 rounded-full bg-neutrals-grayBg text-neutrals-grayStrong hover:bg-neutrals-grayBorder transition-colors"
                                  >
                                    ✏️ Editar info
                                  </button>
                                  <button
                                    onClick={() => enviarWhatsApp(item)}
                                    disabled={actionLoading}
                                    className="text-xs px-3 py-1.5 rounded-full bg-green-100 text-green-800 hover:bg-green-200 transition-colors disabled:opacity-50"
                                  >
                                    📱 Compartir WhatsApp
                                  </button>
                                  {/* Botón para descargar imágenes originales */}
                                  {item.imagenes_encontrado?.length > 0 && (
                                    <button
                                      onClick={() => handleDescargarImagenes(item)}
                                      disabled={actionLoading}
                                      className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                                      title="Descargar imágenes originales"
                                    >
                                      📥 Fotos originales
                                    </button>
                                  )}
                                  <button
                                    onClick={() => confirmarItem(item)}
                                    className="text-xs px-3 py-1.5 rounded-full bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                                  >
                                    ✅ Confirmar
                                  </button>
                                  <button
                                    onClick={() => rechazarItem(item)}
                                    className="text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  >
                                    ❌ Rechazar
                                  </button>
                                </>
                              )}

                              {/* CONFIRMADO: Solo ver info */}
                              {item.estado_item === 'confirmado' && (
                                <span className="text-xs text-green-600 font-medium">
                                  ✅ Cliente confirmó este artículo
                                </span>
                              )}

                              {/* RECHAZADO: Indicar que está excluido */}
                              {item.estado_item === 'rechazado' && (
                                <span className="text-xs text-red-600 font-medium">
                                  ❌ Excluido de totales
                                </span>
                              )}

                              {/* Eliminar (siempre disponible excepto confirmado) */}
                              {item.estado_item !== 'confirmado' && (
                                <button
                                  onClick={() => eliminarItem(item)}
                                  className="text-xs text-red-500 hover:text-red-700 ml-auto"
                                >
                                  🗑️ Eliminar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ====================================================== */}
      {/* MODAL: Editar Pedido */}
      {/* ====================================================== */}
      {showModalEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-premium max-w-md w-full">
            <div className="flex justify-between items-center p-5 border-b border-neutrals-grayBorder">
              <h3 className="font-display text-lg font-semibold">Editar Pedido</h3>
              <button onClick={() => setShowModalEditar(false)}>
                <svg className="w-6 h-6 text-neutrals-graySoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Estado - Solo mostrar estados manuales si aplica */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  Estado del Pedido
                </label>
                {puedeEditarEstadoPedido() ? (
                  <select
                    value={editarPedido.estado_pedido}
                    onChange={(e) => setEditarPedido(prev => ({ ...prev, estado_pedido: e.target.value }))}
                    className="input-chic"
                  >
                    {/* Estados automáticos (solo lectura visual) */}
                    <option value="solicitado">📋 Solicitado (automático)</option>
                    <option value="en_gestion">⏳ En Gestión (automático)</option>
                    <option value="rechazado">❌ Rechazado (automático)</option>
                    {/* Estados manuales */}
                    <option value="confirmado">✅ Confirmado</option>
                    <option value="enviado">✈️ Enviado</option>
                    <option value="entregado">📦 Entregado</option>
                  </select>
                ) : (
                  <div className="input-chic bg-neutrals-grayBg cursor-not-allowed">
                    {estadoInfo.icon} {estadoInfo.label}
                    <span className="text-xs text-neutrals-graySoft ml-2">(automático según artículos)</span>
                  </div>
                )}
                <p className="text-xs text-neutrals-graySoft mt-1">
                  Los estados solicitado, en_gestion y rechazado se actualizan automáticamente según los artículos.
                </p>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                    Fecha Envío Aprox.
                  </label>
                  <input
                    type="date"
                    value={editarPedido.fecha_probable_envio}
                    onChange={(e) => setEditarPedido(prev => ({ ...prev, fecha_probable_envio: e.target.value }))}
                    className="input-chic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                    Fecha Entrega
                  </label>
                  <input
                    type="date"
                    value={editarPedido.fecha_entrega}
                    onChange={(e) => setEditarPedido(prev => ({ ...prev, fecha_entrega: e.target.value }))}
                    className="input-chic"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  Notas Internas
                </label>
                <textarea
                  value={editarPedido.notas_internas}
                  onChange={(e) => setEditarPedido(prev => ({ ...prev, notas_internas: e.target.value }))}
                  rows={3}
                  className="input-chic resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModalEditar(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarCambiosPedido}
                  disabled={actionLoading}
                  className="flex-1 btn-primary"
                >
                  {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* MODAL: Editar Item (talla, sexo, descripción) */}
      {/* ====================================================== */}
      {showModalEditarItem && itemEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-premium max-w-md w-full">
            <div className="flex justify-between items-center p-5 border-b border-neutrals-grayBorder">
              <h3 className="font-display text-lg font-semibold">Editar Artículo</h3>
              <button onClick={() => { setShowModalEditarItem(false); setItemEditando(null); }}>
                <svg className="w-6 h-6 text-neutrals-graySoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Info del producto */}
              <div className="bg-neutrals-grayBg rounded-lg p-3">
                <p className="font-medium text-neutrals-black line-clamp-2">{itemEditando.titulo_articulo}</p>
              </div>

              {/* Talla */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  📏 Talla
                </label>
                <input
                  type="text"
                  value={datosItem.talla}
                  onChange={(e) => setDatosItem(prev => ({ ...prev, talla: e.target.value }))}
                  placeholder="Ej: M, L, XL, 38, 42..."
                  className="input-chic"
                />
              </div>

              {/* Sexo/Género */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  👤 Sexo
                </label>
                <select
                  value={datosItem.genero}
                  onChange={(e) => setDatosItem(prev => ({ ...prev, genero: e.target.value }))}
                  className="input-chic"
                >
                  {OPCIONES_SEXO.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Descripción detallada */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  📝 Descripción detallada
                </label>
                <textarea
                  value={datosItem.descripcion_detallada}
                  onChange={(e) => setDatosItem(prev => ({ ...prev, descripcion_detallada: e.target.value }))}
                  rows={3}
                  placeholder="Color, preferencias, observaciones del cliente..."
                  className="input-chic resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowModalEditarItem(false); setItemEditando(null); }}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarDatosItem}
                  disabled={actionLoading}
                  className="flex-1 btn-primary"
                >
                  {actionLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* MODAL: Marcar como Encontrado (con subida de imagen) */}
      {/* ====================================================== */}
      {showModalEncontrado && itemParaEncontrar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-premium max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutrals-grayBorder bg-yellow-50">
              <div>
                <h3 className="font-display text-lg font-semibold text-yellow-800">🔍 Marcar como Encontrado</h3>
                <p className="text-sm text-yellow-700">Debes subir al menos 1 imagen</p>
              </div>
              <button onClick={() => { setShowModalEncontrado(false); setItemParaEncontrar(null); setImagenesEncontrado([]); }}>
                <svg className="w-6 h-6 text-neutrals-graySoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Info del producto */}
              <div className="bg-neutrals-grayBg rounded-lg p-4">
                <p className="font-medium text-neutrals-black">{itemParaEncontrar.titulo_articulo}</p>
                <div className="flex gap-4 mt-2 text-sm text-neutrals-graySoft">
                  {itemParaEncontrar.talla && <span>📏 {itemParaEncontrar.talla}</span>}
                  {itemParaEncontrar.genero && <span>👤 {itemParaEncontrar.genero}</span>}
                </div>
              </div>

              {/* Subida de imágenes */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-3">
                  📸 Imágenes del producto encontrado
                  <span className="text-red-500 ml-1">*</span>
                </label>

                {/* Imágenes subidas */}
                {imagenesEncontrado.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {imagenesEncontrado.map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-neutrals-grayBorder"
                        />
                        <button
                          onClick={() => eliminarImagenEncontrado(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
                          {index === 0 ? '📷 Principal' : '📷 Adicional'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón subir */}
                <div className="flex flex-col gap-2">
                  <input
                    ref={inputFileRef}
                    type="file"
                    accept="image/*"
                    onChange={subirImagenEncontrado}
                    className="hidden"
                    id="input-imagen-encontrado"
                  />
                  <label
                    htmlFor="input-imagen-encontrado"
                    className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      subiendoImagen 
                        ? 'border-blue-elegant bg-blue-50 cursor-wait' 
                        : 'border-neutrals-grayBorder hover:border-blue-elegant hover:bg-blue-50'
                    }`}
                  >
                    {subiendoImagen ? (
                      <>
                        <div className="w-5 h-5 border-2 border-blue-elegant border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-blue-elegant">Subiendo imagen...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-neutrals-graySoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-neutrals-graySoft">
                          {imagenesEncontrado.length === 0 
                            ? 'Subir imagen obligatoria' 
                            : 'Subir imagen adicional (opcional)'}
                        </span>
                      </>
                    )}
                  </label>
                  <p className="text-xs text-neutrals-graySoft text-center">
                    Formatos: JPG, PNG, GIF, WebP • Máx: 5MB
                  </p>
                </div>
              </div>

              {/* Mensaje de validación */}
              {imagenesEncontrado.length === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <span>⚠️</span>
                    Debes subir AL MENOS 1 imagen del producto encontrado para continuar.
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowModalEncontrado(false); setItemParaEncontrar(null); setImagenesEncontrado([]); }}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEncontrado}
                  disabled={actionLoading || imagenesEncontrado.length === 0}
                  className={`flex-1 ${imagenesEncontrado.length > 0 ? 'btn-primary' : 'bg-gray-300 text-gray-500 cursor-not-allowed rounded-xl px-4 py-3'}`}
                >
                  {actionLoading ? 'Guardando...' : '✅ Confirmar Encontrado'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* MODAL: Ver Imágenes del producto encontrado */}
      {/* ====================================================== */}
      {showModalImagenes && imagenesVer.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => { setShowModalImagenes(false); setImagenesVer([]); }}
        >
          <div 
            className="max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">📸 Imágenes del producto encontrado</h3>
              <button 
                onClick={() => { setShowModalImagenes(false); setImagenesVer([]); }}
                className="text-white hover:text-gray-300"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {imagenesVer.map((url, index) => (
                <img 
                  key={index}
                  src={url} 
                  alt={`Imagen ${index + 1}`}
                  className="w-full rounded-lg"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
