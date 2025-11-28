import { supabase } from '@/lib/supabase'

/**
 * Obtiene todas las listas publicadas y cerradas
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
      .order('estado', { ascending: false })
      .order('fecha_oferta', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error obteniendo listas públicas:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Obtiene una lista específica por ID
 */
export async function getListaPublicaById(idLista) {
  try {
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

    const { count, error: countError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true })
      .eq('id_lista', idLista)
      .eq('estado', 'publicado')

    if (countError) throw countError

    return { 
      data: { ...lista, productos_count: count }, 
      error: null 
    }
  } catch (error) {
    console.error('Error obteniendo lista pública:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Obtiene productos publicados de una lista
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
 * Formatea precio COP
 */
export function formatearPrecioCOP(precio) {
  if (!precio) return '$0'
  return `$${Number(precio).toLocaleString('es-CO')}`
}
