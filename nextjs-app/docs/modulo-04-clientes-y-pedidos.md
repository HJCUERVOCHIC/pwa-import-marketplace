# MÓDULO 04 – Gestión de Clientes y Toma de Pedidos

## Objetivo del módulo
Implementar un módulo interno (solo para usuarios autenticados en `/admin`) que permita:

- Gestionar clientes internos, donde la llave funcional principal es el número de celular.
- Crear y administrar pedidos por cliente, cada uno con uno o varios artículos.
- Guardar para cada artículo: precio de venta ofertado, costo del producto, estado de “fue encontrado”, y datos adicionales (talla, género, descripción).
- Registrar fechas clave del pedido: fecha de solicitud, fecha probable de envío y fecha de entrega.
- Integrarse con las tablas existentes de listas y productos para obtener precios y costos al momento del pedido.

---

# 1. Tablas nuevas en Supabase

## 1.1 Tabla `clientes`

```sql
create table clientes (
  id uuid primary key default gen_random_uuid(),
  telefono text not null unique,
  nombres text,
  apellidos text,
  alias_whatsapp text,
  canal_preferido text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**Reglas**
- `telefono` es obligatorio y único.
- `nombres`, `apellidos` y `alias_whatsapp` son opcionales.

---

## 1.2 Tabla `pedidos`

```sql
create table pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo_pedido text,
  cliente_id uuid not null references clientes(id) on delete restrict,
  estado_pedido text not null default 'nuevo',
  fecha_solicitud timestamptz not null default now(),
  fecha_probable_envio timestamptz,
  fecha_entrega timestamptz,
  lista_oferta_id uuid references listas_oferta(id),
  canal_entrada text,
  vendedor_user_id uuid,
  total_items integer,
  total_venta_cop numeric,
  total_costo_cop numeric,
  total_ganancia_cop numeric,
  notas_internas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**Estados sugeridos**  
`nuevo`, `en_gestion`, `confirmado`, `en_compra`, `en_transito`, `entregado`, `cancelado`

---

## 1.3 Tabla `pedido_items`

```sql
create table pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  producto_id uuid references productos(id),
  lista_oferta_id uuid references listas_oferta(id),
  titulo_articulo text not null,
  cantidad integer not null default 1,
  precio_venta_cop numeric not null,
  costo_cop numeric not null,
  ganancia_cop numeric,
  fue_encontrado boolean not null default false,
  talla text,
  genero text,
  descripcion_detallada text,
  estado_item text default 'solicitado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**Estados sugeridos**  
`solicitado`, `en_busqueda`, `encontrado`, `no_encontrado`, `comprado`, `entregado`, `cancelado`

---

# 2. Reglas funcionales y de negocio

## Clientes
- Se requiere únicamente `telefono` para crear un cliente.
- Los demás campos son opcionales.
- El teléfono es la llave funcional principal.

## Pedidos
- Cada pedido pertenece a un cliente.
- `fecha_solicitud` se registra automáticamente.
- `fecha_probable_envio` y `fecha_entrega` son opcionales.
- Si se define `fecha_entrega`, puede actualizar automáticamente `estado_pedido = 'entregado'`.

## Ítems del pedido
- Un pedido puede tener 1 o varios ítems.
- Al seleccionar un producto desde `productos`, se debe copiar:
  - `precio_final_cop` → `precio_venta_cop`
  - `costo_total_cop` → `costo_cop`
- Los valores del producto deben guardarse como **snapshot**.
- Usuario puede modificar: precio de venta, cantidad, talla, género y descripción.
- Artículo puede marcarse como `fue_encontrado`.

## Totales del pedido
- `total_items` = suma de cantidades.
- `total_venta_cop` = suma de precio_venta * cantidad.
- `total_costo_cop` = suma de costo_cop * cantidad.
- `total_ganancia_cop` = diferencia entre venta y costo.
- Se pueden recalcular automáticamente cuando cambian los ítems.

---

# 3. Flujos funcionales

## Flujo A: Crear o seleccionar cliente
1. Abrir `/admin/pedidos/nuevo`.
2. Buscar cliente por teléfono o alias.
3. Si no existe, formulario mínimo: teléfono + campos opcionales.
4. Crear o seleccionar cliente.
5. Crear nuevo pedido asociado.

---

## Flujo B: Crear pedido
1. Crear registro en `pedidos`:
   - `estado_pedido = 'nuevo'`
   - `fecha_solicitud = now()`
2. Redirigir al detalle del pedido.

---

## Flujo C: Agregar artículos
1. Buscar productos por nombre, categoría o lista.
2. Al seleccionar un producto:
   - `precio_final_cop` → `precio_venta_cop`
   - `costo_total_cop` → `costo_cop`
3. Usuario puede modificar: precio de venta, cantidad, talla, género y descripción.
4. Guardar ítem en `pedido_items`.
5. Recalcular totales del pedido.

---

## Flujo D: Marcar como encontrado
- Cada ítem tiene un toggle `fue_encontrado`.
- También puede actualizarse `estado_item`.

---

## Flujo E: Actualizar fechas
- Usuario puede editar:
  - `fecha_probable_envio`
  - `fecha_entrega`
- Si se define `fecha_entrega`, se puede actualizar `estado_pedido = 'entregado'`.

---

# 4. Rutas y vistas sugeridas en Next.js

## /admin/clientes
- Listado de clientes
- Buscador
- Crear cliente
- Editar cliente

## /admin/pedidos
- Listado de pedidos
- Filtros por estado, fecha y cliente

## /admin/pedidos/nuevo
- Flujo de selección/creación de cliente
- Creación del pedido

## /admin/pedidos/[id]
- Detalle del pedido:
  - Datos del cliente
  - Fechas del pedido
  - Estado del pedido
  - Totales calculados
  - Lista de artículos
  - Botón para agregar artículo

## /admin/pedidos/[id]/add-item
- Búsqueda y selección de productos
- Formulario de creación del ítem

---

# 5. Comportamientos especiales
- Los snapshots de precio y costo no cambian aunque el producto se actualice.
- No se deben crear clientes duplicados por teléfono.
- Al eliminar un pedido, deben eliminarse sus ítems asociados (on delete cascade).
- Cada pedido debe generar un código legible, por ejemplo: `P-2025-0001`.

---

# 6. Elementos opcionales
- Campo `canal_entrada` en pedidos.
- Campo `vendedor_user_id` para saber qué usuario gestionó el pedido.
- Más estados de ítem y pedido si se desea un flujo logístico más completo.

---

**Fin del documento.**
