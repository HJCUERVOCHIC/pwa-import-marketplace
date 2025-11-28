# 🛒 Chic Import USA - PWA Import Marketplace

Plataforma de e-commerce para gestión de catálogos de productos importados con previews enriquecidos para WhatsApp.

## 🌐 Demo en Producción

**URL:** https://pwa-import-marketplace.vercel.app/

| Sección | URL |
|---------|-----|
| Catálogo Público | https://pwa-import-marketplace.vercel.app/catalogo |
| Admin Login | https://pwa-import-marketplace.vercel.app/auth |
| Dashboard | https://pwa-import-marketplace.vercel.app/admin |

## ✨ Características

- **📋 Gestión de Listas:** Crear catálogos con configuración de TRM y TAX
- **📦 Gestión de Productos:** CRUD completo con calculadora de precios automática
- **📸 Subida de Imágenes:** Múltiples imágenes por producto con Supabase Storage
- **📱 Compartir por WhatsApp:** Previews enriquecidos con imagen, título y precio
- **🔄 Máquina de Estados:** Control completo del ciclo de vida de listas y productos
- **🎨 Diseño Responsive:** Optimizado para móviles y desktop

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 16.0.4 | Framework con SSR |
| React | 19.x | UI Library |
| Tailwind CSS | 4.x | Estilos |
| Supabase | 2.x | Backend, Auth, Storage |
| Vercel | - | Hosting |

## 📁 Estructura del Proyecto

```
pwa-import-marketplace/
├── frontend/          # ⚠️ DEPRECADO (Vite)
└── nextjs-app/        # ✅ PROYECTO ACTIVO
    ├── src/
    │   ├── app/       # App Router (páginas)
    │   ├── lib/       # Configuración Supabase
    │   └── services/  # Servicios y queries
    ├── public/        # Assets estáticos
    └── package.json
```

## 🚀 Instalación y Desarrollo

### Requisitos
- Node.js 18+
- npm o yarn
- Cuenta en Supabase
- Cuenta en Vercel (para deploy)

### Configuración Local

1. **Clonar repositorio:**
```bash
git clone https://github.com/HJCUERVOCHIC/pwa-import-marketplace.git
cd pwa-import-marketplace/nextjs-app
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de ambiente:**
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase
```

4. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

5. **Abrir en navegador:**
```
http://localhost:3000
```

## 🔐 Variables de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

## 📊 Base de Datos

### Tablas Principales

- **`listas_oferta`**: Catálogos con configuración de TRM/TAX
- **`productos`**: Productos con precios y estados

### Storage
- **Bucket:** `productos-imagenes`
- **Acceso:** Público para lectura

## 📱 Flujo de Estados

### Listas
```
borrador → publicada → cerrada → archivada
```

### Productos
```
borrador → listo_para_publicar → publicado ↔ oculto
```

## 🏷️ Meta Tags Dinámicos

La aplicación genera meta tags OpenGraph dinámicos para cada producto, permitiendo previews enriquecidos al compartir en WhatsApp y otras redes sociales.

```javascript
// Ejemplo de meta tags generados
og:title = "Nike Air Max 90"
og:description = "Nike - $660.000"
og:image = "https://...supabase.co/.../imagen.jpg"
```

## 📝 Scripts Disponibles

```bash
npm run dev      # Desarrollo local
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linter
```

## 🚀 Deploy

El proyecto está configurado para deploy automático en Vercel:

1. Push a `main` branch
2. Vercel detecta cambios automáticamente
3. Build y deploy en ~2-3 minutos

### Configuración en Vercel
- **Root Directory:** `nextjs-app`
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`

## 📄 Documentación

Para documentación técnica detallada, ver:
- [DOCUMENTACION_PROYECTO_CHICIMPORT.md](./docs/DOCUMENTACION_PROYECTO_CHICIMPORT.md)

## 🤝 Contribuir

1. Fork del repositorio
2. Crear branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📞 Contacto

**Desarrollador:** Hector Cuervo  
**Proyecto:** Chic Import USA

---

*Última actualización: 28 de Noviembre de 2025*
