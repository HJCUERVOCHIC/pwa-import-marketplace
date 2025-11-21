// Configuracion centralizada de la aplicacion
// Chic Import USA - PWA Import Marketplace

export const APP_CONFIG = {
  // URL publica del sitio (produccion)
  // En desarrollo: usa VITE_PUBLIC_URL del .env
  // En produccion: chicimportusa.com
  publicUrl: import.meta.env.VITE_PUBLIC_URL || 'https://chicimportusa.com',
  
  // Nombre del sitio
  siteName: 'Chic Import USA',
  
  // Informacion de contacto
  contact: {
    whatsappNumber: '', // Formato: 573001234567 (codigo pais + numero sin espacios)
    email: 'contacto@chicimportusa.com',
  },
  
  // Limites
  limits: {
    maxProductosEnMensaje: 10, // Maximo productos a listar en mensaje de lista
    maxCaracteresWhatsApp: 4000, // Limite de caracteres de WhatsApp
  },
  
  // Rutas publicas
  routes: {
    catalogo: '/catalogo',
    catalogoLista: (idLista) => `/catalogo/${idLista}`,
    catalogoProducto: (idLista, idProducto) => `/catalogo/${idLista}/${idProducto}`,
  },
};
