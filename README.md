# 🛍️ Chic Import USA - PWA Import Marketplace

**Versión:** v0.5.0  
**Estado:** ✅ En Desarrollo Activo  
**Última actualización:** Noviembre 2025

---

## 📋 Descripción

**Chic Import USA** es una aplicación web progresiva (PWA) diseñada para gestionar y publicar catálogos de productos importados desde Estados Unidos. La plataforma permite a administradores crear listas de productos con cálculos automáticos de precios basados en TRM (Tasa Representativa del Mercado) y TAX, mientras que los usuarios pueden explorar un catálogo público sin necesidad de autenticación.

---

## ✨ Funcionalidades Implementadas

### 🔐 **Panel Administrativo**

#### **Gestión de Listas**
- ✅ Crear listas de productos con configuración de TRM, TAX y margen
- ✅ Estados: `borrador`, `publicada`, `cerrada`, `archivada`
- ✅ Transiciones controladas con validaciones
- ✅ Dashboard con estadísticas en tiempo real

#### **Gestión de Productos**
- ✅ Agregar productos con cálculos automáticos en COP
- ✅ Estados: `borrador`, `listo_para_publicar`, `publicado`, `oculto`
- ✅ Marcar productos como listos para publicar
- ✅ Publicación individual y masiva
- ✅ Snapshot de valores (TRM, TAX, margen) al publicar

#### **Flujo de Publicación**
- ✅ Validaciones estrictas antes de publicar
- ✅ Modales de confirmación para acciones críticas
- ✅ Botones contextuales según estado
- ✅ Cerrar y archivar listas
- ✅ Ocultar productos temporalmente

### 🌐 **Catálogo Público**

#### **Acceso Sin Autenticación**
- ✅ Vista de listas publicadas y cerradas
- ✅ Exploración de productos por lista
- ✅ Detalle completo de producto con carrusel de imágenes
- ✅ Navegación fluida y breadcrumbs

#### **Seguridad y Privacidad**
- ✅ Ocultamiento de datos sensibles (costos, ganancias, márgenes)
- ✅ Row Level Security (RLS) en Supabase
- ✅ Solo productos y listas públicas visibles

### 🎨 **Diseño**
- ✅ Sistema de diseño "Chic Import USA" (Gold, Emerald, Bordeaux)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Componentes reutilizables
- ✅ Animaciones y transiciones suaves

---

## 🛠️ Stack Tecnológico

### **Frontend**
- **Framework:** React 18+ con Vite
- **Routing:** React Router v6
- **Estilos:** Tailwind CSS
- **Iconos:** Lucide React
- **Tipografía:** Playfair Display + Inter (Google Fonts)

### **Backend & Base de Datos**
- **BaaS:** Supabase
- **Base de Datos:** PostgreSQL
- **Autenticación:** Supabase Auth (Email/Password)
- **Seguridad:** Row Level Security (RLS)

### **Herramientas**
- **Bundler:** Vite
- **Package Manager:** npm
- **Version Control:** Git

---

## 📂 Estructura del Proyecto

```
pwa-import-marketplace/
├── frontend/
│   ├── src/
│   │   ├── components/           # Componentes reutilizables
│   │   │   ├── Layout.jsx        # Layout admin
│   │   │   ├── PublicLayout.jsx  # Layout público
│   │   │   ├── AccionesLista.jsx
│   │   │   ├── AccionesProducto.jsx
│   │   │   └── ModalConfirmacion.jsx
│   │   │
│   │   ├── pages/                # Páginas de la aplicación
│   │   │   ├── admin/
│   │   │   │   └── DashboardPage.tsx
│   │   │   ├── auth/
│   │   │   │   └── LoginPage.tsx
│   │   │   ├── ListasPage.jsx
│   │   │   ├── ProductosPage.jsx
│   │   │   ├── CatalogoPage.jsx          # Público
│   │   │   ├── CatalogoListaPage.jsx     # Público
│   │   │   └── CatalogoProductoPage.jsx  # Público
│   │   │
│   │   ├── services/             # Servicios y lógica de negocio
│   │   │   ├── supabaseClient.js
│   │   │   ├── estadosService.js
│   │   │   └── catalogoService.js
│   │   │
│   │   ├── features/             # Features modulares
│   │   │   └── auth/
│   │   │
│   │   ├── App.jsx               # Router principal
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── database/
│   ├── 01_schema_inicial.sql
│   └── 02_politicas_rls_publico.sql
│
├── docs/
│   ├── prompts/
│   └── SESION_010_COMPLETA.md
│
└── README.md
```

---

## 🚀 Instalación y Configuración

### **Requisitos Previos**
- Node.js 18+ 
- npm 9+
- Cuenta en Supabase

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/tu-usuario/pwa-import-marketplace.git
cd pwa-import-marketplace
```

### **2. Instalar Dependencias**
```bash
cd frontend
npm install
```

### **3. Configurar Variables de Entorno**

Crear archivo `.env` en `frontend/`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### **4. Configurar Base de Datos**

En Supabase SQL Editor, ejecutar en orden:

1. `database/01_schema_inicial.sql`
2. `database/02_politicas_rls_publico.sql`

Agregar columna de margen:
```sql
ALTER TABLE listas_oferta 
ADD COLUMN margen_default_porcentaje NUMERIC(5,2) DEFAULT 30;
```

### **5. Iniciar Servidor de Desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## 📱 Rutas de la Aplicación

### **Rutas Públicas (Sin Autenticación)**
| Ruta | Descripción |
|------|-------------|
| `/` | Redirige a catálogo público |
| `/catalogo` | Lista de ofertas publicadas |
| `/catalogo/:id` | Productos de una lista |
| `/catalogo/:id/:idProducto` | Detalle de producto |

### **Rutas Administrativas (Requieren Login)**
| Ruta | Descripción |
|------|-------------|
| `/admin/login` | Inicio de sesión |
| `/admin/dashboard` | Panel con estadísticas |
| `/admin/listas` | Gestión de listas |
| `/admin/listas/:id/productos` | Gestión de productos |

---

## 🔐 Sistema de Estados

### **Estados de Lista**
```
borrador → publicada → cerrada → archivada
```

- **borrador:** En construcción, no visible públicamente
- **publicada:** Visible en catálogo, permite modificaciones
- **cerrada:** Visible en catálogo, sin modificaciones
- **archivada:** No visible, histórica

### **Estados de Producto**
```
borrador → listo_para_publicar → publicado ⟷ oculto
```

- **borrador:** En edición
- **listo_para_publicar:** Completo pero no público
- **publicado:** Visible en catálogo
- **oculto:** Temporalmente no visible

---

## 🎨 Sistema de Diseño

### **Paleta de Colores**
- **Gold (#D4AF37):** Color primario
- **Emerald (#2F6F4F):** Color secundario
- **Bordeaux (#8A1C1C):** Color de acento
- **Neutrales:** Charcoal, Slate, Stone, Ivory

### **Tipografía**
- **Display:** Playfair Display (títulos)
- **Body:** Inter (texto general)

### **Componentes**
- Botones con variantes (primary, secondary, outline, ghost)
- Cards con hover y sombras
- Badges con colores por estado
- Modales con backdrop
- Inputs con focus ring

---

## 📊 Base de Datos

### **Tablas Principales**

#### **listas_oferta**
- Almacena listas/catálogos de productos
- Campos: `id`, `titulo`, `descripcion`, `estado`, `fecha_oferta`, `trm_lista`, `tax_modo_lista`, `tax_porcentaje_lista`, `tax_usd_lista`, `margen_default_porcentaje`

#### **productos**
- Almacena productos de cada lista
- Campos: `id`, `id_lista`, `titulo`, `marca`, `descripcion`, `imagenes`, `precio_base_usd`, `costo_total_cop`, `precio_final_cop`, `ganancia_cop`, `estado`

#### **administradores**
- Usuarios con acceso al panel admin
- Vinculada con Supabase Auth

### **Seguridad**
- **RLS habilitado** en todas las tablas
- Políticas para usuarios autenticados (admin)
- Políticas para usuarios anónimos (catálogo público)

---

## 🔄 Flujo de Trabajo

### **1. Administrador Crea Lista**
```
1. Login → Dashboard
2. Crear lista (borrador)
3. Configurar TRM, TAX, Margen
4. Agregar productos (borrador)
5. Configurar precios
6. Marcar productos como "listos para publicar"
7. Publicar lista
   → Lista: publicada
   → Productos: publicado
```

### **2. Usuario Público Explora**
```
1. Visitar /catalogo
2. Ver listas publicadas/cerradas
3. Click en lista → Ver productos
4. Click en producto → Ver detalle con imágenes
```

---

## 🧪 Testing

### **Tests Manuales Completados**
- ✅ Flujo completo de creación y publicación
- ✅ Validaciones de negocio
- ✅ Acceso público sin login
- ✅ Ocultamiento de datos sensibles
- ✅ Navegación entre admin y público
- ✅ Responsive design en múltiples dispositivos

---

## 📈 Roadmap

### **✅ Completado (v0.5.0)**
- Gestión completa de listas y productos
- Flujo de publicación con validaciones
- Catálogo público sin autenticación
- Sistema de diseño Chic Import USA
- RLS y seguridad básica

### **🔜 Próximas Funcionalidades**
- [ ] Búsqueda de productos
- [ ] Filtros (precio, marca, categoría)
- [ ] Formulario de contacto funcional
- [ ] WhatsApp integration
- [ ] Edición de listas y productos
- [ ] Carga de imágenes a Supabase Storage
- [ ] Dashboard analytics
- [ ] Export a PDF/Excel

### **🎯 Futuro**
- [ ] Multi-idioma (ES/EN)
- [ ] PWA completa (offline mode)
- [ ] Push notifications
- [ ] Integración con pasarelas de pago
- [ ] Sistema de favoritos
- [ ] Compartir en redes sociales

---

## 🤝 Contribuir

### **Convenciones de Código**
- Componentes React en PascalCase
- Funciones en camelCase
- CSS clases con Tailwind
- Commits siguiendo Conventional Commits

### **Proceso de Contribución**
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

---

## 📝 Documentación Adicional

- [Sesión 010 - Completa](docs/SESION_010_COMPLETA.md)
- [Guía de Git y Commits](docs/GUIA_GIT_COMMIT.md)
- [Fase 1: Flujo de Publicación](docs/GUIA_FASE_1_IMPLEMENTACION.md)
- [Fase 2: Catálogo Público](docs/GUIA_FASE_2_IMPLEMENTACION.md)

---

## 🐛 Issues Conocidos

- Imágenes de productos usan URLs externas (no upload directo)
- Plan gratuito de Supabase requiere login semanal para mantener activo
- No hay edición de listas/productos una vez creados

---

## 📄 Licencia

Este proyecto es privado y propiedad de Chic Import USA.

---

## 👥 Equipo

- **Desarrollo:** Hector - Full Stack Developer
- **Especificaciones:** ChatGPT - Product Manager
- **Implementación Técnica:** Claude - Technical Developer

---

## 📞 Contacto

Para más información sobre el proyecto:
- **Email:** soporte@chicimportusa.com
- **Website:** [En construcción]

---

## 🙏 Agradecimientos

- Supabase por el excelente BaaS
- Tailwind CSS por el sistema de diseño
- Lucide por los iconos
- Google Fonts por la tipografía

---

**Última actualización:** Noviembre 2025  
**Versión actual:** v0.5.0  
**Estado:** ✅ Operativo y en desarrollo activo

---

⭐ **¡Síguenos para ver el progreso del proyecto!**
