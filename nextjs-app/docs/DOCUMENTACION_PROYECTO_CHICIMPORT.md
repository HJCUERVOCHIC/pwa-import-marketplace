# 📋 DOCUMENTACIÓN TÉCNICA COMPLETA
# Chic Import USA - PWA Import Marketplace
## Fecha de Actualización: 28 de Noviembre de 2025

---

## 🎯 RESUMEN EJECUTIVO

**Chic Import USA** es una plataforma de e-commerce tipo marketplace que permite a administradores gestionar catálogos de productos importados y compartirlos con clientes a través de WhatsApp con previews enriquecidos (imagen, título, precio).

### Problema Original Resuelto
Las Single Page Applications (SPA) con Vite/React no podían generar meta tags dinámicos del lado del servidor. Cuando se compartían productos por WhatsApp, solo aparecía un link genérico sin imagen ni información del producto.

### Solución Implementada
Migración completa a **Next.js con App Router** para habilitar Server-Side Rendering (SSR) y generar meta tags OpenGraph dinámicos por cada producto.

### Estado Actual: ✅ FUNCIONANDO EN PRODUCCIÓN

---

## 🌐 URLs DE PRODUCCIÓN

| Página | URL |
|--------|-----|
| **Página Principal** | https://pwa-import-marketplace.vercel.app/ |
| **Catálogo Público** | https://pwa-import-marketplace.vercel.app/catalogo |
| **Login Admin** | https://pwa-import-marketplace.vercel.app/auth |
| **Dashboard Admin** | https://pwa-import-marketplace.vercel.app/admin |
| **Gestión de Listas** | https://pwa-import-marketplace.vercel.app/admin/listas |

---

## 🏗️ ARQUITECTURA DEL PROYECTO

### Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Next.js** | 16.0.4 | Framework principal con App Router y SSR |
| **React** | 19.x | Librería UI |
| **Tailwind CSS** | 4.x | Framework de estilos |
| **Supabase** | @supabase/supabase-js 2.x | Backend, Auth, Database, Storage |
| **Vercel** | - | Hosting, CI/CD automático |
| **Node.js** | 18+ | Runtime |

### Estructura de Carpetas

```
pwa-import-marketplace/
├── frontend/                    # ⚠️ DEPRECADO - Proyecto Vite anterior
└── nextjs-app/                  # ✅ PROYECTO ACTIVO
    ├── src/
    │   ├── app/                 # App Router de Next.js
    │   │   ├── page.js          # Página principal (/)
    │   │   ├── layout.js        # Layout global con metadata
    │   │   ├── globals.css      # Estilos globales Tailwind
    │   │   ├── auth/
    │   │   │   └── page.js      # Login (/auth)
    │   │   ├── admin/
    │   │   │   ├── page.js      # Dashboard (/admin)
    │   │   │   └── listas/
    │   │   │       ├── page.js  # Gestión de listas (/admin/listas)
    │   │   │       └── [id]/
    │   │   │           └── productos/
    │   │   │               └── page.js  # Gestión de productos
    │   │   └── catalogo/
    │   │       ├── page.js      # Catálogo público (/catalogo)
    │   │       └── [idLista]/
    │   │           ├── page.js  # Lista pública
    │   │           └── [idProducto]/
    │   │               └── page.js  # Producto con meta tags dinámicos
    │   ├── lib/
    │   │   └── supabase.js      # Cliente Supabase configurado
    │   └── services/
    │       ├── catalogoService.js   # Queries del catálogo público
    │       ├── estadosService.js    # Gestión de estados (máquina de estados)
    │       ├── uploadService.js     # Subida de imágenes a Storage
    │       └── whatsappService.js   # Generación de links WhatsApp
    ├── public/
    │   └── og-image.jpg         # Imagen fallback para OpenGraph
    ├── .env.local               # Variables de ambiente (local)
    ├── next.config.mjs          # Configuración de Next.js
    ├── tailwind.config.js       # Configuración de Tailwind
    ├── postcss.config.mjs       # Configuración de PostCSS
    ├── jsconfig.json            # Alias de paths (@/)
    └── package.json             # Dependencias
```

---

## 🔐 CONFIGURACIÓN

### Variables de Ambiente

#### Archivo `.env.local` (desarrollo local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://kwprtjcfoawvpjvtefwx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3cHJ0amNmb2F3dnBqdnRlZnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODEyNDcsImV4cCI6MjA3NzM1NzI0N30.qV0-xFGxbGter68fu5CEsCwcyvCrPFTC6LiTrfsilmA
NEXT_PUBLIC_APP_URL=https://pwa-import-marketplace.vercel.app
```

#### Variables en Vercel (producción)
Configurar en: **Vercel → Project → Settings → Environment Variables**

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kwprtjcfoawvpjvtefwx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` (key completa) |
| `NEXT_PUBLIC_APP_URL` | `https://pwa-import-marketplace.vercel.app` |

### Configuración de Vercel

| Setting | Valor |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `nextjs-app` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

---

## 🗄️ BASE DE DATOS (Supabase)

### Proyecto Supabase
- **URL:** https://kwprtjcfoawvpjvtefwx.supabase.co
- **Región:** (configurada en Supabase)

### Tablas

#### `listas_oferta`
Almacena las listas/catálogos de productos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Primary key (auto-generado) |
| `titulo` | TEXT | Título de la lista (requerido) |
| `descripcion` | TEXT | Descripción opcional |
| `fecha_oferta` | DATE | Fecha de la oferta |
| `trm_lista` | DECIMAL | Tasa de cambio USD → COP |
| `tax_modo_lista` | TEXT | 'porcentaje' o 'valor_fijo_usd' |
| `tax_porcentaje_lista` | DECIMAL | Porcentaje de TAX (si modo=porcentaje) |
| `tax_usd_lista` | DECIMAL | Valor fijo en USD (si modo=valor_fijo_usd) |
| `estado` | TEXT | Estado actual de la lista |
| `creado_por` | UUID | FK a auth.users (requerido por RLS) |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de última actualización |

#### `productos`
Almacena los productos de cada lista.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Primary key (auto-generado) |
| `id_lista` | UUID | FK a listas_oferta |
| `titulo` | TEXT | Nombre del producto (requerido) |
| `marca` | TEXT | Marca del producto |
| `categoria` | TEXT | Categoría (calzado, ropa, tecnologia, etc.) |
| `descripcion` | TEXT | Descripción del producto |
| `imagenes` | TEXT[] | Array de URLs de imágenes |
| `precio_base_usd` | DECIMAL | Precio base en dólares |
| `margen_porcentaje` | DECIMAL | Margen de ganancia (%) |
| `costo_total_cop` | DECIMAL | Costo total en pesos (calculado) |
| `precio_final_cop` | DECIMAL | Precio de venta en pesos |
| `ganancia_cop` | DECIMAL | Ganancia en pesos (calculado) |
| `estado` | TEXT | Estado actual del producto |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de última actualización |

### Storage (Supabase Storage)

| Configuración | Valor |
|---------------|-------|
| **Bucket Name** | `productos-imagenes` |
| **Acceso** | Público para lectura |
| **Estructura de archivos** | `productos/{timestamp}-{random}.{ext}` |

**URL base de imágenes:**
```
https://kwprtjcfoawvpjvtefwx.supabase.co/storage/v1/object/public/productos-imagenes/
```

### Row Level Security (RLS)

Las tablas tienen RLS habilitado. Puntos importantes:
- La tabla `listas_oferta` requiere el campo `creado_por` con el ID del usuario autenticado
- Las políticas permiten lectura pública de listas/productos publicados
- Solo usuarios autenticados pueden crear/editar

---

## 📊 REGLAS DE NEGOCIO

### Máquina de Estados - Listas

```
┌─────────┐     ┌───────────┐     ┌─────────┐     ┌───────────┐
│ borrador │ ──► │ publicada │ ──► │ cerrada │ ──► │ archivada │
└─────────┘     └───────────┘     └─────────┘     └───────────┘
     │               │                                   ▲
     │               └───────────────────────────────────┤
     └───────────────────────────────────────────────────┘
```

| Estado | Descripción | Acciones Permitidas |
|--------|-------------|---------------------|
| `borrador` | Lista en preparación | Editar, Publicar*, Archivar |
| `publicada` | Visible en catálogo público | Cerrar, Archivar |
| `cerrada` | Visible pero no modificable | Archivar |
| `archivada` | Estado final, no visible | Ninguna |

*Para publicar se requiere: TRM configurada, TAX configurado, ≥1 producto listo

### Máquina de Estados - Productos

```
┌─────────┐     ┌─────────────────────┐     ┌───────────┐
│ borrador │ ──► │ listo_para_publicar │ ──► │ publicado │
└─────────┘     └─────────────────────┘     └───────────┘
                                                  │  ▲
                                                  ▼  │
                                              ┌───────┐
                                              │ oculto │
                                              └───────┘
```

| Estado | Descripción | Acciones Permitidas |
|--------|-------------|---------------------|
| `borrador` | Producto en preparación | Marcar Listo* |
| `listo_para_publicar` | Listo para publicar | Publicar** |
| `publicado` | Visible en catálogo | Ocultar |
| `oculto` | Temporalmente oculto | Publicar |

*Requiere cálculos completos (costo, precio, ganancia)
**Requiere que la lista esté publicada

### Calculadora de Precios

**Fórmulas:**
```
SI tax_modo = 'porcentaje':
    TAX (USD) = precio_base_usd × (tax_porcentaje / 100)
SI tax_modo = 'valor_fijo_usd':
    TAX (USD) = tax_usd_lista

Costo Total (USD) = precio_base_usd + TAX (USD)
Costo Total (COP) = Costo Total (USD) × TRM   [redondeado a miles]
Precio Sugerido (COP) = Costo Total (COP) × (1 + margen/100)   [redondeado a miles]
Ganancia (COP) = Precio Final (COP) - Costo Total (COP)
```

**Función de redondeo:**
```javascript
const redondearAMil = (valor) => Math.round(valor / 1000) * 1000
```

**Validaciones:**
- Precio final NO puede ser menor que costo total
- Mínimo 1 imagen por producto
- Título obligatorio
- Precio base > 0

### Categorías Disponibles
- calzado
- ropa
- tecnologia
- hogar
- deportes
- belleza
- juguetes
- otros

---

## 🏷️ META TAGS DINÁMICOS (OpenGraph)

### Implementación SSR

El archivo `src/app/catalogo/[idLista]/[idProducto]/page.js` exporta una función `generateMetadata()` que Next.js ejecuta en el servidor:

```javascript
export async function generateMetadata({ params }) {
  const { idProducto } = await params
  const { data: producto } = await getProductoPublicoById(idProducto)
  
  const precio = formatearPrecioCOP(producto.precio_final_cop)
  const imagen = producto.imagenes?.[0] || 'https://pwa-import-marketplace.vercel.app/og-image.jpg'

  return {
    title: `${producto.titulo} - Chic Import USA`,
    description: `${producto.marca ? producto.marca + ' - ' : ''}${precio}`,
    openGraph: {
      title: producto.titulo,
      description: `${producto.marca ? producto.marca + ' - ' : ''}${precio}`,
      images: [{
        url: imagen,
        width: 1200,
        height: 630,
        alt: producto.titulo,
      }],
      type: 'website',
      siteName: 'Chic Import USA',
    },
    twitter: {
      card: 'summary_large_image',
      title: producto.titulo,
      description: `${producto.marca ? producto.marca + ' - ' : ''}${precio}`,
      images: [imagen],
    },
  }
}
```

### Resultado en WhatsApp/Facebook

Cuando se comparte un link de producto:
- ✅ Imagen del producto
- ✅ Título del producto
- ✅ Marca y precio

### Herramienta de Verificación
- **Facebook Sharing Debugger:** https://developers.facebook.com/tools/debug/

---

## 📱 COMPARTIR POR WHATSAPP

### Implementación del Botón

```javascript
<a 
  href={`https://wa.me/?text=${encodeURIComponent(
    `¡Mira este producto!\n\n*${producto.titulo}*\n${producto.marca ? `Marca: ${producto.marca}\n` : ''}Precio: ${precio}\n\nhttps://pwa-import-marketplace.vercel.app/catalogo/${idLista}/${idProducto}`
  )}`}
  target="_blank" 
  rel="noopener noreferrer"
>
  Compartir por WhatsApp
</a>
```

### Formato del Mensaje
```
¡Mira este producto!

*Nombre del Producto*
Marca: Nike
Precio: $660.000

https://pwa-import-marketplace.vercel.app/catalogo/[idLista]/[idProducto]
```

---

## ✅ FUNCIONALIDADES COMPLETADAS

### Panel de Administración
- [x] Login con Supabase Auth (email/password)
- [x] Dashboard con estadísticas (total listas, productos, publicados)
- [x] CRUD de Listas con configuración TRM y TAX
- [x] CRUD de Productos con calculadora de precios
- [x] Subida múltiple de imágenes a Supabase Storage
- [x] Gestión completa de estados (publicar, cerrar, archivar, ocultar)
- [x] Validaciones de negocio
- [x] Protección de rutas (redirección si no autenticado)

### Catálogo Público
- [x] Listado de listas publicadas/cerradas
- [x] Grid de productos por lista
- [x] Página de detalle de producto
- [x] Meta tags dinámicos OpenGraph (SSR)
- [x] Botón de compartir por WhatsApp
- [x] Diseño responsive

### Infraestructura
- [x] Deployment automático en Vercel
- [x] Variables de ambiente configuradas
- [x] Storage público para imágenes
- [x] Row Level Security en Supabase

---

## 📝 PENDIENTES / PRÓXIMOS PASOS

### Alta Prioridad
- [ ] Editar productos existentes
- [ ] Editar listas existentes
- [ ] Eliminar productos
- [ ] Eliminar listas (con confirmación)

### Media Prioridad
- [ ] Galería de imágenes en detalle de producto (carrusel)
- [ ] Filtros y búsqueda en catálogo público
- [ ] Paginación de productos
- [ ] Ordenamiento de productos (por precio, fecha)
- [ ] Dominio personalizado (chicimportusa.com)

### Baja Prioridad
- [ ] PWA features (instalable, offline)
- [ ] Notificaciones push
- [ ] Analytics (Google Analytics, Vercel Analytics)
- [ ] Multi-idioma
- [ ] Dashboard con gráficos de ventas/visitas
- [ ] Exportar catálogo a PDF

---

## 🔧 COMANDOS DE DESARROLLO

### Desarrollo Local
```bash
cd ~/Documents/pwa-import-marketplace/nextjs-app
npm install
npm run dev
# Abre http://localhost:3000
```

### Build de Producción (local)
```bash
npm run build
npm start
```

### Deploy a Producción
```bash
git add -A
git commit -m "Descripción del cambio"
git push origin main
# Vercel detecta automáticamente y hace deploy
```

### Limpiar Caché
```bash
rm -rf .next
npm run dev
```

### Verificar archivos problemáticos
```bash
# Buscar imports de react-router-dom (no deben existir)
grep -r "react-router-dom" src/
```

---

## 🔗 REPOSITORIO

| Item | Valor |
|------|-------|
| **GitHub** | https://github.com/HJCUERVOCHIC/pwa-import-marketplace |
| **Branch activo** | main |
| **Root Directory** | nextjs-app |

---

## 📚 RECURSOS Y REFERENCIAS

- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Facebook Sharing Debugger:** https://developers.facebook.com/tools/debug/

---

## 🐛 PROBLEMAS CONOCIDOS Y SOLUCIONES

### 1. Error RLS al crear lista
**Problema:** `new row violates row-level security policy`
**Solución:** Incluir `creado_por: user.id` al insertar lista

### 2. Bucket not found
**Problema:** `StorageApiError: Bucket not found`
**Solución:** El bucket se llama `productos-imagenes`, no `imagenes`

### 3. Error de build con react-router-dom
**Problema:** `Cannot find module 'react-router-dom'`
**Solución:** Eliminar archivos viejos del proyecto Vite que importan react-router-dom

### 4. Meta tags no aparecen en WhatsApp
**Problema:** WhatsApp muestra link genérico sin preview
**Solución:** Usar `generateMetadata()` de Next.js para SSR de meta tags

### 5. Imagen no aparece en preview de WhatsApp/Facebook
**Problema:** La imagen tarda en aparecer
**Solución:** Las imágenes nuevas se procesan asincrónicamente. Usar "Volver a extraer" en Facebook Debugger varias veces.

---

## 👤 INFORMACIÓN DE CONTACTO

**Desarrollador:** Hector Cuervo
**Proyecto:** Chic Import USA - PWA Import Marketplace

---

*Documento actualizado: 28 de Noviembre de 2025*
*Versión: 2.0 - Migración Next.js completada y funcionando*
