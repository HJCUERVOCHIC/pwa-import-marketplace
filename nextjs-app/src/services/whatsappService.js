// Servicio para compartir productos y listas por WhatsApp
// Sesion 011 - Chic Import USA

import { APP_CONFIG } from '../config/app.config';

/**
 * Genera URL absoluta para una lista
 * @param {string} idLista - UUID de la lista
 * @returns {string} URL absoluta
 */
export const generarUrlLista = (idLista) => {
  const path = APP_CONFIG.routes.catalogoLista(idLista);
  return `${APP_CONFIG.publicUrl}${path}`;
};

/**
 * Genera URL absoluta para un producto
 * @param {string} idLista - UUID de la lista
 * @param {string} idProducto - UUID del producto
 * @returns {string} URL absoluta
 */
export const generarUrlProducto = (idLista, idProducto) => {
  const path = APP_CONFIG.routes.catalogoProducto(idLista, idProducto);
  return `${APP_CONFIG.publicUrl}${path}`;
};

/**
 * Formatea precio en formato colombiano
 * @param {number} precio - Precio en COP
 * @returns {string} Precio formateado (ej: $385.000 COP)
 */
export const formatearPrecioCOP = (precio) => {
  if (!precio) return '$0 COP';
  return `$${precio.toLocaleString('es-CO')} COP`;
};

/**
 * Genera mensaje de WhatsApp para compartir un producto
 * @param {Object} producto - Objeto producto con: titulo, marca, precio_final_cop
 * @param {string} idLista - UUID de la lista
 * @returns {string} Mensaje formateado
 */
export const generarMensajeProducto = (producto, idLista) => {
  const url = generarUrlProducto(idLista, producto.id);
  const precio = formatearPrecioCOP(producto.precio_final_cop);
  
  // Formato segun especificacion:
  // Titulo
  // Marca: X
  // Precio: $XXX COP
  //
  // URL
  
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
  const maxProductos = APP_CONFIG.limits.maxProductosEnMensaje;
  
  // Formato segun especificacion:
  // Titulo de oferta emoji
  //
  // Producto 1 - Precio
  // Producto 2 - Precio
  // ...
  //
  // Ver todos:
  // URL
  
  let mensaje = `¡Nueva oferta disponible en ${APP_CONFIG.siteName}! 🎉\n\n`;
  
  // Agregar productos (maximo 10)
  const productosAMostrar = productos.slice(0, maxProductos);
  
  productosAMostrar.forEach((producto) => {
    const precio = formatearPrecioCOP(producto.precio_final_cop);
    mensaje += `${producto.titulo} – ${precio}\n\n`;
  });
  
  // Si hay mas de 10 productos
  if (productos.length > maxProductos) {
    mensaje += `... y más productos disponibles en el enlace.\n\n`;
  }
  
  mensaje += `Ver todos los productos aquí:\n`;
  mensaje += `🔗 ${url}`;
  
  return mensaje;
};

/**
 * Valida si un mensaje esta dentro del limite de WhatsApp
 * @param {string} mensaje - Mensaje a validar
 * @returns {boolean} true si es valido
 */
export const validarLongitudMensaje = (mensaje) => {
  return mensaje.length <= APP_CONFIG.limits.maxCaracteresWhatsApp;
};

/**
 * Abre WhatsApp con mensaje preformateado
 * @param {string} mensaje - Mensaje a compartir
 */
export const compartirPorWhatsApp = (mensaje) => {
  // Validar longitud
  if (!validarLongitudMensaje(mensaje)) {
    console.warn('Mensaje excede limite de WhatsApp, sera truncado');
    mensaje = mensaje.substring(0, APP_CONFIG.limits.maxCaracteresWhatsApp - 100) + '...';
  }
  
  // URL encode del mensaje
  const mensajeCodificado = encodeURIComponent(mensaje);
  
  // Construir URL de WhatsApp
  // https://wa.me/?text=MENSAJE_CODIFICADO
  const whatsappUrl = `https://wa.me/?text=${mensajeCodificado}`;
  
  // Abrir en nueva pestana
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
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
  // Solo listas publicadas o cerradas
  if (!['publicada', 'cerrada'].includes(lista.estado)) {
    return false;
  }
  
  // Debe tener al menos 1 producto publicado
  const productosPublicados = productos.filter(p => p.estado === 'publicado');
  return productosPublicados.length > 0;
};

/**
 * Funcion principal para compartir un producto
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
 * Funcion principal para compartir una lista
 * @param {Object} lista - Lista a compartir
 * @param {Array} productos - Productos de la lista
 * @param {string} idLista - UUID de la lista
 */
export const compartirLista = (lista, productos, idLista) => {
  // Filtrar solo productos publicados
  const productosPublicados = productos.filter(p => p.estado === 'publicado');
  
  if (!puedeCompartirseLista(lista, productosPublicados)) {
    console.error('Esta lista no puede compartirse');
    return;
  }
  
  const mensaje = generarMensajeLista(lista, productosPublicados, idLista);
  compartirPorWhatsApp(mensaje);
};
