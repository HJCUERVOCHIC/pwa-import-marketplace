# 🎯 CONTEXTO DEL PROYECTO - PWA Import Marketplace (Chic Import USA)

**Para:** Nueva sesión de Claude  
**Versión actual:** v0.5.0  
**Última actualización:** Noviembre 20, 2025  
**Estado:** ✅ Operativo y Funcional

---

## 📝 RESUMEN EJECUTIVO

**Chic Import USA** es una PWA (Progressive Web App) para gestionar y publicar catálogos de productos importados desde Estados Unidos. El sistema tiene dos componentes principales:

1. **Panel Administrativo** (requiere login) - Para gestionar listas y productos
2. **Catálogo Público** (sin login) - Para que usuarios exploren productos

### **Funcionalidades Core Implementadas:**
- ✅ Sistema de autenticación con Supabase
- ✅ CRUD de listas con configuración de TRM, TAX y márgenes
- ✅ CRUD de productos con cálculos automáticos de precios
- ✅ Flujo completo de publicación con validaciones
- ✅ Sistema de estados (borrador → publicado → cerrado → archivado)
- ✅ Catálogo público con 3 vistas (listas, productos, detalle)
- ✅ Row Level Security (RLS) para acceso público/privado
- ✅ Sistema de diseño "Chic Import USA" (Gold, Emerald, Bordeaux)

---

## 🏗️ ARQUITECTURA

### **Stack Tecnológico:**
```
Frontend:  React 18 + Vite + Tailwind CSS + React Router v6
Backend:   Supabase (PostgreSQL + Auth + RLS)
Icons:     Lucide React
Fonts:     Playfair Display (títulos) + Inter (body)
```

### **Base de Datos (Supabase PostgreSQL):**

**Tablas principales:**
1. **listas_oferta** - Listas/catálogos de productos
2. **productos** - Productos dentro de cada lista
3. **administradores** - Usuarios admin (vinculado a Supabase Auth)

**Políticas RLS:**
- Usuarios autenticados: Full access a admin
- Usuarios anónimos: Solo listas/productos publicados

---

## 📂 ESTRUCTURA DE ARCHIVOS CLAVE

```
pwa-import-marketplace/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx               # Layout admin con header
│   │   │   ├── PublicLayout.jsx         # Layout público sin auth
│   │   │   ├── AccionesLista.jsx        # Botones de gestión de lista
│   │   │   ├── AccionesProducto.jsx     # Botones de gestión de producto
│   │   │   └── ModalConfirmacion.jsx    # Modal reutilizable
│   │   │
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   └── DashboardPage.tsx    # Dashboard con stats
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx        # Página de login
│   │   │   │   └── LoginForm.tsx        # Formulario de login
│   │   │   ├── ListasPage.jsx           # Gestión de listas
│   │   │   ├── ProductosPage.jsx        # Gestión de productos
│   │   │   ├── CatalogoPage.jsx         # Vista pública: listas
│   │   │   ├── CatalogoListaPage.jsx    # Vista pública: productos de lista
│   │   │   └── CatalogoProductoPage.jsx # Vista pública: detalle producto
│   │   │
│   │   ├── services/
│   │   │   ├── supabaseClient.js        # Cliente de Supabase
│   │   │   ├── estadosService.js        # Gestión de estados (publicar, cerrar, etc)
│   │   │   └── catalogoService.js       # Queries para catálogo público
│   │   │
│   │   ├── features/auth/               # Feature de autenticación
│   │   ├── App.jsx                      # Router principal
│   │   └── main.jsx
│   │
│   ├── .env                             # Variables de entorno (Supabase)
│   ├── package.json
│   ├── tailwind.config.js               # Configuración Tailwind (tema custom)
│   └── vite.config.js
│
├── database/
│   ├── 01_schema_inicial.sql            # Schema completo
│   └── 02_politicas_rls_publico.sql     # Políticas RLS para público
│
└── docs/
    ├── README.md                        # Documentación principal
    ├── ESTADO_VISUAL.md                 # Estado del proyecto con métricas
    └── SESION_010_COMPLETA.md           # Última sesión completa
```

---

## 🔐 SISTEMA DE ESTADOS

### **Estados de Lista:**
```
borrador → publicada → cerrada → archivada
   ↓           ↓          ↓
   └───────────┴──────────→ archivada
```

- **borrador:** En construcción, no visible públicamente
- **publicada:** Visible en catálogo, permite modificaciones
- **cerrada:** Visible en catálogo, sin modificaciones permitidas
- **archivada:** No visible, histórica

### **Estados de Producto:**
```
borrador → listo_para_publicar → publicado ⟷ oculto
```

- **borrador:** En edición
- **listo_para_publicar:** Completo pero no publicado
- **publicado:** Visible en catálogo público
- **oculto:** Temporalmente no visible

### **Transiciones Implementadas:**

**Listas:**
- `publicarLista(id)` - borrador → publicada
- `cerrarLista(id)` - publicada → cerrada
- `archivarLista(id)` - cualquier estado → archivada

**Productos:**
- `marcarListoParaPublicar(id)` - borrador → listo_para_publicar
- `publicarProducto(id)` - listo_para_publicar → publicado
- `ocultarProducto(id)` - publicado ⟷ oculto

---

## 🎨 SISTEMA DE DISEÑO "CHIC IMPORT USA"

### **Paleta de Colores (Tailwind Config):**
```javascript
colors: {
  gold: {
    50: '#FFF9E6',
    100: '#FFF3CC',
    400: '#E8C547',
    600: '#D4AF37',  // Principal
    700: '#B8972F'
  },
  emerald: {
    50: '#E8F5F0',
    600: '#2F6F4F',  // Secundario
    700: '#265A40'
  },
  bordeaux: {
    50: '#F9E8E8',
    600: '#8A1C1C',  // Acento
    700: '#6E1616'
  }
}
```

### **Tipografía:**
```javascript
fontFamily: {
  display: ['Playfair Display', 'serif'],
  body: ['Inter', 'sans-serif']
}
```

---

## 🛣️ RUTAS IMPLEMENTADAS

### **Rutas Públicas (sin autenticación):**
```
/                               → Redirige a /catalogo
/catalogo                       → Lista de ofertas publicadas
/catalogo/:id                   → Productos de una lista específica
/catalogo/:id/:idProducto       → Detalle completo de producto
```

### **Rutas Administrativas (requieren login):**
```
/admin/login                    → Página de inicio de sesión
/admin/dashboard                → Dashboard con estadísticas
/admin/listas                   → Gestión de listas
/admin/listas/:id/productos     → Gestión de productos de una lista
```

---

## 💰 LÓGICA DE PRECIOS

### **Campos en Lista:**
```javascript
{
  trm_lista: 4250.00,              // Tasa de cambio USD → COP
  tax_modo_lista: 'porcentaje',    // o 'fijo'
  tax_porcentaje_lista: 15,        // Si modo es porcentaje
  tax_usd_lista: null,             // Si modo es fijo
  margen_default_porcentaje: 30    // Margen de ganancia por defecto
}
```

### **Cálculos Automáticos en Producto:**
```javascript
// Cuando se crea/actualiza producto:
costo_total_cop = precio_base_usd * trm_lista
precio_final_cop = costo_total_cop * (1 + margen/100)
ganancia_cop = precio_final_cop - costo_total_cop
```

### **Snapshot al Publicar:**
Al publicar una lista, se ejecuta `fn_snapshot_valores_lista(id_lista)` que:
1. Toma valores actuales de TRM, TAX, margen
2. Los guarda en columnas `_snapshot` de cada producto
3. Congela los cálculos para que no cambien si se modifica la lista

---

## 🔒 SEGURIDAD Y ACCESO

### **Datos Visibles Públicamente:**
- ✅ titulo, descripcion, marca
- ✅ imagenes (array de URLs)
- ✅ precio_final_cop
- ✅ estado (solo si es 'publicado')

### **Datos Ocultos al Público:**
- ❌ precio_base_usd
- ❌ costo_total_cop
- ❌ ganancia_cop
- ❌ trm_lista, tax_*, margen_*
- ❌ Cualquier producto que no esté en estado 'publicado'

### **RLS Implementado:**
```sql
-- Política para público: Solo listas publicadas/cerradas
CREATE POLICY "public_can_view_published_listas"
ON listas_oferta FOR SELECT
TO anon
USING (estado IN ('publicada', 'cerrada'));

-- Política para público: Solo productos publicados de listas públicas
CREATE POLICY "public_can_view_published_productos"
ON productos FOR SELECT
TO anon
USING (
  estado = 'publicado' AND
  id_lista IN (
    SELECT id FROM listas_oferta 
    WHERE estado IN ('publicada', 'cerrada')
  )
);
```

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS DETALLADAMENTE

### **1. Dashboard (admin)**
- Muestra estadísticas en tiempo real desde Supabase:
  - Total de listas (todas)
  - Total de productos (todos)
  - Listas activas (publicadas/cerradas)
  - Productos publicados
- Cards con iconos y colores del sistema de diseño
- Responsive design

### **2. Gestión de Listas**
- Crear lista con: título, descripción, fecha, TRM, TAX, margen
- Ver listas en tabla con badges de estado
- Acciones según estado:
  - borrador: Publicar (con validación)
  - publicada: Cerrar, Archivar
  - cerrada: Archivar
- Modales de confirmación para acciones críticas
- No permite modificar lista publicada/cerrada (snapshot protege valores)

### **3. Gestión de Productos**
- Agregar producto con: título, marca, descripción, imágenes, precio base USD
- Cálculo automático de: costo COP, precio final COP, ganancia COP
- Ver productos en tabla con badges de estado
- Acciones según estado:
  - borrador: Marcar Listo para Publicar
  - listo_para_publicar: Publicar Producto
  - publicado: Ocultar
  - oculto: Publicar (de nuevo)
- Warning cuando lista no permite modificaciones
- Stats: "X de Y productos publicados"

### **4. Catálogo Público - Listas**
- Hero section con título y descripción
- Grid de cards de listas publicadas/cerradas
- Cada card muestra:
  - Título y descripción
  - Badge de estado
  - Fecha de oferta
  - Contador de productos publicados
  - Botón "Ver Productos"
- Sin header de admin, sin login requerido

### **5. Catálogo Público - Productos**
- Header con info de la lista
- Breadcrumb: Catálogo > [Nombre Lista]
- Grid de cards de productos
- Cada card muestra:
  - Primera imagen
  - Título y marca
  - Precio en COP formateado
  - Botón "Ver Detalles"
- Empty state si no hay productos publicados

### **6. Catálogo Público - Detalle Producto**
- Breadcrumb completo: Catálogo > Lista > Producto
- Carrusel de imágenes:
  - Imagen principal grande
  - Controles anterior/siguiente
  - Miniaturas clickeables
  - Indicador de posición (1/X)
- Información completa:
  - Título, marca
  - Descripción
  - Precio destacado en grande
  - Badge de estado
- Botón "Contactar por WhatsApp" (preparado)
- Botón "Volver a la Lista"

---

## 🔄 FLUJO DE TRABAJO COMPLETO

### **Administrador Publica Lista:**
```
1. Login → Dashboard
2. Click "Crear Lista"
3. Llenar formulario (título, descripción, TRM, TAX, margen)
4. Submit → Lista creada en estado "borrador"
5. Click en lista → Ver productos
6. Click "Agregar Producto"
7. Llenar formulario (título, marca, descripción, precio USD, imágenes)
   → Sistema calcula automáticamente costo y precio final COP
8. Submit → Producto creado en estado "borrador"
9. Repetir pasos 6-8 para agregar más productos
10. Para cada producto: Click "Marcar Listo para Publicar"
    → Producto pasa a estado "listo_para_publicar"
11. Cuando todos listos: Click "Publicar Lista"
    → Validación: ¿Hay al menos 1 producto listo?
    → Si OK: Lista → "publicada", Productos listos → "publicado"
    → Se ejecuta snapshot de valores
12. Opcionalmente:
    - "Cerrar Lista" → No permite más modificaciones
    - "Archivar Lista" → Desaparece del catálogo
    - "Publicar Producto" → Publicar producto individual
    - "Ocultar Producto" → Ocultar temporalmente
```

### **Usuario Público Explora:**
```
1. Visita /catalogo (sin login)
2. Ve grid de listas publicadas/cerradas
3. Click en una lista
4. Ve grid de productos publicados de esa lista
5. Click en un producto
6. Ve detalle completo con carrusel de imágenes
7. Click "Contactar por WhatsApp" (preparado para implementar)
```

---

## 📦 SERVICIOS IMPLEMENTADOS

### **estadosService.js**
```javascript
// Gestión de estados de listas
publicarLista(id)           // Publica lista y productos listos
cerrarLista(id)             // Cierra lista
archivarLista(id)           // Archiva lista

// Gestión de estados de productos
marcarListoParaPublicar(id) // Marca producto como listo
publicarProducto(id)        // Publica producto individual
ocultarProducto(id)         // Oculta producto temporalmente

// Helpers
getAccionesDisponiblesLista(estado)           // Retorna acciones según estado
getAccionesDisponiblesProducto(estado, ...)   // Retorna acciones según estado
```

### **catalogoService.js**
```javascript
// Queries para catálogo público (usan RLS)
getListasPublicas()              // Solo listas publicadas/cerradas
getListaPublicaById(id)          // Lista específica con contador
getProductosPublicos(id_lista)   // Solo productos publicados
getProductoPublicoById(id)       // Producto específico

// Helpers
formatearPrecioCOP(precio)       // Formato: $12.345.678
formatearFecha(fecha)            // Formato: 20 Nov 2025
```

---

## 🐛 ISSUES CONOCIDOS Y LIMITACIONES

### **Funcionalidades Pendientes:**
1. ❌ **No hay edición de listas/productos** - Solo crear y cambiar estados
2. ❌ **No hay eliminación** - Solo archivar listas
3. ❌ **Imágenes son URLs externas** - No hay upload a Supabase Storage
4. ❌ **No hay búsqueda** - Solo navegación por listas
5. ❌ **No hay filtros** - No se puede filtrar por precio, marca, etc.
6. ❌ **WhatsApp no conectado** - Botón preparado pero no funcional
7. ❌ **No hay paginación** - Si hay muchos productos, todos cargan

### **Consideraciones Técnicas:**
- Plan gratuito de Supabase requiere login semanal para mantener proyecto activo
- RLS debe estar habilitado siempre
- La columna `margen_default_porcentaje` fue agregada manualmente (no está en schema inicial)

---

## 🔧 CONFIGURACIÓN DE ENTORNO

### **Variables de Entorno (.env en frontend/):**
```env
VITE_SUPABASE_URL=https://[tu-proyecto].supabase.co
VITE_SUPABASE_ANON_KEY=[tu-anon-key]
```

### **Configuración Tailwind (tailwind.config.js):**
- Tema custom con colores Chic Import USA
- Fuentes: Playfair Display + Inter
- Configuración de contenido para React

---

## 📈 PRÓXIMOS PASOS SUGERIDOS

### **Alta Prioridad:**
1. **Editar Listas y Productos** - Permitir modificar datos
2. **Eliminar Listas y Productos** - Con confirmación
3. **Upload de Imágenes** - Usar Supabase Storage
4. **Búsqueda de Productos** - Full-text search
5. **Filtros en Catálogo** - Por precio, marca, lista

### **Media Prioridad:**
6. **Formulario de Contacto Funcional** - Enviar a email/WhatsApp
7. **WhatsApp Integration** - Botón real de WhatsApp
8. **Paginación** - Para listas/productos largos
9. **Dashboard Analytics** - Gráficos y métricas avanzadas
10. **Gestión de Usuarios Admin** - CRUD de administradores

### **Baja Prioridad:**
11. Multi-idioma (ES/EN)
12. PWA completa (offline mode, install)
13. Push notifications
14. Integración con pagos
15. Sistema de favoritos
16. Export a PDF/Excel

---

## 📚 DOCUMENTACIÓN DISPONIBLE

En `docs/`:
- **README.md** - Documentación completa del proyecto
- **ESTADO_VISUAL.md** - Estado actual con métricas visuales
- **SESION_010_COMPLETA.md** - Documentación de última sesión
- **GUIA_GIT_COMMIT.md** - Guía para hacer commits
- Guías de implementación de Fase 1 y Fase 2
- Guías de navegación

---

## 🎯 INFORMACIÓN PARA IA ASSISTANTS

### **Estilo de Código Preferido:**
- React funcional con hooks (no clases)
- Tailwind CSS para estilos (no CSS modules)
- Nombres descriptivos en español para variables de negocio
- Componentes pequeños y reutilizables
- Preferir cambios incrementales sobre reemplazos completos

### **Convenciones:**
- Componentes: PascalCase (ej: `AccionesLista.jsx`)
- Funciones: camelCase (ej: `publicarLista()`)
- Archivos de servicio: camelCase (ej: `estadosService.js`)
- Constantes: UPPER_SNAKE_CASE

### **Testing:**
- Actualmente: Testing manual solamente
- No hay tests automatizados implementados
- Importante probar flujos completos manualmente

---

## 🔍 COMANDOS ÚTILES

```bash
# Desarrollo
cd frontend
npm run dev        # Inicia servidor de desarrollo (http://localhost:5173)

# Build
npm run build      # Crea build de producción en dist/

# Preview build
npm run preview    # Preview del build de producción

# Git
git status
git add .
git commit -m "feat: descripción"
git push origin main
```

---

## 📞 INFORMACIÓN DE CONTACTO DEL PROYECTO

- **Proyecto:** Chic Import USA - PWA Import Marketplace
- **Repositorio:** (Privado)
- **Desarrollador:** Hector
- **Stack:** React + Supabase
- **Versión:** v0.5.0
- **Estado:** ✅ Operativo, en desarrollo activo

---

## ⚡ INICIO RÁPIDO PARA NUEVA SESIÓN

**Si necesitas hacer cambios:**

1. **Ver estructura actual:**
   - Frontend en `/frontend/src/`
   - Servicios en `/frontend/src/services/`
   - Componentes en `/frontend/src/components/`
   - Páginas en `/frontend/src/pages/`

2. **Flujos clave implementados:**
   - Autenticación: `features/auth/`
   - Gestión de estados: `estadosService.js`
   - Catálogo público: `catalogoService.js`

3. **Sistema de estados:**
   - Listas: borrador → publicada → cerrada → archivada
   - Productos: borrador → listo → publicado ⟷ oculto

4. **RLS activo:**
   - Público: Solo listas/productos publicados
   - Admin: Full access autenticado

5. **Próxima funcionalidad sugerida:**
   - Edición de listas y productos (alta prioridad)

---

## 🎯 PREGUNTAS FRECUENTES

**Q: ¿Cómo agregar una nueva columna a una tabla?**
A: Usar Supabase SQL Editor, ejecutar ALTER TABLE, actualizar types de TypeScript

**Q: ¿Cómo cambiar el sistema de colores?**
A: Modificar `tailwind.config.js` en la sección `theme.extend.colors`

**Q: ¿Cómo agregar una nueva ruta?**
A: Agregar en `App.jsx`, crear componente de página, actualizar navegación si es necesario

**Q: ¿Cómo modificar las políticas RLS?**
A: Supabase Dashboard → Authentication → Policies, o SQL Editor

**Q: ¿Cómo funciona el snapshot de valores?**
A: Al publicar lista, función SQL `fn_snapshot_valores_lista()` copia TRM/TAX/margen a columnas `_snapshot` de productos

---

**✅ ESTE DOCUMENTO CONTIENE TODO EL CONTEXTO NECESARIO PARA CONTINUAR EL DESARROLLO**

---

**Última actualización:** Noviembre 20, 2025  
**Versión de contexto:** 1.0  
**Para proyecto:** Chic Import USA - PWA Import Marketplace v0.5.0
