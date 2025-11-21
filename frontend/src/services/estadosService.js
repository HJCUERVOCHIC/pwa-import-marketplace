/**
 * Servicio de Gestión de Estados
 * Maneja las transiciones de estado de listas y productos
 */

import { supabase } from './supabaseClient'

/**
 * ============================================
 * FUNCIONES PARA LISTAS
 * ============================================
 */

/**
 * Valida si una lista puede ser publicada
 * Requisitos:
 * - Debe tener al menos 1 producto publicable (listo_para_publicar)
 * - Debe tener TRM configurada
 * - Debe tener TAX configurado
 */
export async function validarPublicacionLista(idLista) {
  try {
    // Obtener la lista
    const { data: lista, error: listaError } = await supabase
      .from('listas_oferta')
      .select('*')
      .eq('id', idLista)
      .single()

    if (listaError) throw listaError

    // Validar TRM y TAX
    if (!lista.trm_lista) {
      return { valido: false, mensaje: 'La lista debe tener TRM configurada' }
    }

    if (lista.tax_modo_lista === 'porcentaje' && !lista.tax_porcentaje_lista) {
      return { valido: false, mensaje: 'La lista debe tener TAX porcentaje configurado' }
    }

    if (lista.tax_modo_lista === 'usd' && !lista.tax_usd_lista) {
      return { valido: false, mensaje: 'La lista debe tener TAX USD configurado' }
    }

    // Contar productos publicables
    const { count, error: countError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true })
      .eq('id_lista', idLista)
      .eq('estado', 'listo_para_publicar')

    if (countError) throw countError

    if (count === 0) {
      return { 
        valido: false, 
        mensaje: 'La lista debe tener al menos 1 producto listo para publicar' 
      }
    }

    return { valido: true, productosPublicables: count }
  } catch (error) {
    console.error('Error validando publicación:', error)
    throw error
  }
}

/**
 * Publica una lista
 * - Cambia estado de lista a 'publicada'
 * - Cambia todos los productos 'listo_para_publicar' a 'publicado'
 */
export async function publicarLista(idLista) {
  try {
    // Validar primero
    const validacion = await validarPublicacionLista(idLista)
    if (!validacion.valido) {
      return { success: false, error: validacion.mensaje }
    }

    // Actualizar estado de la lista
    const { error: listaError } = await supabase
      .from('listas_oferta')
      .update({ 
        estado: 'publicada',
        updated_at: new Date().toISOString()
      })
      .eq('id', idLista)

    if (listaError) throw listaError

    // Publicar productos listos
    const { error: productosError } = await supabase
      .from('productos')
      .update({ 
        estado: 'publicado',
        updated_at: new Date().toISOString()
      })
      .eq('id_lista', idLista)
      .eq('estado', 'listo_para_publicar')

    if (productosError) throw productosError

    return { 
      success: true, 
      mensaje: `Lista publicada con ${validacion.productosPublicables} producto(s)` 
    }
  } catch (error) {
    console.error('Error publicando lista:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Cierra una lista
 * - Cambia estado de lista a 'cerrada'
 * - La lista sigue visible pero no permite más cambios
 */
export async function cerrarLista(idLista) {
  try {
    const { error } = await supabase
      .from('listas_oferta')
      .update({ 
        estado: 'cerrada',
        updated_at: new Date().toISOString()
      })
      .eq('id', idLista)
      .eq('estado', 'publicada') // Solo desde estado publicada

    if (error) throw error

    return { success: true, mensaje: 'Lista cerrada exitosamente' }
  } catch (error) {
    console.error('Error cerrando lista:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Archiva una lista
 * - Cambia estado de lista a 'archivada'
 * - Desaparece del catálogo público
 */
export async function archivarLista(idLista) {
  try {
    const { error } = await supabase
      .from('listas_oferta')
      .update({ 
        estado: 'archivada',
        updated_at: new Date().toISOString()
      })
      .eq('id', idLista)
      .in('estado', ['publicada', 'cerrada', 'borrador']) // Desde varios estados

    if (error) throw error

    return { success: true, mensaje: 'Lista archivada exitosamente' }
  } catch (error) {
    console.error('Error archivando lista:', error)
    return { success: false, error: error.message }
  }
}

/**
 * ============================================
 * FUNCIONES PARA PRODUCTOS
 * ============================================
 */

/**
 * Valida si un producto puede ser publicado
 * Requisitos:
 * - Su lista debe estar publicada
 * - Debe tener cálculos completos (costo total, precio final, ganancia)
 */
export async function validarPublicacionProducto(idProducto) {
  try {
    // Obtener producto y su lista
    const { data: producto, error: productoError } = await supabase
      .from('productos')
      .select(`
        *,
        lista:listas_oferta!productos_id_lista_fkey(estado)
      `)
      .eq('id', idProducto)
      .single()

    if (productoError) throw productoError

    // Verificar que la lista esté publicada
    if (producto.lista.estado !== 'publicada') {
      return { 
        valido: false, 
        mensaje: 'El producto solo puede publicarse si su lista está publicada' 
      }
    }

    // Verificar cálculos
    if (!producto.costo_total_cop || !producto.precio_final_cop || !producto.ganancia_cop) {
      return { 
        valido: false, 
        mensaje: 'El producto debe tener cálculos completos (costo, precio final, ganancia)' 
      }
    }

    return { valido: true }
  } catch (error) {
    console.error('Error validando publicación de producto:', error)
    throw error
  }
}

/**
 * Publica un producto
 * - Cambia estado a 'publicado'
 */
export async function publicarProducto(idProducto) {
  try {
    // Validar primero
    const validacion = await validarPublicacionProducto(idProducto)
    if (!validacion.valido) {
      return { success: false, error: validacion.mensaje }
    }

    // Actualizar estado
    const { error } = await supabase
      .from('productos')
      .update({ 
        estado: 'publicado',
        updated_at: new Date().toISOString()
      })
      .eq('id', idProducto)
      .in('estado', ['listo_para_publicar', 'oculto'])

    if (error) throw error

    return { success: true, mensaje: 'Producto publicado exitosamente' }
  } catch (error) {
    console.error('Error publicando producto:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Marca un producto como listo para publicar
 * - Cambia estado de 'borrador' a 'listo_para_publicar'
 * - Valida que tenga los datos necesarios
 */
export async function marcarListoParaPublicar(idProducto) {
  try {
    // Obtener producto
    const { data: producto, error: productoError } = await supabase
      .from('productos')
      .select('*')
      .eq('id', idProducto)
      .single()

    if (productoError) throw productoError

    // Validar que tenga cálculos completos
    if (!producto.costo_total_cop || !producto.precio_final_cop || !producto.ganancia_cop) {
      return { 
        success: false, 
        error: 'El producto debe tener cálculos completos (costo total, precio final, ganancia)' 
      }
    }

    // Actualizar estado
    const { error } = await supabase
      .from('productos')
      .update({ 
        estado: 'listo_para_publicar',
        updated_at: new Date().toISOString()
      })
      .eq('id', idProducto)
      .eq('estado', 'borrador')

    if (error) throw error

    return { success: true, mensaje: 'Producto marcado como listo para publicar' }
  } catch (error) {
    console.error('Error marcando producto como listo:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Oculta un producto
 * - Cambia estado a 'oculto'
 * - No aparece en catálogo público
 */
export async function ocultarProducto(idProducto) {
  try {
    const { error } = await supabase
      .from('productos')
      .update({ 
        estado: 'oculto',
        updated_at: new Date().toISOString()
      })
      .eq('id', idProducto)
      .eq('estado', 'publicado')

    if (error) throw error

    return { success: true, mensaje: 'Producto ocultado exitosamente' }
  } catch (error) {
    console.error('Error ocultando producto:', error)
    return { success: false, error: error.message }
  }
}

/**
 * ============================================
 * FUNCIONES AUXILIARES
 * ============================================
 */

/**
 * Obtiene las acciones disponibles para una lista según su estado
 */
export function getAccionesDisponiblesLista(estado) {
  const acciones = {
    borrador: ['publicar', 'archivar'],
    publicada: ['cerrar', 'archivar'],
    cerrada: ['archivar'],
    archivada: []
  }

  return acciones[estado] || []
}

/**
 * Obtiene las acciones disponibles para un producto según su estado
 */
export function getAccionesDisponiblesProducto(estado, estadoLista) {
  // Si la lista está cerrada o archivada, no hay acciones disponibles
  if (['cerrada', 'archivada'].includes(estadoLista)) {
    return []
  }

  const acciones = {
    borrador: ['marcar_listo'],
    listo_para_publicar: ['publicar'],
    publicado: ['ocultar'],
    oculto: ['publicar']
  }

  return acciones[estado] || []
}
