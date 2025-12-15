# 📋 ESTADO ACTUAL DEL PROYECTO - CHIC IMPORT USA
## Actualizado: Diciembre 14, 2025

---

## 🎯 DESCRIPCIÓN DEL PROYECTO

**Chic Import USA** es una plataforma PWA (Progressive Web App) para gestión de productos importados desde Estados Unidos. Permite a administradores crear listas de productos con cálculos automáticos de precios (TRM, TAX, márgenes) y compartirlos por WhatsApp con clientes.

---

## 🔗 URLs DE PRODUCCIÓN

- **Aplicación:** https://chicimportusa.com
- **Supabase Dashboard:** https://supabase.com/dashboard/project/[PROJECT_ID]
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Repositorio:** ~/Documents/pwa-import-marketplace/nextjs-app

---

## 🛠️ STACK TECNOLÓGICO

| Tecnología | Versión/Detalle | Uso |
|------------|-----------------|-----|
| **Next.js** | 14.x (App Router) | Framework principal |
| **React** | 18.x | UI Components |
| **Supabase** | Cloud | Auth + Database + Storage |
| **Tailwind CSS** | 3.x | Estilos |
| **Vercel** | Cloud | Hosting + Deploy |

---

## 📁 ESTRUCTURA DEL PROYECTO

```
nextjs-app/
├── app/
│   ├── admin/
│   │   ├── page.js                    # Dashboard admin
│   │   └── listas/
│   │       ├── page.js                # Lista de listas
│   │       └── [id]/
│   │           ├── page.js            # Detalle de lista
│   │           ├── productos/
│   │           │   └── page.js        # Productos Normales ✅
│   │           └── productos-rapidos/
│   │               └── page.js        # Productos Rápidos ✅
│   ├── catalogo/
│   │   └── [slug]/
│   │       └── page.js                # Catálogo público
│   ├── producto/
│   │   └── [id]/
│   │       └── page.js                # Detalle producto público (Open Graph)
│   ├── auth/
│   │   └── page.js                    # Login
│   ├── layout.js                      # Layout principal
│   └── page.js                        # Home
├── components/
│   ├── AdminLayout.js                 # Layout admin con sidebar
│   └── ...
├── lib/
│   ├── supabase.js                    # Cliente Supabase
│   └── pricingEngine.js               # Motor de cálculo de precios ✅
└── public/
    └── logo.jpg
```

---

## 🗄️ BASE DE DATOS (SUPABASE)

### Tabla: `listas_oferta`
```sql
- id (uuid, PK)
- titulo (text)
- descripcion (text)
- slug (text, unique)
- estado (text: 'borrador' | 'publicada' | 'cerrada')
- trm_lista (numeric)           -- Tasa de cambio USD→COP
- tax_modo_lista (text)         -- 'porcentaje' | 'fijo'
- tax_porcentaje_lista (numeric)
- tax_usd_lista (numeric)
- created_at (timestamp)
- updated_at (timestamp)
```

### Tabla: `productos`
```sql
- id (uuid, PK)
- id_lista (uuid, FK → listas_oferta)
- titulo (text)
- descripcion (text)
- marca (text)
- categoria (text)
- imagenes (text[])             -- Array de URLs
- estado (text)                 -- Siempre 'publicado' ahora

-- Inputs del usuario
- precio_base_usd (numeric)
- margen_porcentaje (numeric)

-- Calculados por pricingEngine.js
- costo_total_usd (numeric)
- costo_total_cop (numeric)
- precio_sugerido_cop (numeric)  -- Precio sin descuento
- valor_producto_cop (numeric)   -- = precio_sugerido (para mostrar tachado)
- precio_final_cop (numeric)     -- Precio real de venta
- ganancia_cop (numeric)

-- Tracking WhatsApp
- veces_compartido (integer)
- ultimo_compartido (timestamp)

- created_at (timestamp)
- updated_at (timestamp)
```

### Tabla: `clientes` ⚠️ CREADA PERO NO IMPLEMENTADA EN UI
```sql
- id (uuid, PK)
- nombre (text)
- telefono (text)
- email (text)
- notas (text)
- created_at (timestamp)
```

### Tabla: `pedidos` ⚠️ CREADA PERO NO IMPLEMENTADA EN UI
```sql
- id (uuid, PK)
- codigo (text, unique)         -- PED-XXXX
- id_cliente (uuid, FK → clientes)
- estado (text)
- total (numeric)
- notas (text)
- created_at (timestamp)
```

### Tabla: `pedido_items` ⚠️ CREADA PERO NO IMPLEMENTADA EN UI
```sql
- id (uuid, PK)
- id_pedido (uuid, FK → pedidos)
- id_producto (uuid, FK → productos)
- cantidad (integer)
- precio_unitario (numeric)
- subtotal (numeric)
```

---

## ⚙️ MOTOR DE PRECIOS (pricingEngine.js)

### Ubicación
`/lib/pricingEngine.js`

### Funciones Exportadas
```javascript
// Función principal de cálculo
calculatePricing(input) → resultado

// Helper para crear input desde lista y datos de formulario
crearPricingInput({ lista, precio_base_usd, margen_porcentaje, descuento_porcentaje, precio_final_manual_cop })

// Formateador de moneda
formatearCOP(valor) → "$1.234.567"
```

### Fórmula de Cálculo
```
1. precio_con_tax_usd = precio_base_usd + TAX
2. costo_total_usd = precio_con_tax_usd × (1 - descuento/100)
3. costo_total_cop = costo_total_usd × TRM
4. precio_sugerido_cop = costo_total_cop × (1 + margen/100)
5. valor_producto_cop = precio_sugerido_cop (sin descuento, para mostrar tachado)
6. precio_final_cop = valor_producto_cop × (1 - descuento/100)
7. ganancia_cop = precio_final_cop - costo_total_cop
```

### Importante
- El descuento se aplica al **precio de venta** (valor_producto_cop → precio_final_cop)
- NO se aplica al costo
- `valor_producto_cop` es el precio "antes del descuento" que se muestra tachado

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 1. Gestión de Listas
- [x] CRUD completo de listas de oferta
- [x] Configuración de TRM y TAX por lista
- [x] Estados: borrador, publicada, cerrada
- [x] Slug único para URLs públicas

### 2. Productos Normales (`/admin/listas/[id]/productos`)
- [x] CRUD completo con título, marca, categoría, descripción
- [x] Cálculo automático con pricingEngine.js
- [x] Campo de descuento (%)
- [x] Imagen al final del formulario (después de cálculos)
- [x] Productos se crean como "publicado" directamente
- [x] Botones: Editar, Eliminar, Compartir WhatsApp

### 3. Productos Rápidos (`/admin/listas/[id]/productos-rapidos`)
- [x] Creación simplificada (solo precio + imagen)
- [x] Código automático PROD-XXXX
- [x] Cálculo automático con pricingEngine.js
- [x] Campo de descuento (%)
- [x] Imagen al final del formulario
- [x] Productos se crean como "publicado" directamente
- [x] Botones: Editar, Eliminar, Compartir WhatsApp
- [x] Contador de veces compartido

### 4. Compartir por WhatsApp
- [x] Generación de imagen tipo ficha con Canvas
- [x] Badge de descuento rojo (-X%)
- [x] Precio tachado + precio con descuento
- [x] Texto "🔥 Ahorras $XXX"
- [x] Productos Normales: Bloque azul + info completa
- [x] Productos Rápidos: Bloque naranja + solo precios
- [x] Fallback a descarga si no hay soporte de share

### 5. Catálogo Público
- [x] Vista pública de productos por lista
- [x] Open Graph meta tags para preview en WhatsApp
- [x] Detalle de producto con imagen y precio

### 6. Autenticación
- [x] Login con Supabase Auth
- [x] Protección de rutas admin
- [x] Logout

---

## ❌ FUNCIONALIDADES NO IMPLEMENTADAS

### 1. Módulo de Clientes y Pedidos
- [ ] UI para gestión de clientes
- [ ] UI para crear/editar pedidos
- [ ] Asignación de productos a pedidos
- [ ] Estados de pedido (pendiente, confirmado, enviado, entregado)
- [ ] Historial de pedidos por cliente
- [ ] Código automático de pedidos (PED-XXXX)

**Nota:** Las tablas `clientes`, `pedidos` y `pedido_items` YA EXISTEN en la base de datos pero NO hay interfaz de usuario para gestionarlas.

### 2. Otras Funcionalidades Pendientes
- [ ] Dashboard con métricas/estadísticas
- [ ] Reportes de ventas
- [ ] Notificaciones
- [ ] Búsqueda global de productos
- [ ] Exportar catálogo a PDF
- [ ] Múltiples usuarios admin

---

## 🎨 CATEGORÍAS Y MARCAS

### Categorías Disponibles
```javascript
const CATEGORIAS = [
  { value: 'calzado', label: 'Calzado', icon: '👟' },
  { value: 'ropa', label: 'Ropa', icon: '👕' },
  { value: 'tecnologia', label: 'Tecnología', icon: '📱' },
  { value: 'hogar', label: 'Hogar', icon: '🏠' },
  { value: 'deportes', label: 'Deportes', icon: '⚽' },
  { value: 'belleza', label: 'Belleza', icon: '💄' },
  { value: 'juguetes', label: 'Juguetes', icon: '🧸' },
  { value: 'otros', label: 'Otros', icon: '📦' }
]
```

### Marcas
Array `MARCAS` con ~90 marcas organizadas por tipo (Nike, Adidas, Apple, Samsung, etc.)

---

## 🔧 VARIABLES DE ENTORNO

### Archivo: `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
NEXT_PUBLIC_SITE_URL=https://chicimportusa.com
```

---

## 📝 COMANDOS ÚTILES

```bash
# Desarrollo
cd ~/Documents/pwa-import-marketplace/nextjs-app
npm run dev

# Build
npm run build

# Git
git add .
git commit -m "mensaje"
git push

# Logs de Vercel
vercel logs
```

---

## 🚀 PRÓXIMOS PASOS SUGERIDOS

### Prioridad Alta
1. **Implementar módulo de Clientes y Pedidos**
   - Crear página `/admin/clientes`
   - Crear página `/admin/pedidos`
   - CRUD completo con las tablas existentes

### Prioridad Media
2. Dashboard con métricas básicas
3. Búsqueda de productos
4. Filtros avanzados en catálogo

### Prioridad Baja
5. Exportar a PDF
6. Notificaciones push
7. Múltiples roles de usuario

---

## 📞 INFORMACIÓN DE CONTACTO

**Proyecto:** Chic Import USA  
**Desarrollador:** Hector Cuervo  
**Última actualización:** Diciembre 14, 2025

---

## 💡 NOTAS PARA CHATGPT

Al continuar el desarrollo, ten en cuenta:

1. **pricingEngine.js** es la ÚNICA fuente de verdad para cálculos de precios
2. Los productos se crean directamente como **"publicado"** (sin flujo de estados)
3. El campo **valor_producto_cop** es el precio SIN descuento (para mostrar tachado)
4. El campo **precio_final_cop** es el precio REAL de venta
5. Las tablas de clientes/pedidos EXISTEN pero NO tienen UI
6. El proyecto usa **Next.js App Router** (NO Pages Router)
7. Supabase maneja auth, database y storage de imágenes
