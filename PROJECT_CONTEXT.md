# Contexto Completo del Proyecto - PWA Import Marketplace

**Última actualización:** 2025-11-03  
**Estado general:** Módulo 01 completado, pendiente Módulo 03 (Autenticación)

---

## 🎯 Propósito del Proyecto

Plataforma PWA para que administradores publiquen ofertas de productos importados desde USA, con cálculo automático de precios considerando TRM y TAX.

**Flujo de negocio:**
1. Admin crea una **Lista de Oferta** (define TRM y TAX únicos)
2. Admin agrega **Productos** a la lista (calculadora automática de precios)
3. Sistema calcula automáticamente: costo COP, precio sugerido, ganancia
4. Admin ajusta precio final (si es necesario) y publica
5. Los productos publicados quedan visibles en catálogo público

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
```
Frontend:
  - React 18 (biblioteca UI)
  - Vite (bundler, dev server)
  - Tailwind CSS 3.4.0 (estilos)
  - React Router DOM (navegación)
  - Lucide React (iconos)

Backend:
  - Supabase (BaaS completo)
    ├── PostgreSQL (base de datos)
    ├── Auth (autenticación JWT)
    ├── Storage (imágenes)
    └── Edge Functions (lógica serverless)

Hosting:
  - Frontend: Vercel
  - Backend: Supabase Cloud
```

### Estructura del Repositorio
```
pwa-import-marketplace/
├── docs/                          # 📚 Documentación completa
│   ├── requirements/              # Requerimientos de negocio
│   │   ├── 01-productos-calculo-precios.md
│   │   └── 03-auth-admin.md
│   ├── architecture/              # Arquitectura técnica
│   │   └── modelo-datos.md
│   ├── prompts/                   # Historial de desarrollo con Claude
│   │   ├── session-002-modelo-datos.md
│   │   ├── session-003-frontend-inicial.md
│   │   ├── session-004-formulario-listas.md
│   │   └── session-005-editor-productos.md
│   ├── api/                       # Documentación de APIs
│   └── deployment/                # Guías de despliegue
│
├── frontend/                      # 🎨 Aplicación React PWA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── ModalCrearLista.jsx
│   │   │   └── ModalEditorProducto.jsx
│   │   ├── pages/
│   │   │   ├── ListasPage.jsx
│   │   │   └── ProductosPage.jsx
│   │   ├── services/
│   │   │   ├── supabaseClient.js
│   │   │   └── uploadService.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── .env.local                 # Variables de entorno (no en git)
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── supabase/                      # ⚙️ Configuración backend
│   ├── migrations/
│   │   └── 001_inicial.sql
│   └── schema_listas_productos.sql
│
└── scripts/                       # 🔧 Scripts de utilidad
```

---

## 🗄️ Modelo de Datos

### Tabla: `listas_oferta`

**Propósito:** Agrupa productos con parámetros económicos comunes (TRM y TAX).

```sql
CREATE TABLE listas_oferta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  trm_lista DECIMAL(10,2) NOT NULL CHECK (trm_lista > 0),
  tax_modo_lista tax_modo NOT NULL,
  tax_porcentaje_lista DECIMAL(5,2) CHECK (tax_porcentaje_lista >= 0),
  tax_usd_lista DECIMAL(10,2) CHECK (tax_usd_lista >= 0),
  estado estado_lista DEFAULT 'borrador',
  fecha_oferta DATE,
  creado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Estados:** `borrador`, `publicada`, `cerrada`, `archivada`

### Tabla: `productos`

**Propósito:** Productos individuales con cálculos automáticos basados en su lista.

```sql
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_lista UUID NOT NULL REFERENCES listas_oferta(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  marca VARCHAR(100),
  categoria categoria_producto NOT NULL,
  descripcion TEXT,
  imagenes TEXT[] NOT NULL DEFAULT '{}',
  precio_base_usd DECIMAL(10,2) NOT NULL CHECK (precio_base_usd > 0),
  margen_porcentaje DECIMAL(5,2) DEFAULT 0,
  costo_total_usd DECIMAL(10,2),
  costo_total_cop DECIMAL(12,0),
  precio_sugerido_cop DECIMAL(12,0),
  precio_final_cop DECIMAL(12,0),
  ganancia_cop DECIMAL(12,0),
  estado estado_producto DEFAULT 'borrador',
  publicado_at TIMESTAMP,
  publicado_por UUID REFERENCES auth.users(id),
  trm_usada_publicacion DECIMAL(10,2),
  tax_usado_publicacion DECIMAL(10,2),
  margen_usado_publicacion DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT precio_mayor_o_igual_costo CHECK (precio_final_cop >= costo_total_cop),
  CONSTRAINT imagenes_minimo_una CHECK (array_length(imagenes, 1) >= 1 OR estado != 'publicado')
);
```

**Estados:** `borrador`, `listo_para_publicar`, `publicado`, `oculto`

### Lógica de Cálculos (Triggers Automáticos)

**1. `trigger_calcular_valores_producto` (BEFORE INSERT/UPDATE):**
- Calcula automáticamente: costo_total_cop, precio_sugerido_cop, ganancia_cop
- Redondea todos los valores COP a miles (no decenas)
- Se ejecuta cuando cambia: precio_base_usd, margen_porcentaje, precio_final_cop

**2. `trigger_congelar_snapshot` (BEFORE UPDATE):**
- Congela valores al publicar: trm_usada, tax_usado, margen_usado, publicado_at

**3. `trigger_recalcular_productos` (AFTER UPDATE en listas_oferta):**
- Recalcula productos en borrador cuando cambia TRM/TAX de lista
- NO afecta productos publicados (conservan snapshot)

### Fórmulas de Cálculo

```javascript
// 1. TAX aplicado
if (tax_modo === 'porcentaje') {
  taxUsd = precio_base_usd * (tax_porcentaje / 100)
} else {
  taxUsd = tax_usd_fijo
}

// 2. Costo total
costo_total_usd = precio_base_usd + taxUsd
costo_total_cop = redondearAMil(costo_total_usd * trm)

// 3. Precio sugerido
precio_sugerido_cop = redondearAMil(costo_total_cop * (1 + margen / 100))

// 4. Ganancia
ganancia_cop = redondearAMil(precio_final_cop - costo_total_cop)

// Redondeo a miles
const redondearAMil = (valor) => Math.round(valor / 1000) * 1000
```

---

## 🎨 Frontend - Componentes Principales

### Layout.jsx
- Header con logo y título
- Área de contenido principal
- Footer

### ListasPage.jsx
- Grid de tarjetas de listas de oferta
- Información: título, TRM, TAX, fecha
- Estados visuales por color
- Botón "Nueva Lista" → abre ModalCrearLista
- Click en lista → navega a ProductosPage

### ModalCrearLista.jsx
- Formulario completo para crear listas
- Campos: título, descripción, fecha, TRM
- Selector visual de modo TAX (Porcentaje vs Valor Fijo USD)
- Validaciones en tiempo real
- Estados de carga
- Callback para actualizar lista sin refrescar

### ProductosPage.jsx
- Header con info de la lista
- Grid de productos con imágenes
- Visualización de cálculos económicos
- Botón "Agregar Producto" → abre ModalEditorProducto
- Estados visuales por producto

### ModalEditorProducto.jsx
- **Dos columnas:** Información del producto + Calculadora
- Campos básicos: título, marca, categoría, descripción
- Gestión de imágenes (cámara y galería)
- Calculadora en tiempo real:
  - Precio base USD
  - Margen %
  - Resultados: TAX, costo COP, precio sugerido, ganancia
- Modo manual/automático para precio final (checkbox)
- Upload a Supabase Storage
- Validaciones completas

---

## 📦 Servicios

### supabaseClient.js
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### uploadService.js
```javascript
// uploadImage(file, folder) - Sube una imagen
// uploadMultipleImages(files, folder) - Sube múltiples
// deleteImage(imageUrl) - Elimina imagen del Storage
```

---

## ⚙️ Configuración de Supabase

### Storage Bucket
- **Nombre:** `productos-imagenes`
- **Público:** Sí (en desarrollo)
- **Estructura:** `productos-imagenes/productos/timestamp-uuid.ext`

### RLS (Row Level Security)
```sql
-- DESARROLLO: Políticas públicas
CREATE POLICY "Public can upload" ON storage.objects FOR INSERT TO public;
CREATE POLICY "Public can view" ON storage.objects FOR SELECT TO public;
CREATE POLICY "Public can delete" ON storage.objects FOR DELETE TO public;

-- PRODUCCIÓN: Requiere autenticación (pendiente Módulo 03)
```

### Variables de Entorno (.env.local)
```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

---

## 🚀 Comandos Útiles

```bash
# Desarrollo frontend
cd frontend
npm run dev          # Puerto 3000

# Build producción
npm run build
npm run preview

# Verificar base de datos
# En Supabase SQL Editor:
SELECT * FROM listas_oferta ORDER BY created_at DESC;
SELECT * FROM productos WHERE id_lista = 'uuid-aqui';
```

---

## ✅ Funcionalidades Completadas (Módulo 01)

- [x] Modelo de datos completo (tablas, triggers, constraints)
- [x] Frontend con React + Vite + Tailwind
- [x] Visualización de listas y productos
- [x] Formulario de creación de listas con selector TAX
- [x] Editor completo de productos
- [x] Calculadora de precios en tiempo real
- [x] Upload de imágenes a Supabase Storage
- [x] Gestión de múltiples imágenes por producto
- [x] Modo manual/automático para precio final
- [x] Validaciones completas (cliente y BD)
- [x] Redondeo automático a miles
- [x] Formato de moneda colombiana
- [x] Triggers para cálculos automáticos
- [x] Recálculo selectivo (solo borradores)
- [x] Snapshot al publicar (valores congelados)

---

## 🔄 Decisiones Técnicas Importantes

### 1. TRM y TAX a nivel de Lista (no por producto)
**Razón:** Coherencia económica en cada oferta. Todos los productos de una lista comparten la misma TRM y política de TAX.

### 2. Redondeo a miles (no decenas)
**Cambio realizado en sesión 005**  
**Razón:** Precios en Colombia se manejan mejor en miles (ej: $449,000 en vez de $449,350)

### 3. Triggers en PostgreSQL para cálculos
**Razón:** Garantiza consistencia de datos sin depender del frontend. Los cálculos siempre son correctos.

### 4. Supabase Storage en vez de Base64
**Razón:** 
- Base de datos más liviana (solo URLs)
- CDN optimizado de Supabase
- Mejor performance de carga
- Caché eficiente

### 5. Modo manual/automático para precio final
**Razón:** Por defecto el precio se actualiza automáticamente, pero el admin puede fijarlo manualmente si lo necesita.

### 6. Snapshot al publicar
**Razón:** Una vez publicado, el producto no debe cambiar aunque se modifique TRM/TAX de la lista. Conserva los valores económicos exactos con los que se publicó.

### 7. Recálculo selectivo
**Razón:** Si cambia TRM/TAX de lista, solo se recalculan productos en borrador. Los publicados mantienen su snapshot.

---

## 🐛 Problemas Resueltos Durante el Desarrollo

### 1. Error con Tailwind v4
- **Problema:** Incompatibilidad con PostCSS
- **Solución:** Downgrade a Tailwind v3.4.0

### 2. RLS bloqueando acceso
- **Problema:** Datos no visibles en frontend
- **Solución:** Deshabilitar RLS temporalmente (requiere auth en producción)

### 3. Order of Hooks en React
- **Problema:** Hooks llamados después de return condicional
- **Solución:** Mover todos los hooks antes del `if (!isOpen) return null`

### 4. Precio final no se inicializaba
- **Problema:** Campo quedaba vacío al calcular
- **Solución:** Mover setFormData al final de calcularValores()

### 5. Labels de botones de imagen
- **Problema:** "Tomar Foto" no abría cámara en PC
- **Solución:** Labels descriptivos + mensaje explicativo sobre cámara móvil

---

## 📋 Próximos Pasos (Prioridad Alta)

### 1. Módulo 03: Autenticación de Administradores
**Requerimiento completo en:** `/docs/requirements/03-auth-admin.md`

**Tareas:**
- [ ] Configurar Supabase Auth
- [ ] Crear tabla `administradores` con roles
- [ ] Implementar LoginPage con formulario
- [ ] Proteger rutas `/admin/*` con AuthGuard
- [ ] Gestionar tokens JWT en localStorage
- [ ] Implementar logout
- [ ] Actualizar políticas RLS para requerir auth

### 2. Funcionalidades Pendientes del Módulo 01
- [ ] Editar productos existentes
- [ ] Publicar productos (cambiar estado)
- [ ] Ocultar productos publicados
- [ ] Eliminar productos (solo borradores)
- [ ] Editar listas de oferta
- [ ] Cambiar estado de lista
- [ ] Vista de lista archivada

### 3. Optimizaciones
- [ ] Paginación de productos
- [ ] Búsqueda y filtros
- [ ] Optimización de imágenes (resize automático)
- [ ] Loading states mejorados
- [ ] Manejo de errores más robusto

---

## 🔐 Notas de Seguridad

### Desarrollo Actual (Sin Autenticación)
```sql
-- RLS deshabilitado temporalmente
ALTER TABLE listas_oferta DISABLE ROW LEVEL SECURITY;
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;

-- Storage público
Bucket 'productos-imagenes' → público
```

### Producción (Requiere Autenticación - Módulo 03)
```sql
-- RLS habilitado con políticas por rol
ALTER TABLE listas_oferta ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Solo admins autenticados pueden crear/editar
CREATE POLICY "Admins can manage" ON listas_oferta
FOR ALL USING (auth.role() IN ('admin_full', 'superadmin'));

-- Storage requiere autenticación
Bucket 'productos-imagenes' → privado con políticas auth
```

---

## 📖 Referencias Útiles

### Documentación del Proyecto
- **Requerimientos Módulo 01:** `/docs/requirements/01-productos-calculo-precios.md`
- **Requerimientos Módulo 03:** `/docs/requirements/03-auth-admin.md`
- **Modelo de Datos:** `/docs/architecture/modelo-datos.md`
- **Historial de Sesiones:** `/docs/prompts/session-*.md`

### Documentación Externa
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Comandos SQL Útiles
```sql
-- Ver estructura de tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'listas_oferta';

-- Ver triggers activos
SELECT * FROM pg_trigger WHERE tgname LIKE '%producto%';

-- Ver políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'listas_oferta';

-- Ver imágenes en Storage
SELECT * FROM storage.objects WHERE bucket_id = 'productos-imagenes';

-- Datos de prueba
SELECT l.titulo, COUNT(p.id) as productos, l.trm_lista, l.tax_modo_lista
FROM listas_oferta l
LEFT JOIN productos p ON p.id_lista = l.id
GROUP BY l.id;
```

---

## 🎓 Para Claude: Cómo Usar Este Documento

**Cuando el usuario inicie una nueva conversación:**

1. **Leer este documento primero** para entender el contexto completo
2. **Leer `/docs/prompts/session-*.md`** para ver el historial de desarrollo
3. **Consultar los requerimientos** en `/docs/requirements/` cuando sea necesario
4. **Verificar el estado actual** en los archivos de sesión más recientes

**Lo que debes saber:**
- El proyecto está en desarrollo activo
- Módulo 01 está completado y funcional
- Módulo 03 (Auth) es la siguiente prioridad
- Todas las decisiones técnicas están documentadas
- Hay problemas conocidos resueltos (ver sección de problemas)
- El modelo de datos tiene triggers automáticos importantes

**Lo que NO debes hacer:**
- No sugieras cambios al modelo de datos sin revisar primero el modelo completo
- No ignores las decisiones técnicas ya tomadas (TRM/TAX a nivel lista, redondeo a miles, etc.)
- No cambies la estructura de carpetas sin discutir primero
- No rompas la nomenclatura de archivos de sesiones (session-XXX-descripcion.md)

**Flujo recomendado para continuar:**
1. Pregunta al usuario qué necesita (nueva funcionalidad, bug fix, optimización)
2. Revisa la documentación relevante
3. Propón solución basada en el contexto existente
4. Implementa cambios
5. Actualiza la documentación (crear nueva sesión en `/docs/prompts/`)
6. Actualiza este archivo si hay cambios importantes

---

**Última sesión completada:** Sesión 005 - Editor de Productos Completo  
**Próxima sesión sugerida:** Sesión 006 - Implementación de Autenticación (Módulo 03)
