# Estado del Proyecto: Chic Import USA
## Fecha: 16 de Diciembre de 2024

---

## 📋 Resumen Ejecutivo

Chic Import USA es una PWA de e-commerce para gestión de catálogos de productos importados con cálculos complejos de precios (USD→COP), impuestos, márgenes y descuentos. El sistema incluye módulos de productos, listas, clientes y pedidos, con integración de WhatsApp para compartir productos.

---

## 🏗️ Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend | Next.js 14 (App Router) |
| Estilos | Tailwind CSS |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| Deploy | Vercel |
| Motor de Precios | pricingEngine.js (centralizado) |

---

## ✅ Módulos Completados

### 1. Autenticación
- Login/registro con Supabase Auth
- Protección de rutas admin

### 2. Listas de Productos
- CRUD completo de listas
- Estados: borrador, publicada, cerrada, archivada
- Configuración de TRM, TAX (porcentaje o USD fijo)
- Filtros por estado con contadores

### 3. Productos (UNIFICADO)
- **Una sola página** `/admin/listas/[id]/productos` que muestra TODOS los productos
- Dos modalidades de registro:
  - **Producto Completo**: título, descripción, marca, categoría, imagen
  - **Producto Rápido**: solo precio, descuento e imagen (código auto-generado PROD-XXXX)
- Modal de selección de tipo al agregar
- Cálculos automáticos con motor de precios unificado
- Estados: borrador, publicado
- Filtros por categoría
- Compartir en WhatsApp con imagen promocional

### 4. Clientes
- CRUD completo
- Campos: teléfono (único), nombres, apellidos, email, dirección, ciudad, notas
- Búsqueda por teléfono/nombre

### 5. Pedidos
- Crear pedidos asociados a cliente
- Agregar productos **solo desde la lista de productos** (botón "Agregar a Pedido")
- Modal con búsqueda de pedidos existentes (código, cliente, teléfono)
- Snapshot de precios al momento de agregar
- Estados: nuevo, en_gestion, confirmado, enviado, entregado, cancelado
- Detalle del pedido con items
- Cálculo automático de totales (venta, costo, ganancia)

### 6. Motor de Precios (pricingEngine.js)
- Cálculo centralizado y único
- Fórmulas: precio_base + tax → conversión COP → margen → descuento
- Usado tanto en frontend como en operaciones de BD
- Elimina inconsistencias entre cálculos

---

## 📁 Estructura de Archivos Clave

```
nextjs-app/
├── app/
│   ├── admin/
│   │   ├── listas/
│   │   │   ├── page.js                    # Lista de listas
│   │   │   └── [id]/
│   │   │       └── productos/
│   │   │           └── page.js            # Productos (unificado)
│   │   ├── clientes/
│   │   │   └── page.js                    # CRUD clientes
│   │   └── pedidos/
│   │       ├── page.js                    # Lista de pedidos
│   │       ├── nuevo/
│   │       │   └── page.js                # Crear pedido
│   │       └── [id]/
│   │           └── page.js                # Detalle pedido
│   └── catalogo/
│       └── [id]/
│           └── page.js                    # Catálogo público
├── src/
│   ├── components/
│   │   ├── AdminLayout.js
│   │   └── ModalAgregarAPedido.js         # Modal agregar producto a pedido
│   └── lib/
│       ├── supabase.js
│       └── pricingEngine.js               # Motor de precios
└── public/
```

---

## 🗄️ Esquema de Base de Datos (Supabase)

### Tablas principales:
- **listas**: id, titulo, descripcion, trm_lista, tax_modo_lista, tax_porcentaje_lista, tax_usd_lista, estado
- **productos**: id, id_lista, titulo, marca, categoria, descripcion, imagenes[], precio_base_usd, margen_porcentaje, costo_total_usd, costo_total_cop, precio_sugerido_cop, precio_final_cop, valor_producto_cop, ganancia_cop, estado
- **clientes**: id, telefono (único), nombres, apellidos, email, direccion, ciudad, notas
- **pedidos**: id, codigo_pedido, cliente_id, lista_oferta_id, estado_pedido, fecha_solicitud, fecha_probable_envio, fecha_entrega, total_items, total_venta_cop, total_costo_cop, total_ganancia_cop, notas_internas
- **pedido_items**: id, pedido_id, producto_id, lista_oferta_id, titulo_articulo, cantidad, precio_venta_cop, costo_cop, ganancia_cop (GENERATED), talla, genero, descripcion_detallada, fue_encontrado, estado_item

### Columnas generadas:
- `pedido_items.ganancia_cop` = GENERATED ALWAYS AS (precio_venta_cop - costo_cop)

---

## 🔄 Flujos Principales

### Flujo de Pedidos:
1. Usuario va a Lista de Productos publicada
2. Click en "Agregar a Pedido" en un producto publicado
3. Modal muestra opciones:
   - **A) Pedido existente**: Buscar por código/cliente/teléfono → Seleccionar → Agregar
   - **B) Nuevo pedido**: Buscar/crear cliente → Crear pedido → Agregar producto
4. Se guarda snapshot del producto (precio congelado)
5. En detalle del pedido se pueden gestionar items (cantidad, estado)

### Flujo de Productos:
1. Crear Lista con TRM y TAX
2. Ir a Productos de la lista
3. Click "Agregar Producto" → Modal pregunta tipo
4. Completo: llenar formulario detallado
5. Rápido: solo precio, descuento e imagen
6. Producto se guarda con todos los cálculos
7. Publicar producto para que aparezca en catálogo

---

## 🔧 Correcciones Recientes (Sesión Actual)

1. **Unificación de Productos**: Eliminada página separada de productos-rapidos, todo en una sola vista
2. **Modal de tipo**: Al agregar producto, modal pregunta si Completo o Rápido
3. **Búsqueda de pedidos**: Modal de agregar a pedido permite buscar por código, cliente o teléfono
4. **Error ganancia_cop**: Corregido error de columna generada al insertar pedido_items
5. **Botón agregar eliminado**: En detalle de pedido, eliminado botón de agregar artículos (solo se agregan desde productos)
6. **Fix Vercel**: useSearchParams envuelto en Suspense boundary

---

## 📝 Pendientes / Mejoras Futuras

- [ ] Dashboard con métricas y estadísticas
- [ ] Reportes de ventas y ganancias
- [ ] Notificaciones de pedidos
- [ ] Historial de cambios de precio
- [ ] Exportar catálogo a PDF
- [ ] Integración con pasarela de pagos
- [ ] App móvil nativa

---

## 🚀 Comandos de Deploy

```bash
# Desarrollo local
cd nextjs-app
npm run dev

# Build producción
npm run build

# Deploy (automático en Vercel al push a main)
git add .
git commit -m "descripción del cambio"
git push origin main
```

---

## 📞 Contacto del Proyecto

- **Desarrollador**: Hector
- **Repositorio**: GitHub (privado)
- **Producción**: Vercel

