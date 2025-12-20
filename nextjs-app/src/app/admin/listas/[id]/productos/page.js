'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import ModalAgregarAPedido from '@/components/ModalAgregarAPedido'
// Motor Unificado de Cálculo de Precios - ÚNICA fuente de verdad
import { calculatePricing, crearPricingInput, formatearCOP } from '@/lib/pricingEngine'

// Componente Logo reutilizable
const LogoChic = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 80, height: 80 },
    xl: { width: 120, height: 120 }
  }
  
  const { width, height } = sizes[size] || sizes.md
  
  return (
    <Image
      src="/logo.jpg"
      alt="Chic Import USA"
      width={width}
      height={height}
      className={`rounded-full shadow-lg ${className}`}
      priority
    />
  )
}

const CATEGORIAS = [
  { value: 'calzado', label: 'Calzado', icon: '👟' },
  { value: 'ropa', label: 'Ropa', icon: '👕' },
  { value: 'tecnologia', label: 'Tecnología', icon: '📱' },
  { value: 'hogar', label: 'Hogar', icon: '🏠' },
  { value: 'deportes', label: 'Deportes', icon: '⚽' },
  { value: 'belleza', label: 'Belleza', icon: '💄' },
  { value: 'juguetes', label: 'Juguetes', icon: '🧸' },
  { value: 'otros', label: 'Otros', icon: '📦' }
]


// ============================================
// MARCAS - Array independiente (sin relación con categorías)
// ============================================
const MARCAS = [
  // Deportes / Calzado / Ropa
  { value: 'Nike', label: 'Nike', icon: '✓' },
  { value: 'Adidas', label: 'Adidas', icon: '▲' },
  { value: 'Puma', label: 'Puma', icon: '🐆' },
  { value: 'Reebok', label: 'Reebok', icon: '⚡' },
  { value: 'Under Armour', label: 'Under Armour', icon: '💪' },
  { value: 'New Balance', label: 'New Balance', icon: 'NB' },
  { value: 'Converse', label: 'Converse', icon: '⭐' },
  { value: 'Vans', label: 'Vans', icon: '🛹' },
  { value: 'Skechers', label: 'Skechers', icon: 'S' },
  { value: 'Crocs', label: 'Crocs', icon: '🐊' },
  { value: 'Clarks', label: 'Clarks', icon: '👞' },
  { value: 'The North Face', label: 'The North Face', icon: '🏔️' },
  { value: 'Columbia', label: 'Columbia', icon: '🧗' },
  
  // Ropa / Moda
  { value: 'Zara', label: 'Zara', icon: '👗' },
  { value: 'H&M', label: 'H&M', icon: '👕' },
  { value: 'GAP', label: 'GAP', icon: '👔' },
  { value: 'Uniqlo', label: 'Uniqlo', icon: '🧥' },
  { value: "Levi's", label: "Levi's", icon: '👖' },
  { value: 'Tommy Hilfiger', label: 'Tommy Hilfiger', icon: '🎩' },
  { value: 'Calvin Klein', label: 'Calvin Klein', icon: '⚫' },
  { value: 'Ralph Lauren', label: 'Ralph Lauren', icon: '🐴' },
  { value: 'Guess', label: 'Guess', icon: '💎' },
  { value: 'Mango', label: 'Mango', icon: '🥭' },
  { value: 'Forever 21', label: 'Forever 21', icon: '21' },
  { value: 'American Eagle', label: 'American Eagle', icon: '🦅' },
  
  // Tecnología
  { value: 'Apple', label: 'Apple', icon: '🍎' },
  { value: 'Samsung', label: 'Samsung', icon: '📱' },
  { value: 'Sony', label: 'Sony', icon: '🎮' },
  { value: 'HP', label: 'HP', icon: '💻' },
  { value: 'Dell', label: 'Dell', icon: '🖥️' },
  { value: 'Lenovo', label: 'Lenovo', icon: '💼' },
  { value: 'LG', label: 'LG', icon: '📺' },
  { value: 'Microsoft', label: 'Microsoft', icon: '🪟' },
  { value: 'Xiaomi', label: 'Xiaomi', icon: 'Mi' },
  { value: 'Huawei', label: 'Huawei', icon: 'H' },
  { value: 'Motorola', label: 'Motorola', icon: 'M' },
  { value: 'Asus', label: 'Asus', icon: 'A' },
  { value: 'JBL', label: 'JBL', icon: '🔊' },
  { value: 'Bose', label: 'Bose', icon: '🎧' },
  { value: 'Canon', label: 'Canon', icon: '📷' },
  { value: 'GoPro', label: 'GoPro', icon: '🎬' },
  
  // Hogar / Electrodomésticos
  { value: 'Philips', label: 'Philips', icon: '💡' },
  { value: 'Tupperware', label: 'Tupperware', icon: '🥡' },
  { value: 'Pyrex', label: 'Pyrex', icon: '🍽️' },
  { value: 'KitchenAid', label: 'KitchenAid', icon: '🍳' },
  { value: 'Victorinox', label: 'Victorinox', icon: '🔪' },
  { value: 'Oster', label: 'Oster', icon: '☕' },
  { value: 'Hamilton Beach', label: 'Hamilton Beach', icon: 'HB' },
  { value: 'Black & Decker', label: 'Black & Decker', icon: 'BD' },
  { value: 'Cuisinart', label: 'Cuisinart', icon: '🍲' },
  { value: 'OXO', label: 'OXO', icon: 'O' },
  { value: 'Dyson', label: 'Dyson', icon: '🌀' },
  { value: 'iRobot', label: 'iRobot', icon: '🤖' },
  
  // Deportes
  { value: 'Wilson', label: 'Wilson', icon: '🎾' },
  { value: 'Spalding', label: 'Spalding', icon: '🏀' },
  { value: 'Speedo', label: 'Speedo', icon: '🏊' },
  { value: 'Everlast', label: 'Everlast', icon: '🥊' },
  
  // Belleza / Cuidado personal
  { value: "L'Oréal", label: "L'Oréal", icon: '💄' },
  { value: 'Maybelline', label: 'Maybelline', icon: '💋' },
  { value: 'Estée Lauder', label: 'Estée Lauder', icon: '✨' },
  { value: 'Clinique', label: 'Clinique', icon: '🧴' },
  { value: 'MAC', label: 'MAC', icon: '💅' },
  { value: 'NYX', label: 'NYX', icon: '🎨' },
  { value: 'Revlon', label: 'Revlon', icon: 'R' },
  { value: 'CoverGirl', label: 'CoverGirl', icon: 'CG' },
  { value: 'Neutrogena', label: 'Neutrogena', icon: '🧼' },
  { value: 'Cetaphil', label: 'Cetaphil', icon: 'C' },
  { value: 'Dove', label: 'Dove', icon: '🕊️' },
  
  // Juguetes
  { value: 'LEGO', label: 'LEGO', icon: '🧱' },
  { value: 'Mattel', label: 'Mattel', icon: '🎎' },
  { value: 'Hasbro', label: 'Hasbro', icon: '🎲' },
  { value: 'Fisher-Price', label: 'Fisher-Price', icon: '🧸' },
  { value: 'Barbie', label: 'Barbie', icon: '👸' },
  { value: 'Hot Wheels', label: 'Hot Wheels', icon: '🏎️' },
  { value: 'Playmobil', label: 'Playmobil', icon: '🧩' },
  { value: 'Nerf', label: 'Nerf', icon: '🎯' },
  { value: 'Disney', label: 'Disney', icon: '🏰' },
  { value: 'Marvel', label: 'Marvel', icon: '🦸' },
  { value: 'Nintendo', label: 'Nintendo', icon: '🎮' },
  
  // Accesorios / Otros
  { value: 'Michael Kors', label: 'Michael Kors', icon: '👜' },
  { value: 'Coach', label: 'Coach', icon: '💼' },
  { value: 'Fossil', label: 'Fossil', icon: '⌚' },
  { value: 'Casio', label: 'Casio', icon: '🕐' },
  { value: 'Timex', label: 'Timex', icon: '⏰' },
  { value: 'Braun', label: 'Braun', icon: '🪒' },
  { value: 'Oral-B', label: 'Oral-B', icon: '🪥' },
  { value: 'Gillette', label: 'Gillette', icon: '✂️' },
  { value: 'Ray-Ban', label: 'Ray-Ban', icon: '🕶️' },
  
  // Genéricos (siempre al final)
  { value: 'Sin Marca', label: 'Genérico / Sin Marca', icon: '📦' },
  { value: 'Otra marca', label: 'Otra marca', icon: '❓' }
]

const ITEMS_PER_PAGE = 8

export default function ProductosPage() {
  const router = useRouter()
  const params = useParams()
  const idLista = params.id

  const [lista, setLista] = useState(null)
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showTipoProductoModal, setShowTipoProductoModal] = useState(false) // Modal selección tipo
  const [modoEdicion, setModoEdicion] = useState(false)
  const [productoEditando, setProductoEditando] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [calculos, setCalculos] = useState(null)
  const [imagenesPreview, setImagenesPreview] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const [hasCameraSupport, setHasCameraSupport] = useState(false)

  // Estados para filtro y paginación
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [showAll, setShowAll] = useState(false)
  const [totalPorCategoria, setTotalPorCategoria] = useState({})
  const [totalPublicados, setTotalPublicados] = useState(0)

  // Estados para modal de agregar a pedido
  const [showModalPedido, setShowModalPedido] = useState(false)
  const [productoParaPedido, setProductoParaPedido] = useState(null)

  // ============================================
  // ESTADOS PARA PRODUCTO RÁPIDO
  // ============================================
  const [showModalRapido, setShowModalRapido] = useState(false)
  const [consecutivoActual, setConsecutivoActual] = useState(1)
  const [formDataRapido, setFormDataRapido] = useState({
    imagenes: [],
    precio_base_usd: '',
    margen_porcentaje: '25',
    descuento_porcentaje: '0'
  })
  const [errorsRapido, setErrorsRapido] = useState({})
  const [calculosRapido, setCalculosRapido] = useState(null)
  const [imagenesPreviewRapido, setImagenesPreviewRapido] = useState([])
  const [uploadingImagesRapido, setUploadingImagesRapido] = useState(false)
  const [modoEdicionRapido, setModoEdicionRapido] = useState(false)
  const [productoEditandoRapido, setProductoEditandoRapido] = useState(null)

  const [formData, setFormData] = useState({
    titulo: '',
    marca: '',
    categoria: 'calzado',
    descripcion: '',
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
      cargarTotalesPorCategoria()
      cargarUltimoConsecutivo() // Cargar consecutivo para productos rápidos
    }
  }, [lista, categoriaFiltro])

  useEffect(() => {
    if (formData.precio_base_usd && lista) {
      calcularValores()
    }
  }, [formData.precio_base_usd, formData.margen_porcentaje, formData.descuento_porcentaje, lista])

  // useEffect para calcular valores de producto rápido
  useEffect(() => {
    if (formDataRapido.precio_base_usd && lista) {
      calcularValoresRapido()
    }
  }, [formDataRapido.precio_base_usd, formDataRapido.margen_porcentaje, formDataRapido.descuento_porcentaje, lista])

  // Detectar si es dispositivo móvil y si tiene cámara
  useEffect(() => {
    // Detectar dispositivo móvil por user agent y características táctiles
    const checkMobileDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      setIsMobileDevice(isMobile || hasTouchScreen)
    }

    // Verificar si hay soporte de cámara
    const checkCameraSupport = async () => {
      try {
        // Verificar si el navegador soporta mediaDevices
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const hasCamera = devices.some(device => device.kind === 'videoinput')
          setHasCameraSupport(hasCamera)
        } else {
          // Fallback: asumir que móviles tienen cámara
          const userAgent = navigator.userAgent || ''
          const isMobile = /android|iphone|ipad|ipod/i.test(userAgent.toLowerCase())
          setHasCameraSupport(isMobile)
        }
      } catch (error) {
        console.log('No se pudo verificar cámara:', error)
        setHasCameraSupport(false)
      }
    }

    checkMobileDevice()
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
      let query = supabase
        .from('productos')
        .select('*')
        .eq('id_lista', idLista)
        .order('created_at', { ascending: false })

      if (categoriaFiltro !== 'todas') {
        query = query.eq('categoria', categoriaFiltro)
      }

      const { data: productosData, error: productosError } = await query

      if (productosError) throw productosError
      setProductos(productosData || [])
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarTotalesPorCategoria = async () => {
    try {
      const totales = {}
      
      // Contar por categoría
      for (const cat of CATEGORIAS) {
        const { count, error } = await supabase
          .from('productos')
          .select('*', { count: 'exact', head: true })
          .eq('id_lista', idLista)
          .eq('categoria', cat.value)
        
        if (!error) {
          totales[cat.value] = count || 0
        }
      }
      
      setTotalPorCategoria(totales)

      // Contar publicados
      const { count: countPublicados } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('id_lista', idLista)
        .eq('estado', 'publicado')
      
      setTotalPublicados(countPublicados || 0)
    } catch (error) {
      console.error('Error cargando totales:', error)
    }
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
      tiene_descuento: resultado.tiene_descuento
    })
  }

  // ============================================
  // FUNCIONES PARA PRODUCTO RÁPIDO
  // ============================================

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

  const calcularValoresRapido = () => {
    if (!lista || !formDataRapido.precio_base_usd) return

    const pricingInput = crearPricingInput({
      lista,
      precio_base_usd: parseFloat(formDataRapido.precio_base_usd),
      margen_porcentaje: parseFloat(formDataRapido.margen_porcentaje) || 0,
      descuento_porcentaje: parseFloat(formDataRapido.descuento_porcentaje) || 0,
      precio_final_manual_cop: null
    })

    const resultado = calculatePricing(pricingInput)

    if (!resultado.valid) {
      console.error('Error en cálculo de precios:', resultado.error)
      return
    }

    setCalculosRapido({
      precio_con_tax_usd: resultado.precio_con_tax_usd,
      costo_total_usd: resultado.costo_total_usd,
      costo_total_cop: resultado.costo_total_cop,
      precio_sugerido_cop: resultado.precio_sugerido_cop,
      precio_final_cop: resultado.precio_final_cop,
      ganancia_cop: resultado.ganancia_cop,
      valor_producto_cop: resultado.valor_producto_cop,
      descuento_cop: resultado.descuento_cop,
      descuentoPorcentaje: parseFloat(formDataRapido.descuento_porcentaje) || 0,
      tiene_descuento: resultado.tiene_descuento
    })
  }

  const handleChangeRapido = (e) => {
    const { name, value } = e.target
    setFormDataRapido(prev => ({ ...prev, [name]: value }))
    
    if (errorsRapido[name]) {
      setErrorsRapido(prev => ({ ...prev, [name]: null }))
    }
  }

  const validarFormularioRapido = () => {
    const newErrors = {}
    if (!formDataRapido.precio_base_usd || parseFloat(formDataRapido.precio_base_usd) <= 0) {
      newErrors.precio_base_usd = 'El precio base debe ser mayor a 0'
    }
    if (formDataRapido.imagenes.length === 0) {
      newErrors.imagenes = 'Debes agregar al menos una imagen'
    }
    setErrorsRapido(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUploadRapido = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploadingImagesRapido(true)
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

      setFormDataRapido(prev => ({
        ...prev,
        imagenes: [...prev.imagenes, ...nuevasUrls]
      }))
      setImagenesPreviewRapido(prev => [...prev, ...nuevasUrls])
      
      e.target.value = ''
    } catch (error) {
      console.error('Error subiendo imágenes:', error)
      alert('Error al subir imágenes: ' + error.message)
    } finally {
      setUploadingImagesRapido(false)
    }
  }

  const handleRemoveImageRapido = (index) => {
    setFormDataRapido(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index)
    }))
    setImagenesPreviewRapido(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmitRapido = async (e) => {
    e.preventDefault()
    if (!validarFormularioRapido()) return

    if (!calculosRapido || !calculosRapido.precio_final_cop) {
      alert('Error: No se pudieron calcular los precios. Verifica los datos ingresados.')
      return
    }

    setActionLoading(true)
    try {
      const tituloAutomatico = modoEdicionRapido ? productoEditandoRapido.titulo : generarTituloConsecutivo()
      
      const datosProducto = {
        titulo: tituloAutomatico,
        marca: null,
        categoria: 'otros',
        descripcion: null,
        imagenes: formDataRapido.imagenes,
        estado: 'publicado',
        
        precio_base_usd: parseFloat(formDataRapido.precio_base_usd),
        margen_porcentaje: parseFloat(formDataRapido.margen_porcentaje) || null,
        
        costo_total_usd: calculosRapido.costo_total_usd,
        costo_total_cop: calculosRapido.costo_total_cop,
        precio_sugerido_cop: calculosRapido.precio_sugerido_cop,
        precio_final_cop: calculosRapido.precio_final_cop,
        ganancia_cop: calculosRapido.ganancia_cop,
        valor_producto_cop: calculosRapido.valor_producto_cop,
      }

      let error

      if (modoEdicionRapido && productoEditandoRapido) {
        const resultado = await supabase
          .from('productos')
          .update(datosProducto)
          .eq('id', productoEditandoRapido.id)
        
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

      setShowModalRapido(false)
      resetFormRapido()
      cargarProductos()
      cargarTotalesPorCategoria()
    } catch (error) {
      alert(`Error al ${modoEdicionRapido ? 'actualizar' : 'crear'} producto: ` + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const resetFormRapido = () => {
    setFormDataRapido({
      imagenes: [],
      precio_base_usd: '',
      margen_porcentaje: '25',
      descuento_porcentaje: '0'
    })
    setErrorsRapido({})
    setCalculosRapido(null)
    setImagenesPreviewRapido([])
    setModoEdicionRapido(false)
    setProductoEditandoRapido(null)
  }

  // ============================================
  // FIN FUNCIONES PRODUCTO RÁPIDO
  // ============================================


  // handleChange simplificado - ya NO resetea marca al cambiar categoría
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validarFormulario = () => {
    const newErrors = {}
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es requerido'
    }
    if (!formData.precio_base_usd || parseFloat(formData.precio_base_usd) <= 0) {
      newErrors.precio_base_usd = 'El precio base debe ser mayor a 0'
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
        // Obtener extensión del archivo o del tipo MIME
        let fileExt = file.name.split('.').pop()
        
        // Si no hay extensión válida, obtenerla del tipo MIME (común en fotos de cámara)
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
      
      // Limpiar el input para permitir subir la misma imagen de nuevo si es necesario
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
      // TODOS los valores calculados vienen del Motor de Precios (pricingEngine.js)
      const datosProducto = {
        titulo: formData.titulo.trim(),
        marca: formData.marca.trim() || null,
        categoria: formData.categoria,
        descripcion: formData.descripcion.trim() || null,
        imagenes: formData.imagenes.length > 0 ? formData.imagenes : [],
        
        // Inputs del usuario
        precio_base_usd: parseFloat(formData.precio_base_usd),
        margen_porcentaje: parseFloat(formData.margen_porcentaje) || null,
        
        // Valores calculados por el Motor de Precios
        costo_total_usd: calculos.costo_total_usd,
        costo_total_cop: calculos.costo_total_cop,
        precio_sugerido_cop: calculos.precio_sugerido_cop,
        precio_final_cop: calculos.precio_final_cop,
        ganancia_cop: calculos.ganancia_cop,
        valor_producto_cop: calculos.valor_producto_cop,
      }

      let error

      if (modoEdicion && productoEditando) {
        // Actualizar producto existente
        const resultado = await supabase
          .from('productos')
          .update(datosProducto)
          .eq('id', productoEditando.id)
        
        error = resultado.error
      } else {
        // Crear nuevo producto - siempre como publicado
        const resultado = await supabase
          .from('productos')
          .insert([{ ...datosProducto, id_lista: idLista, estado: 'publicado' }])
        
        error = resultado.error
      }

      if (error) throw error

      setShowModal(false)
      resetForm()
      cargarProductos()
      cargarTotalesPorCategoria()
    } catch (error) {
      alert(`Error al ${modoEdicion ? 'actualizar' : 'crear'} producto: ` + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      marca: '',
      categoria: 'calzado',
      descripcion: '',
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

  // Función para abrir modal en modo edición
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
      titulo: producto.titulo || '',
      marca: producto.marca || '',
      categoria: producto.categoria || 'calzado',
      descripcion: producto.descripcion || '',
      imagenes: producto.imagenes || [],
      precio_base_usd: producto.precio_base_usd?.toString() || '',
      margen_porcentaje: producto.margen_porcentaje?.toString() || '25',
      descuento_porcentaje: descuentoCalculado.toString()
    })
    setImagenesPreview(producto.imagenes || [])
    setShowModal(true)
  }

  // Función para eliminar producto
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
      cargarTotalesPorCategoria()
    } catch (error) {
      alert('Error al eliminar: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Función para generar imagen tipo ficha del producto (con soporte para descuentos)
  const generarImagenProducto = async (producto) => {
    // valor_producto_cop = precio SIN descuento
    // precio_final_cop = precio CON descuento
    const precioFinal = producto.precio_final_cop || 0
    const valorSinDescuento = producto.valor_producto_cop || producto.precio_sugerido_cop || precioFinal
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
        const altoImagen = 600
        // Altura del bloque inferior: más alto si hay descripción o descuento
        const altoBloque = tieneDescuento ? 320 : (producto.descripcion ? 280 : 220)
        const altoCanvas = altoImagen + altoBloque
        
        canvas.width = anchoCanvas
        canvas.height = altoCanvas
        
        // Función para dibujar todo el contenido
        const dibujarContenido = (imagenCargada = null) => {
          // Fondo blanco
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, anchoCanvas, altoCanvas)
          
          // Fondo gris claro para la zona de imagen
          ctx.fillStyle = '#F3F4F6'
          ctx.fillRect(0, 0, anchoCanvas, altoImagen)
          
          // Dibujar imagen si está cargada
          if (imagenCargada) {
            // Método CONTAIN: mostrar imagen COMPLETA sin recortar
            const imgRatio = imagenCargada.width / imagenCargada.height
            const canvasRatio = anchoCanvas / altoImagen
            
            let drawWidth, drawHeight, drawX, drawY
            
            if (imgRatio > canvasRatio) {
              // Imagen más ancha que el área - ajustar por ancho
              drawWidth = anchoCanvas
              drawHeight = anchoCanvas / imgRatio
              drawX = 0
              drawY = (altoImagen - drawHeight) / 2
            } else {
              // Imagen más alta que el área - ajustar por alto
              drawHeight = altoImagen
              drawWidth = altoImagen * imgRatio
              drawX = (anchoCanvas - drawWidth) / 2
              drawY = 0
            }
            
            // Dibujar imagen completa (sin recorte)
            ctx.drawImage(imagenCargada, drawX, drawY, drawWidth, drawHeight)
          } else {
            // Placeholder si no hay imagen
            ctx.fillStyle = '#D1D5DB'
            ctx.font = '120px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('📦', anchoCanvas / 2, altoImagen / 2 + 40)
            ctx.textAlign = 'left'
          }
          
          // Badge de descuento en la imagen (si aplica)
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
          
          // Bloque inferior con gradiente azul (estilo productos normales)
          const gradient = ctx.createLinearGradient(0, altoImagen, 0, altoCanvas)
          gradient.addColorStop(0, '#0f172a')
          gradient.addColorStop(1, '#1e3a8a')
          ctx.fillStyle = gradient
          ctx.fillRect(0, altoImagen, anchoCanvas, altoBloque)
          
          // Contenido del bloque
          const padding = 30
          let yPos = altoImagen + 40
          
          // Título del producto
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 28px Arial, sans-serif'
          const titulo = (producto.titulo || 'Producto').length > 40 
            ? producto.titulo.substring(0, 40) + '...' 
            : producto.titulo
          ctx.fillText(titulo, padding, yPos)
          
          // Marca
          if (producto.marca) {
            yPos += 32
            ctx.fillStyle = 'rgba(255,255,255,0.7)'
            ctx.font = '20px Arial, sans-serif'
            ctx.fillText(producto.marca, padding, yPos)
          }
          
          // Descripción
          if (producto.descripcion) {
            yPos += 30
            ctx.fillStyle = 'rgba(255,255,255,0.6)'
            ctx.font = '16px Arial, sans-serif'
            const descripcion = producto.descripcion.length > 60 
              ? producto.descripcion.substring(0, 60) + '...' 
              : producto.descripcion
            ctx.fillText(descripcion, padding, yPos)
          }
          
          // Sección de precios
          yPos += 45
          
          if (tieneDescuento) {
            // Precio tachado
            ctx.fillStyle = 'rgba(255,255,255,0.5)'
            ctx.font = '22px Arial, sans-serif'
            const precioTachado = formatearCOP(valorSinDescuento)
            ctx.fillText(precioTachado, padding, yPos)
            
            // Línea de tachado
            const textWidth = ctx.measureText(precioTachado).width
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(padding, yPos - 8)
            ctx.lineTo(padding + textWidth, yPos - 8)
            ctx.stroke()
            
            // Precio con descuento (grande, dorado)
            yPos += 50
            ctx.fillStyle = '#D4AF37'
            ctx.font = 'bold 48px Arial, sans-serif'
            ctx.fillText(formatearCOP(precioFinal), padding, yPos)
            
            // Texto de ahorro
            yPos += 35
            ctx.fillStyle = '#FEF08A'
            ctx.font = 'bold 18px Arial, sans-serif'
            ctx.fillText(`Ahorras ${formatearCOP(valorSinDescuento - precioFinal)}`, padding, yPos)
          } else {
            // Solo precio (grande, dorado)
            ctx.fillStyle = '#D4AF37'
            ctx.font = 'bold 48px Arial, sans-serif'
            ctx.fillText(formatearCOP(precioFinal), padding, yPos)
          }
          
          // Logo de la tienda (derecha inferior)
          ctx.fillStyle = 'rgba(255,255,255,0.7)'
          ctx.font = 'italic 18px Arial, sans-serif'
          ctx.textAlign = 'right'
          ctx.fillText('Chic Import USA', anchoCanvas - padding, altoCanvas - 25)
          ctx.textAlign = 'left'
          
          // Convertir a blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('No se pudo generar la imagen'))
            }
          }, 'image/jpeg', 0.92)
        }
        
        // Intentar cargar imagen del producto
        if (producto.imagenes?.[0]) {
          const img = new window.Image()
          img.crossOrigin = 'anonymous'
          
          // Timeout para evitar esperas infinitas
          const timeout = setTimeout(() => {
            console.log('Timeout cargando imagen, generando sin ella')
            dibujarContenido(null)
          }, 5000)
          
          img.onload = () => {
            clearTimeout(timeout)
            dibujarContenido(img)
          }
          
          img.onerror = () => {
            clearTimeout(timeout)
            console.log('Error cargando imagen, generando sin ella')
            dibujarContenido(null)
          }
          
          img.src = producto.imagenes[0]
        } else {
          // Sin imagen - generar solo con texto
          dibujarContenido(null)
        }
        
      } catch (error) {
        console.error('Error generando imagen:', error)
        reject(error)
      }
    })
  }

  // Función para compartir producto por WhatsApp - Imagen generada + abrir WhatsApp
  const handleCompartirWhatsApp = async (producto) => {
    try {
      setActionLoading(true)
      
      // Generar imagen tipo ficha
      const imagenBlob = await generarImagenProducto(producto)
      const file = new File([imagenBlob], `${producto.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`, { type: 'image/jpeg' })
      
      // Verificar si el navegador soporta compartir archivos
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file]
        })
      } else {
        // Fallback: descargar imagen y abrir WhatsApp
        const url = URL.createObjectURL(imagenBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${producto.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        // Abrir WhatsApp después de descargar
        const mensaje = encodeURIComponent(
          `🛍️ *${producto.titulo}*\n` +
          (producto.marca ? `Marca: ${producto.marca}\n` : '') +
          `💰 Precio: ${formatearCOP(producto.precio_final_cop)}\n\n` +
          `Chic Import USA 🇺🇸✨`
        )
        
        setTimeout(() => {
          window.open(`https://wa.me/?text=${mensaje}`, '_blank')
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

  // Función para abrir modal de agregar a pedido
  // REGLA: Solo productos publicados de listas publicadas
  const handleAgregarAPedido = (producto) => {
    // Validación previa en UI (el modal también valida)
    if (producto.estado !== 'publicado') {
      alert('Solo se pueden agregar productos publicados a pedidos.')
      return
    }
    if (lista?.estado !== 'publicada') {
      alert('Solo se pueden agregar productos de listas publicadas.')
      return
    }
    setProductoParaPedido(producto)
    setShowModalPedido(true)
  }

  // Callback cuando se agrega exitosamente a un pedido
  const handlePedidoSuccess = (pedidoId, accion) => {
    if (accion === 'pedido_creado') {
      alert('✅ Pedido creado exitosamente')
    } else if (accion === 'item_agregado') {
      alert('✅ Producto agregado al pedido')
    } else if (accion === 'cantidad_incrementada') {
      alert('✅ Cantidad incrementada en el pedido')
    }
  }


  const listaModificable = lista?.estado === 'borrador' || lista?.estado === 'publicada'
  const productosVisibles = showAll ? productos : productos.slice(0, ITEMS_PER_PAGE)
  const hayMasProductos = productos.length > ITEMS_PER_PAGE
  const totalProductos = Object.values(totalPorCategoria).reduce((a, b) => a + b, 0)

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
      {/* Header de Lista - Estilo Minimalista */}
      <header className="bg-white border-b-[3px] border-blue-elegant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Título y Badge */}
            <div className="flex flex-col">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-neutrals-black">
                {lista.titulo}
              </h1>
              <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-md text-xs font-medium w-fit ${
                lista.estado === 'publicada' 
                  ? 'bg-feedback-success/10 text-feedback-success' 
                  : lista.estado === 'cerrada'
                  ? 'bg-neutrals-grayBg text-neutrals-grayStrong'
                  : lista.estado === 'archivada'
                  ? 'bg-feedback-error/10 text-feedback-error'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  {lista.estado === 'publicada' ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  )}
                </svg>
                Lista {lista.estado === 'publicada' ? 'Publicada' : lista.estado}
              </span>
            </div>

            {/* Separador vertical (solo desktop) */}
            <div className="hidden lg:block w-px h-14 bg-neutrals-grayBorder" />

            {/* Stats en línea */}
            <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto pb-2 lg:pb-0">
              <div className="text-center min-w-fit">
                <p className="font-display text-2xl font-bold" style={{ color: '#D4AF37' }}>
                  ${lista.trm_lista?.toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-neutrals-graySoft uppercase tracking-wide">TRM</p>
              </div>
              <div className="text-center min-w-fit">
                <p className="font-display text-2xl font-bold" style={{ color: '#D4AF37' }}>
                  {lista.tax_modo_lista === 'porcentaje' 
                    ? `${lista.tax_porcentaje_lista}%` 
                    : `$${lista.tax_usd_lista}`}
                </p>
                <p className="text-xs text-neutrals-graySoft uppercase tracking-wide">TAX</p>
              </div>
              <div className="text-center min-w-fit">
                <p className="font-display text-2xl font-bold text-blue-elegant">
                  {totalProductos}
                </p>
                <p className="text-xs text-neutrals-graySoft uppercase tracking-wide">Productos</p>
              </div>
              <div className="text-center min-w-fit">
                <p className="font-display text-2xl font-bold text-feedback-success">
                  {totalPublicados}
                </p>
                <p className="text-xs text-neutrals-graySoft uppercase tracking-wide">Publicados</p>
              </div>
            </div>
          </div>

            {/* Botón Agregar Producto */}
            {listaModificable && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTipoProductoModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Agregar Producto</span>
                </button>
              </div>
            )}

          {/* Alerta si lista no modificable */}
          {!listaModificable && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Esta lista está <strong className="mx-1">{lista.estado}</strong> y no se pueden modificar productos.
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Filtros por Categoría */}
      <div className="bg-white border-b border-neutrals-grayBorder sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-3 overflow-x-auto">
            {/* Opción Todas */}
            <button
              onClick={() => {
                setCategoriaFiltro('todas')
                setShowAll(false)
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                categoriaFiltro === 'todas'
                  ? 'bg-blue-elegant text-white shadow-md'
                  : 'bg-neutrals-grayBg text-neutrals-grayStrong hover:bg-neutrals-grayBorder'
              }`}
            >
              <span>📋</span>
              <span>Todas</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                categoriaFiltro === 'todas'
                  ? 'bg-white/20 text-white'
                  : 'bg-white text-neutrals-graySoft'
              }`}>
                {totalProductos}
              </span>
            </button>

            {CATEGORIAS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setCategoriaFiltro(cat.value)
                  setShowAll(false)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  categoriaFiltro === cat.value
                    ? 'bg-blue-elegant text-white shadow-md'
                    : 'bg-neutrals-grayBg text-neutrals-grayStrong hover:bg-neutrals-grayBorder'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {totalPorCategoria[cat.value] > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    categoriaFiltro === cat.value
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-neutrals-graySoft'
                  }`}>
                    {totalPorCategoria[cat.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Productos */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-blue-elegant border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutrals-graySoft">Cargando productos...</p>
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-16">
            <div className="card-premium p-12 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl" style={{ backgroundColor: '#dbeafe' }}>
                {categoriaFiltro === 'todas' ? '📦' : CATEGORIAS.find(c => c.value === categoriaFiltro)?.icon || '📦'}
              </div>
              <h3 className="font-display text-xl text-neutrals-black mb-2">
                {categoriaFiltro === 'todas' 
                  ? 'No hay productos' 
                  : `No hay productos en ${CATEGORIAS.find(c => c.value === categoriaFiltro)?.label}`}
              </h3>
              <p className="text-neutrals-graySoft mb-6">
                {categoriaFiltro === 'todas'
                  ? 'Agrega el primer producto a esta lista.'
                  : `No tienes productos en la categoría "${CATEGORIAS.find(c => c.value === categoriaFiltro)?.label}".`}
              </p>
              {listaModificable && (
                <button
                  onClick={() => setShowTipoProductoModal(true)}
                  className="btn-primary"
                >
                  Agregar Producto
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productosVisibles.map((producto, index) => {
                const categoriaInfo = CATEGORIAS.find(c => c.value === producto.categoria)

                return (
                  <article 
                    key={producto.id} 
                    className="card-premium overflow-hidden stagger-item flex flex-col"
                    style={{ animationDelay: `${index * 0.05}s` }}
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
                          <svg className="w-12 h-12 text-neutrals-grayBorder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {categoriaInfo && (
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium">
                          {categoriaInfo.icon} {categoriaInfo.label}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-display text-lg font-semibold text-neutrals-black line-clamp-2">
                        {producto.titulo}
                      </h3>
                      {producto.marca && (
                        <p className="text-sm text-neutrals-graySoft">{producto.marca}</p>
                      )}
                      {producto.descripcion && (
                        <p className="text-xs text-neutrals-graySoft mt-1 line-clamp-2">
                          {producto.descripcion}
                        </p>
                      )}

                      {/* Info de costos en línea */}
                      <div className="mt-3 text-xs text-neutrals-graySoft flex gap-3">
                        <span>Base: ${producto.precio_base_usd} USD</span>
                        <span>•</span>
                        <span>Costo: {formatearCOP(producto.costo_total_cop || 0)}</span>
                      </div>

                      {/* Precio y Ganancia - Estilo Action Item */}
                      <div className="mt-3 space-y-2">
                        {/* Precio */}
                        <div className="action-item compact">
                          <div 
                            className="action-icon"
                            style={{
                              background: 'linear-gradient(135deg, #D4AF37, #f4d03f)',
                            }}
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="action-text">
                            <span className="text-xs text-neutrals-graySoft">Precio venta</span>
                            <span className="font-display text-lg font-bold" style={{ color: '#D4AF37' }}>
                              {formatearCOP(producto.precio_final_cop || 0)}
                            </span>
                          </div>
                        </div>

                        {/* Ganancia */}
                        <div className="action-item compact">
                          <div className="action-icon success">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <div className="action-text">
                            <span className="text-xs text-neutrals-graySoft">Ganancia ({producto.margen_porcentaje}%)</span>
                            <span className="font-display text-lg font-bold text-feedback-success">
                              {formatearCOP(producto.ganancia_cop || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-neutrals-grayBorder">
                        <button
                          onClick={() => handleEditarProducto(producto)}
                          disabled={actionLoading}
                          className="flex-1 action-item compact group justify-center"
                        >
                          <div className="action-icon" style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #1e40af, #1e3a8a)' }}>
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium">Editar</span>
                        </button>
                        <button
                          onClick={() => handleEliminarProducto(producto)}
                          disabled={actionLoading}
                          className="flex-1 action-item compact group justify-center"
                        >
                          <div className="action-icon" style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium">Eliminar</span>
                        </button>
                        <button
                          onClick={() => handleCompartirWhatsApp(producto)}
                          disabled={actionLoading}
                          className="flex-1 action-item compact group justify-center"
                          style={{ 
                            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                            border: 'none'
                          }}
                        >
                          <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-white">Compartir</span>
                        </button>
                        
                        {/* Botón Agregar a Pedido - Solo si producto publicado Y lista publicada */}
                        {producto.estado === 'publicado' && lista?.estado === 'publicada' && (
                          <button
                            onClick={() => handleAgregarAPedido(producto)}
                            disabled={actionLoading}
                            className="flex-1 action-item compact group justify-center"
                            style={{ 
                              background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                              border: 'none'
                            }}
                          >
                            <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-white">Pedido</span>
                          </button>
                        )}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card-premium max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col animate-fade-in-up">
            {/* Header del Modal - Fijo */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-neutrals-grayBorder bg-white rounded-t-chic flex-shrink-0">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-semibold text-neutrals-black">
                  {modoEdicion ? 'Editar Producto' : 'Agregar Producto'}
                </h3>
                <p className="text-xs sm:text-sm text-neutrals-graySoft">Lista: {lista.titulo}</p>
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

            {/* Contenido del Modal - Con Scroll */}
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna Izquierda */}
                <div className="space-y-5">
                  <h4 className="font-display text-lg font-semibold text-neutrals-black">
                    Información del Producto
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                      Título <span className="text-feedback-error">*</span>
                    </label>
                    <input
                      type="text"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleChange}
                      className={`input-chic ${errors.titulo ? 'border-feedback-error' : ''}`}
                      placeholder="Ej: iPhone 15 Pro Max 256GB"
                    />
                    {errors.titulo && (
                      <p className="text-feedback-error text-sm mt-1">{errors.titulo}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Primero: Categoría */}
                    <div>
                      <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                        Categoría
                      </label>
                      <select
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleChange}
                        className="input-chic"
                      >
                        {CATEGORIAS.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    
                    {/* Marca - Ahora usa el array MARCAS directamente */}
                    <div>
                      <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                        Marca
                      </label>
                      <select
                        name="marca"
                        value={formData.marca}
                        onChange={handleChange}
                        className="input-chic"
                      >
                        <option value="">Selecciona una marca</option>
                        {MARCAS.map(marca => (
                          <option key={marca.value} value={marca.value}>
                            {marca.icon} {marca.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                      Descripción
                    </label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      rows={3}
                      className="input-chic resize-none"
                      placeholder="Descripción opcional del producto"
                    />
                  </div>
                </div>

                {/* Columna Derecha - Precios */}
                <div className="space-y-5">
                  <h4 className="font-display text-lg font-semibold text-neutrals-black">
                    Precios y Cálculos
                  </h4>

                  {/* Info de la lista */}
                  <div className="bg-neutrals-grayBg rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutrals-graySoft">TRM de la lista:</span>
                      <span className="font-semibold">${lista.trm_lista?.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutrals-graySoft">TAX:</span>
                      <span className="font-semibold">
                        {lista.tax_modo_lista === 'porcentaje' 
                          ? `${lista.tax_porcentaje_lista}%` 
                          : `$${lista.tax_usd_lista} USD`}
                      </span>
                    </div>
                  </div>

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
                        Margen de Ganancia
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
                      className="rounded-xl p-5 space-y-3"
                      style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                      }}
                    >
                      <h5 className="font-semibold text-white text-sm mb-4">Resumen</h5>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Precio + Tax (USD):</span>
                        <span className="text-white font-medium">${calculos.precio_con_tax_usd}</span>
                      </div>
                      
                      {calculos.descuentoPorcentaje > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">- Descuento ({calculos.descuentoPorcentaje}%):</span>
                          <span className="text-yellow-300 font-medium">-${(calculos.precio_con_tax_usd - calculos.costo_total_usd).toFixed(2)} USD</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm border-t border-white/10 pt-2 mt-2">
                        <span className="text-white/70">Costo final (COP):</span>
                        <span className="text-white font-medium">{formatearCOP(calculos.costo_total_cop)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">+ Margen ({formData.margen_porcentaje}%):</span>
                        <span className="text-white font-medium">{formatearCOP(calculos.precio_sugerido_cop - calculos.costo_total_cop)}</span>
                      </div>
                      
                      {calculos.descuentoPorcentaje > 0 ? (
                        <>
                          <div className="flex justify-between items-center pt-2 border-t border-white/20">
                            <span className="text-white/70">Valor sin descuento:</span>
                            <span className="text-white/60 line-through text-sm">
                              {formatearCOP(calculos.valor_producto_cop)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-white/20 rounded-lg p-2 -mx-1">
                            <span className="text-white font-medium text-sm">
                              🔥 Precio con -{calculos.descuentoPorcentaje}%
                            </span>
                            <span 
                              className="font-display text-2xl font-bold"
                              style={{
                                background: 'linear-gradient(135deg, #D4AF37, #f4d03f)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}
                            >
                              {formatearCOP(calculos.precio_final_cop)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/70">Cliente ahorra:</span>
                            <span className="text-yellow-300 font-bold">
                              {formatearCOP(calculos.descuento_cop)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-white/20">
                            <span className="text-white/70">Tu ganancia:</span>
                            <span className={`font-display text-xl font-bold ${calculos.ganancia_cop >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatearCOP(calculos.ganancia_cop)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="border-t border-white/20 pt-3 mt-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white/70">Precio final:</span>
                              <span 
                                className="font-display text-2xl font-bold"
                                style={{
                                  background: 'linear-gradient(135deg, #D4AF37, #f4d03f)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                }}
                              >
                                {formatearCOP(calculos.precio_final_cop)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/70">Ganancia:</span>
                              <span className="font-display text-xl font-bold text-green-400">
                                {formatearCOP(calculos.ganancia_cop)}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Imagen - Se muestra después de calcular precios */}
                  {calculos && (
                    <div>
                      <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                        📷 Imágenes del Producto
                      </label>
                      <div className="border-2 border-dashed border-neutrals-grayBorder rounded-lg p-4">
                        {/* Preview de imágenes */}
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

                        {/* Spinner de carga */}
                        {uploadingImages && (
                          <div className="flex flex-col items-center justify-center py-4">
                            <div className="w-8 h-8 border-2 border-blue-elegant border-t-transparent rounded-full animate-spin mb-2"></div>
                            <span className="text-sm text-neutrals-graySoft">Subiendo imagen...</span>
                          </div>
                        )}

                        {/* Botones de acción */}
                        {!uploadingImages && (
                          <div className="flex flex-col sm:flex-row gap-3">
                            {/* Botón Tomar Foto */}
                            <label 
                              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                                hasCameraSupport
                                  ? 'border-blue-elegant bg-blue-elegant/5 text-blue-elegant cursor-pointer hover:bg-blue-elegant hover:text-white'
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

                            {/* Botón Subir Imagen */}
                            <label className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-neutrals-grayBorder bg-white text-neutrals-grayStrong cursor-pointer hover:border-blue-elegant hover:bg-blue-elegant/5 hover:text-blue-elegant transition-all">
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

                        {/* Texto de ayuda */}
                        <p className="text-xs text-neutrals-graySoft text-center mt-3">
                          {hasCameraSupport 
                            ? 'Toma una foto o selecciona imágenes de tu dispositivo'
                            : 'Selecciona imágenes de tu dispositivo'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-neutrals-grayBorder">
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
                  className="flex-1 btn-primary"
                >
                  {actionLoading ? 'Guardando...' : (modoEdicion ? 'Guardar Cambios' : 'Agregar Producto')}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar a Pedido */}
      <ModalAgregarAPedido
        isOpen={showModalPedido}
        onClose={() => {
          setShowModalPedido(false)
          setProductoParaPedido(null)
        }}
        producto={productoParaPedido}
        lista={lista}
        onSuccess={handlePedidoSuccess}
      />

      {/* Modal Selección Tipo de Producto */}
      {showTipoProductoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full animate-fade-in-up shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-neutrals-grayBorder">
              <div>
                <h3 className="font-display text-xl font-semibold text-neutrals-black">
                  Agregar Producto
                </h3>
                <p className="text-sm text-neutrals-graySoft mt-1">
                  {lista?.titulo}
                </p>
              </div>
              <button 
                onClick={() => setShowTipoProductoModal(false)}
                className="text-neutrals-graySoft hover:text-neutrals-black"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-neutrals-grayStrong text-center mb-4">
                Selecciona el tipo de producto a agregar:
              </p>

              {/* Opción Producto Normal */}
              <button
                onClick={() => {
                  setShowTipoProductoModal(false)
                  resetForm()
                  setShowModal(true)
                }}
                className="block w-full p-4 rounded-xl border-2 border-neutrals-grayBorder hover:border-blue-elegant hover:bg-blue-elegant/5 transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #1e40af, #1e3a8a)' }}
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-display text-lg font-semibold text-neutrals-black group-hover:text-blue-elegant">
                      Producto Completo
                    </h4>
                    <p className="text-sm text-neutrals-graySoft">
                      Con título, descripción y detalles
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-neutrals-graySoft group-hover:translate-x-1 group-hover:text-blue-elegant transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Opción Producto Rápido */}
              <button
                onClick={() => {
                  setShowTipoProductoModal(false)
                  resetFormRapido()
                  setShowModalRapido(true)
                }}
                className="block w-full p-4 rounded-xl border-2 border-neutrals-grayBorder hover:border-orange-500 hover:bg-orange-50 transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-lg font-semibold text-neutrals-black group-hover:text-orange-600">
                        Producto Rápido
                      </h4>
                      <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        ⚡ NUEVO
                      </span>
                    </div>
                    <p className="text-sm text-neutrals-graySoft">
                      Solo imagen, precio y descuento
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-neutrals-graySoft group-hover:translate-x-1 group-hover:text-orange-500 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Info adicional */}
              <div className="bg-neutrals-grayBg rounded-lg p-4 mt-4">
                <h5 className="font-semibold text-sm text-neutrals-black mb-2">Diferencias:</h5>
                <div className="space-y-2 text-xs text-neutrals-grayStrong">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-elegant">●</span>
                    <span><strong>Completo:</strong> Nombre, descripción, marca, imagen editada para WhatsApp</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500">●</span>
                    <span><strong>Rápido:</strong> Código automático, imagen original, descuentos, solo precios en WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Producto Rápido */}
      {showModalRapido && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-premium max-w-lg w-full max-h-[90vh] flex flex-col animate-fade-in-up">
            {/* Header del Modal */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-neutrals-grayBorder bg-white rounded-t-chic flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-neutrals-black">
                    {modoEdicionRapido ? 'Editar Producto' : 'Nuevo Producto'}
                  </h3>
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    ⚡
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutrals-graySoft">
                  {modoEdicionRapido 
                    ? `Editando: ${productoEditandoRapido?.titulo}` 
                    : `Código: ${generarTituloConsecutivo()}`}
                </p>
              </div>
              <button 
                onClick={() => { setShowModalRapido(false); resetFormRapido(); }} 
                className="text-neutrals-graySoft hover:text-neutrals-black flex-shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleSubmitRapido} className="p-4 sm:p-6 space-y-5">

                {/* Info de la lista */}
                <div className="bg-neutrals-grayBg rounded-lg p-3 flex justify-between text-sm">
                  <span className="text-neutrals-graySoft">TRM: <strong className="text-neutrals-black">${lista?.trm_lista?.toLocaleString('es-CO')}</strong></span>
                  <span className="text-neutrals-graySoft">TAX: <strong className="text-neutrals-black">
                    {lista?.tax_modo_lista === 'porcentaje' 
                      ? `${lista?.tax_porcentaje_lista}%` 
                      : `$${lista?.tax_usd_lista} USD`}
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
                      value={formDataRapido.precio_base_usd}
                      onChange={handleChangeRapido}
                      className={`input-chic flex-1 ${errorsRapido.precio_base_usd ? 'border-feedback-error' : ''}`}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  {errorsRapido.precio_base_usd && (
                    <p className="text-feedback-error text-sm mt-1">{errorsRapido.precio_base_usd}</p>
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
                        value={formDataRapido.margen_porcentaje}
                        onChange={handleChangeRapido}
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
                        value={formDataRapido.descuento_porcentaje}
                        onChange={handleChangeRapido}
                        className="input-chic flex-1"
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                      <span className="text-neutrals-grayStrong font-medium">%</span>
                    </div>
                  </div>
                </div>

                {/* Resumen de cálculos */}
                {calculosRapido && (
                  <div 
                    className="rounded-xl p-4 space-y-2"
                    style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-white/80">Precio + Tax (USD):</span>
                      <span className="text-white font-medium">${calculosRapido.precio_con_tax_usd}</span>
                    </div>
                    
                    {calculosRapido.descuentoPorcentaje > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">- Descuento ({calculosRapido.descuentoPorcentaje}%):</span>
                        <span className="text-yellow-300 font-medium">-${(calculosRapido.precio_con_tax_usd - calculosRapido.costo_total_usd).toFixed(2)} USD</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm border-t border-white/20 pt-2">
                      <span className="text-white/80">Costo final (COP):</span>
                      <span className="text-white font-medium">{formatearCOP(calculosRapido.costo_total_cop)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">+ Margen ({formDataRapido.margen_porcentaje}%):</span>
                      <span className="text-white font-medium">{formatearCOP(calculosRapido.precio_sugerido_cop - calculosRapido.costo_total_cop)}</span>
                    </div>
                    
                    {calculosRapido.descuentoPorcentaje > 0 ? (
                      <>
                        <div className="flex justify-between items-center pt-2 border-t border-white/20">
                          <span className="text-white/80">Valor sin descuento:</span>
                          <span className="text-white/60 line-through text-sm">
                            {formatearCOP(calculosRapido.valor_producto_cop)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-white/20 rounded-lg p-2 -mx-1">
                          <span className="text-white font-medium text-sm">
                            🔥 Precio con -{calculosRapido.descuentoPorcentaje}%
                          </span>
                          <span className="font-display text-2xl font-bold text-white">
                            {formatearCOP(calculosRapido.precio_final_cop)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Cliente ahorra:</span>
                          <span className="text-yellow-300 font-bold">
                            {formatearCOP(calculosRapido.descuento_cop)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-white/20">
                          <span className="text-white/80">Tu ganancia:</span>
                          <span className={`font-bold ${calculosRapido.ganancia_cop >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            {formatearCOP(calculosRapido.ganancia_cop)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center bg-white/20 rounded-lg p-2 -mx-1 mt-2">
                          <span className="text-white font-medium">Precio Venta:</span>
                          <span className="font-display text-2xl font-bold text-white">
                            {formatearCOP(calculosRapido.precio_final_cop)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-white/20">
                          <span className="text-white/80">Tu ganancia:</span>
                          <span className="text-green-300 font-bold">
                            {formatearCOP(calculosRapido.ganancia_cop)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Imagen - Se muestra después de calcular precios */}
                {calculosRapido && (
                  <div>
                    <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                      📷 Imagen del Producto <span className="text-feedback-error">*</span>
                    </label>
                    <div className={`border-2 border-dashed rounded-lg p-4 ${errorsRapido.imagenes ? 'border-feedback-error' : 'border-neutrals-grayBorder'}`}>
                      {imagenesPreviewRapido.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {imagenesPreviewRapido.map((url, index) => (
                            <div key={index} className="relative aspect-square">
                              <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={() => handleRemoveImageRapido(index)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-feedback-error text-white rounded-full flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {uploadingImagesRapido && (
                        <div className="flex flex-col items-center justify-center py-4">
                          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                          <span className="text-sm text-neutrals-graySoft">Subiendo...</span>
                        </div>
                      )}

                      {!uploadingImagesRapido && (
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
                              onChange={handleImageUploadRapido}
                              className="hidden"
                              disabled={!hasCameraSupport || uploadingImagesRapido}
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
                              onChange={handleImageUploadRapido}
                              className="hidden"
                              disabled={uploadingImagesRapido}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    {errorsRapido.imagenes && (
                      <p className="text-feedback-error text-sm mt-1">{errorsRapido.imagenes}</p>
                    )}
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModalRapido(false); resetFormRapido(); }}
                    className="flex-1 btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !calculosRapido}
                    className="flex-1 py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                  >
                    {actionLoading ? 'Guardando...' : (modoEdicionRapido ? 'Guardar' : 'Agregar')}
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