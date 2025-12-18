// Servicio para compartir por WhatsApp
// Proyecto: Chic Import USA
// Ubicación: src/services/whatsappService.js
// 
// Funcionalidades:
// - Compartir productos del catálogo (con imagen generada por canvas)
// - Compartir listas de productos
// - Enviar confirmación de pedidos (con imágenes subidas)

// =====================================================
// CONFIGURACIÓN (reemplaza APP_CONFIG)
// =====================================================

const CONFIG = {
  siteName: 'Chic Import USA',
  publicUrl: typeof window !== 'undefined' ? window.location.origin : '',
  limits: {
    maxProductosEnMensaje: 10,
    maxCaracteresWhatsApp: 65536
  },
  routes: {
    catalogoLista: (idLista) => `/catalogo/${idLista}`,
    catalogoProducto: (idLista, idProducto) => `/catalogo/${idLista}/${idProducto}`
  }
};

// =====================================================
// UTILIDADES DE URL
// =====================================================

/**
 * Genera URL absoluta para una lista
 * @param {string} idLista - UUID de la lista
 * @returns {string} URL absoluta
 */
export const generarUrlLista = (idLista) => {
  const path = CONFIG.routes.catalogoLista(idLista);
  return `${CONFIG.publicUrl}${path}`;
};

/**
 * Genera URL absoluta para un producto
 * @param {string} idLista - UUID de la lista
 * @param {string} idProducto - UUID del producto
 * @returns {string} URL absoluta
 */
export const generarUrlProducto = (idLista, idProducto) => {
  const path = CONFIG.routes.catalogoProducto(idLista, idProducto);
  return `${CONFIG.publicUrl}${path}`;
};

// =====================================================
// FORMATEO DE PRECIOS
// =====================================================

/**
 * Formatea precio en formato colombiano
 * @param {number} precio - Precio en COP
 * @returns {string} Precio formateado (ej: $385.000 COP)
 */
export const formatearPrecioCOP = (precio) => {
  if (!precio) return '$0 COP';
  return `$${precio.toLocaleString('es-CO')} COP`;
};

// =====================================================
// MENSAJES PARA PRODUCTOS Y LISTAS
// =====================================================

/**
 * Genera mensaje de WhatsApp para compartir un producto
 * @param {Object} producto - Objeto producto con: titulo, marca, precio_final_cop
 * @param {string} idLista - UUID de la lista
 * @returns {string} Mensaje formateado
 */
export const generarMensajeProducto = (producto, idLista) => {
  const url = generarUrlProducto(idLista, producto.id);
  const precio = formatearPrecioCOP(producto.precio_final_cop);
  
  let mensaje = `${producto.titulo}\n`;
  
  if (producto.marca) {
    mensaje += `Marca: ${producto.marca}\n`;
  }
  
  mensaje += `Precio: ${precio}\n\n`;
  mensaje += `🔗 ${url}`;
  
  return mensaje;
};

/**
 * Genera mensaje de WhatsApp para compartir una lista completa
 * @param {Object} lista - Objeto lista con: titulo
 * @param {Array} productos - Array de productos publicados
 * @param {string} idLista - UUID de la lista
 * @returns {string} Mensaje formateado
 */
export const generarMensajeLista = (lista, productos, idLista) => {
  const url = generarUrlLista(idLista);
  const maxProductos = CONFIG.limits.maxProductosEnMensaje;
  
  let mensaje = `¡Nueva oferta disponible en ${CONFIG.siteName}! 🎉\n\n`;
  
  const productosAMostrar = productos.slice(0, maxProductos);
  
  productosAMostrar.forEach((producto) => {
    const precio = formatearPrecioCOP(producto.precio_final_cop);
    mensaje += `${producto.titulo} — ${precio}\n\n`;
  });
  
  if (productos.length > maxProductos) {
    mensaje += `... y más productos disponibles en el enlace.\n\n`;
  }
  
  mensaje += `Ver todos los productos aquí:\n`;
  mensaje += `🔗 ${url}`;
  
  return mensaje;
};

// =====================================================
// MENSAJE PARA CONFIRMACIÓN DE PEDIDOS
// PLANTILLA OFICIAL - NO MODIFICAR
// =====================================================

/**
 * Genera mensaje de confirmación para pedido encontrado
 * @param {Object} item - Item del pedido (pedido_items)
 * @returns {string} Mensaje formateado según plantilla oficial
 */
export const generarMensajeConfirmacionPedido = (item) => {
  return `Hola 👋

Hemos encontrado el producto que solicitaste en Chic Import USA 🇺🇸✨

🛍️ Producto: ${item.titulo_articulo || 'Producto'}
👤 Sexo: ${item.genero || 'No especificado'}
📏 Talla: ${item.talla || 'No especificada'}
📝 Detalles: ${item.descripcion_detallada || 'Sin observaciones'}

📸 Te enviamos la imagen del producto encontrado para que la revises.

Por favor confírmanos respondiendo a este mensaje:

✅ *CONFIRMAR*  
❌ *RECHAZAR*

Tan pronto confirmes, procederemos con la compra y el proceso de envío 📦✈️

Gracias por confiar en Chic Import USA 💙`;
};

// =====================================================
// VALIDACIONES
// =====================================================

/**
 * Valida si un mensaje está dentro del límite de WhatsApp
 * @param {string} mensaje - Mensaje a validar
 * @returns {boolean} true si es válido
 */
export const validarLongitudMensaje = (mensaje) => {
  return mensaje.length <= CONFIG.limits.maxCaracteresWhatsApp;
};

/**
 * Valida si un producto puede compartirse
 * @param {Object} producto - Objeto producto con estado
 * @returns {boolean} true si puede compartirse
 */
export const puedeCompartirseProducto = (producto) => {
  return producto.estado === 'publicado';
};

/**
 * Valida si una lista puede compartirse
 * @param {Object} lista - Objeto lista con estado
 * @param {Array} productos - Array de productos de la lista
 * @returns {boolean} true si puede compartirse
 */
export const puedeCompartirseLista = (lista, productos = []) => {
  if (!['publicada', 'cerrada'].includes(lista.estado)) {
    return false;
  }
  
  const productosPublicados = productos.filter(p => p.estado === 'publicado');
  return productosPublicados.length > 0;
};

// =====================================================
// FUNCIONES DE COMPARTIR - BÁSICAS
// =====================================================

/**
 * Abre WhatsApp con mensaje preformateado (sin número específico)
 * @param {string} mensaje - Mensaje a compartir
 */
export const compartirPorWhatsApp = (mensaje) => {
  if (!validarLongitudMensaje(mensaje)) {
    console.warn('Mensaje excede límite de WhatsApp, será truncado');
    mensaje = mensaje.substring(0, CONFIG.limits.maxCaracteresWhatsApp - 100) + '...';
  }
  
  const mensajeCodificado = encodeURIComponent(mensaje);
  const whatsappUrl = `https://wa.me/?text=${mensajeCodificado}`;
  
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Abre WhatsApp con mensaje preformateado a un número específico
 * @param {string} telefono - Número de teléfono
 * @param {string} mensaje - Mensaje a compartir
 */
export const compartirPorWhatsAppANumero = (telefono, mensaje) => {
  if (!validarLongitudMensaje(mensaje)) {
    console.warn('Mensaje excede límite de WhatsApp, será truncado');
    mensaje = mensaje.substring(0, CONFIG.limits.maxCaracteresWhatsApp - 100) + '...';
  }
  
  const telefonoLimpio = telefono.replace(/[^0-9]/g, '');
  const mensajeCodificado = encodeURIComponent(mensaje);
  const whatsappUrl = `https://wa.me/${telefonoLimpio}?text=${mensajeCodificado}`;
  
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

// =====================================================
// FUNCIONES DE COMPARTIR - PRODUCTOS Y LISTAS
// =====================================================

/**
 * Función principal para compartir un producto
 * @param {Object} producto - Producto a compartir
 * @param {string} idLista - UUID de la lista
 */
export const compartirProducto = (producto, idLista) => {
  if (!puedeCompartirseProducto(producto)) {
    console.error('Este producto no puede compartirse');
    return;
  }
  
  const mensaje = generarMensajeProducto(producto, idLista);
  compartirPorWhatsApp(mensaje);
};

/**
 * Función principal para compartir una lista
 * @param {Object} lista - Lista a compartir
 * @param {Array} productos - Productos de la lista
 * @param {string} idLista - UUID de la lista
 */
export const compartirLista = (lista, productos, idLista) => {
  const productosPublicados = productos.filter(p => p.estado === 'publicado');
  
  if (!puedeCompartirseLista(lista, productosPublicados)) {
    console.error('Esta lista no puede compartirse');
    return;
  }
  
  const mensaje = generarMensajeLista(lista, productosPublicados, idLista);
  compartirPorWhatsApp(mensaje);
};

// =====================================================
// FUNCIONES DE COMPARTIR - CON IMÁGENES (Web Share API)
// =====================================================

/**
 * Verifica si el navegador soporta Web Share API
 * @returns {boolean}
 */
export const soportaWebShare = () => {
  return typeof navigator !== 'undefined' && !!navigator.share;
};

/**
 * Verifica si el navegador puede compartir archivos
 * @param {File[]} files - Archivos a verificar
 * @returns {boolean}
 */
export const puedeCompartirArchivos = (files) => {
  if (!navigator.canShare) return false;
  return navigator.canShare({ files });
};

/**
 * Convierte URLs de imágenes a objetos File
 * @param {string[]} urls - Array de URLs de imágenes
 * @param {string} nombreBase - Nombre base para los archivos
 * @returns {Promise<File[]>} Array de Files
 */
export const urlsAFiles = async (urls, nombreBase = 'imagen') => {
  const files = [];
  
  for (let i = 0; i < urls.length; i++) {
    try {
      const response = await fetch(urls[i]);
      const blob = await response.blob();
      const extension = urls[i].split('.').pop()?.split('?')[0] || 'jpg';
      const file = new File(
        [blob], 
        `${nombreBase}_${i + 1}.${extension}`, 
        { type: blob.type || 'image/jpeg' }
      );
      files.push(file);
    } catch (error) {
      console.error(`Error convirtiendo imagen ${i + 1}:`, error);
    }
  }
  
  return files;
};

/**
 * Comparte archivos usando Web Share API
 * @param {File[]} files - Archivos a compartir
 * @returns {Promise<boolean>} true si se compartió exitosamente
 */
export const compartirArchivos = async (files) => {
  if (!soportaWebShare()) {
    throw new Error('Web Share API no soportada');
  }
  
  if (!puedeCompartirArchivos(files)) {
    throw new Error('No se pueden compartir estos archivos');
  }
  
  try {
    await navigator.share({ files });
    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      return false; // Usuario canceló
    }
    throw error;
  }
};

/**
 * Descarga imágenes desde URLs
 * @param {string[]} urls - URLs de las imágenes
 * @param {string} nombreBase - Nombre base para los archivos
 */
export const descargarImagenes = async (urls, nombreBase = 'imagen') => {
  for (let i = 0; i < urls.length; i++) {
    try {
      const response = await fetch(urls[i]);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nombreBase}_${i + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Pequeña pausa entre descargas
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error(`Error descargando imagen ${i + 1}:`, error);
    }
  }
};

/**
 * Comparte imagen generada (blob) usando Web Share API
 * Similar a handleCompartirWhatsApp de productos
 * @param {Blob} imagenBlob - Blob de la imagen
 * @param {string} nombreArchivo - Nombre del archivo
 * @returns {Promise<{exito: boolean, metodo: string}>}
 */
export const compartirImagenGenerada = async (imagenBlob, nombreArchivo) => {
  const file = new File([imagenBlob], nombreArchivo, { type: 'image/jpeg' });
  
  // Intentar Web Share API
  if (soportaWebShare() && puedeCompartirArchivos([file])) {
    try {
      await navigator.share({ files: [file] });
      return { exito: true, metodo: 'webshare' };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { exito: false, metodo: 'cancelado' };
      }
      console.log('Web Share falló, usando fallback:', error);
    }
  }
  
  // Fallback: descargar imagen
  const url = URL.createObjectURL(imagenBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return { 
    exito: true, 
    metodo: 'descarga',
    mensaje: 'Imagen descargada. Puedes compartirla manualmente en WhatsApp.'
  };
};

// =====================================================
// FUNCIÓN PRINCIPAL PARA PEDIDOS
// =====================================================

/**
 * Envía confirmación de producto encontrado por WhatsApp
 * Intenta compartir imágenes con Web Share API, si no, abre wa.me
 * 
 * @param {Object} options
 * @param {Object} options.item - Item del pedido (pedido_items)
 * @param {string} options.telefono - Teléfono del cliente
 * @param {string[]} [options.imagenes] - URLs de las imágenes del producto encontrado
 * @returns {Promise<{exito: boolean, metodo: string, mensaje?: string}>}
 */
export const enviarConfirmacionPedido = async ({ item, telefono, imagenes = [] }) => {
  const mensajeTexto = generarMensajeConfirmacionPedido(item);
  
  // Si hay imágenes, intentar compartir con Web Share API
  if (imagenes.length > 0 && soportaWebShare()) {
    try {
      // Convertir URLs a Files
      const files = await urlsAFiles(imagenes, 'producto_encontrado');
      
      // Verificar si puede compartir archivos
      if (files.length > 0 && puedeCompartirArchivos(files)) {
        // Compartir las imágenes primero
        const compartido = await compartirArchivos(files);
        
        if (compartido) {
          // Después de compartir imágenes, abrir WhatsApp con el mensaje
          setTimeout(() => {
            compartirPorWhatsAppANumero(telefono, mensajeTexto);
          }, 500);
          
          return { 
            exito: true, 
            metodo: 'webshare_completo',
            mensaje: 'Imágenes compartidas. Se abrirá WhatsApp con el mensaje.'
          };
        } else {
          // Usuario canceló al compartir imágenes
          return { exito: false, metodo: 'cancelado' };
        }
      }
    } catch (error) {
      console.log('Web Share falló, usando fallback:', error);
    }
  }
  
  // Fallback: Solo abrir WhatsApp con el mensaje
  // Las imágenes se enviarán manualmente
  compartirPorWhatsAppANumero(telefono, mensajeTexto);
  
  return { 
    exito: true, 
    metodo: 'wa_me',
    mensaje: imagenes.length > 0 
      ? 'WhatsApp abierto. Envía las imágenes manualmente desde la galería.'
      : 'WhatsApp abierto con el mensaje.'
  };
};

// =====================================================
// EXPORT DEFAULT
// =====================================================

export default {
  // Configuración
  CONFIG,
  
  // URLs
  generarUrlLista,
  generarUrlProducto,
  
  // Formateo
  formatearPrecioCOP,
  
  // Mensajes
  generarMensajeProducto,
  generarMensajeLista,
  generarMensajeConfirmacionPedido,
  
  // Validaciones
  validarLongitudMensaje,
  puedeCompartirseProducto,
  puedeCompartirseLista,
  
  // Compartir básico
  compartirPorWhatsApp,
  compartirPorWhatsAppANumero,
  compartirProducto,
  compartirLista,
  
  // Web Share API
  soportaWebShare,
  puedeCompartirArchivos,
  urlsAFiles,
  compartirArchivos,
  descargarImagenes,
  compartirImagenGenerada,
  
  // Pedidos
  enviarConfirmacionPedido
};
