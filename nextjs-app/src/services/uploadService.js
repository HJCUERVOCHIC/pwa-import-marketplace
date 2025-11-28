import { supabase } from './supabaseClient'

/**
 * Sube una imagen a Supabase Storage
 * @param {File} file - Archivo de imagen
 * @param {string} folder - Carpeta donde guardar (ej: 'productos')
 * @returns {Promise<string>} URL pública de la imagen
 */
export const uploadImage = async (file, folder = 'productos') => {
  try {
    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from('productos-imagenes')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error subiendo imagen:', error)
      throw error
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('productos-imagenes')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Error en uploadImage:', error)
    throw new Error('No se pudo subir la imagen')
  }
}

/**
 * Elimina una imagen de Supabase Storage
 * @param {string} imageUrl - URL de la imagen a eliminar
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
export const deleteImage = async (imageUrl) => {
  try {
    // Extraer el path del archivo desde la URL
    const urlParts = imageUrl.split('/productos-imagenes/')
    if (urlParts.length < 2) {
      console.error('URL de imagen inválida')
      return false
    }
    
    const filePath = urlParts[1]

    const { error } = await supabase.storage
      .from('productos-imagenes')
      .remove([filePath])

    if (error) {
      console.error('Error eliminando imagen:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error en deleteImage:', error)
    return false
  }
}

/**
 * Sube múltiples imágenes
 * @param {FileList|Array<File>} files - Lista de archivos
 * @param {string} folder - Carpeta donde guardar
 * @returns {Promise<Array<string>>} Array de URLs públicas
 */
export const uploadMultipleImages = async (files, folder = 'productos') => {
  try {
    const uploadPromises = Array.from(files).map(file => uploadImage(file, folder))
    const urls = await Promise.all(uploadPromises)
    return urls
  } catch (error) {
    console.error('Error subiendo múltiples imágenes:', error)
    throw new Error('Error al subir algunas imágenes')
  }
}