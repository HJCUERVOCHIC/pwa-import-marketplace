/**
 * Servicio de Catálogo Público
 * Maneja queries para usuarios no autenticados
 */

import { supabase } from './supabaseClient'

/**
 * ============================================
 * FUNCIONES PARA LISTAS PÚBLICAS
 * ============================================
 */

/**
 * Obtiene todas las listas publicadas y cerradas
 * Ordenadas por estado (publicada primero) y fecha
 */
export async function getListasPublicas() {
  try {
    const { data, error } = await supabase
      .from('listas_oferta')
      .select(`
        id,
        titulo,
        descripcion,
        fecha_oferta,
        estado,
        created_at
      `)
      .in('estado', ['publicada', 'cerrada'])
      .order('estado', { ascending: false }) // publicada antes que cerrada
      .order('fecha_oferta', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error obteniendo listas públicas:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Obtiene una lista específica por ID con conteo de productos
 */
export async function getListaPublicaById(idLista) {
  try {
    // Obtener la lista
    const { data: lista, error: listaError } = await supabase
      .from('listas_oferta')
      .select(`
        id,
        titulo,
        descripcion,
        fecha_oferta,
        estado,
        created_at
      `)
      .eq('id', idLista)
      .in('estado', ['publicada', 'cerrada'])
      .single()

    if (listaError) throw listaError

    // Contar productos publicados
    const { count, error: countError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true })
      .eq('id_lista', idLista)
      .eq('estado', 'publicado')

    if (countError) throw countError

    return { 
      data: {
        ...lista,
        productos_count: count
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error obteniendo lista pública:', error)
    return { data: null, error: error.message }
  }
}

/**
 * ============================================
 * FUNCIONES PARA PRODUCTOS PÚBLICOS
 * ============================================
 */

/**
 * Obtiene productos publicados de una lista
 * Solo muestra datos públicos (sin costos ni ganancias)
 */
export async function getProductosPublicos(idLista) {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        id,
        titulo,
        marca,
        descripcion,
        imagenes,
        precio_final_cop,
        estado,
        created_at
      `)
      .eq('id_lista', idLista)
      .eq('estado', 'publicado')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error obteniendo productos públicos:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Obtiene un producto específico por ID
 * Solo muestra datos públicos
 */
export async function getProductoPublicoById(idProducto) {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        id,
        id_lista,
        titulo,
        marca,
        descripcion,
        imagenes,
        precio_final_cop,
        estado,
        created_at,
        lista:listas_oferta!productos_id_lista_fkey(
          id,
          titulo,
          estado
        )
      `)
      .eq('id', idProducto)
      .eq('estado', 'publicado')
      .single()

    if (error) throw error

    // Verificar que la lista también esté pública
    if (!data.lista || !['publicada', 'cerrada'].includes(data.lista.estado)) {
      return { data: null, error: 'Producto no disponible' }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error obteniendo producto público:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Busca productos por texto en título, marca o descripción
 */
export async function buscarProductosPublicos(query) {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        id,
        id_lista,
        titulo,
        marca,
        descripcion,
        imagenes,
        precio_final_cop,
        estado,
        lista:listas_oferta!productos_id_lista_fkey(
          id,
          titulo,
          estado
        )
      `)
      .eq('estado', 'publicado')
      .or(`titulo.ilike.%${query}%,marca.ilike.%${query}%,descripcion.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // Filtrar solo productos de listas públicas
    const productosFiltrados = data.filter(p => 
      p.lista && ['publicada', 'cerrada'].includes(p.lista.estado)
    )

    return { data: productosFiltrados, error: null }
  } catch (error) {
    console.error('Error buscando productos:', error)
    return { data: null, error: error.message }
  }
}

/**
 * ============================================
 * HELPERS
 * ============================================
 */

/**
 * Formatea precio COP para mostrar
 */
export function formatearPrecioCOP(precio) {
  if (!precio) return '$0'
  return `$${Number(precio).toLocaleString('es-CO')}`
}

/**
 * Formatea fecha para mostrar
 */
export function formatearFecha(fecha) {
  if (!fecha) return ''
  const date = new Date(fecha)
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
