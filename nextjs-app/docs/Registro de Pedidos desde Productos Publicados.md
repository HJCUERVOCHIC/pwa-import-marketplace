# ESPECIFICACIÓN – Registro de Pedidos desde Productos Publicados
Módulo: Clientes y Pedidos  
Proyecto: Chic Import USA  
Versión: 1.0

## 1. Objetivo

Definir el comportamiento funcional y técnico para el **registro de pedidos a partir de productos publicados**, garantizando que:

- Los pedidos SOLO se puedan crear a partir de **artículos existentes**.
- Los artículos SOLO puedan adicionarse si pertenecen a **listas publicadas** y su estado es **publicado**.
- El flujo sea simple para el usuario admin: desde el listado de productos se puede crear o actualizar un pedido sin reprocesos.
- La información del producto se reutilice automáticamente para diligenciar el detalle del pedido.

---

## 2. Regla principal (no negociable)

> **NO se pueden crear pedidos ni ítems de pedido para artículos que no existan en la base de datos o que no estén publicados.**

Esto implica:

- ❌ No se permite crear pedidos “manuales” con texto libre de producto.
- ❌ No se permite agregar ítems que no provengan de una lista publicada.
- ❌ No se permite agregar productos en estado distinto de `publicado`.

---

## 3. Alcance funcional

Esta funcionalidad aplica a:

- **Productos normales**
- **Productos rápidos**

Siempre que cumplan:
- Lista asociada en estado `publicada`
- Producto en estado `publicado`

---

## 4. Punto de entrada (UI)

### 4.1 Ubicación del botón

En las siguientes vistas:
- `/admin/listas/[id]/productos`
- `/admin/listas/[id]/productos-rapidos`

Para cada producto publicado, agregar un botón:

**Texto sugerido:**  
`➕ Agregar a pedido`

---

## 5. Comportamiento del botón “Agregar a pedido”

Al presionar el botón sobre un producto publicado:

### Paso 1 – Validaciones automáticas
El sistema debe validar inmediatamente:

- El producto existe en la tabla `productos`.
- El producto tiene `estado = 'publicado'`.
- La lista asociada tiene `estado = 'publicada'`.

Si alguna validación falla:
- Mostrar mensaje de error.
- No permitir continuar.

---

### Paso 2 – Selección de pedido

El sistema debe permitir dos opciones claras:

#### Opción A: Agregar a pedido existente
- Mostrar un selector/listado de pedidos **activos**:
  - Estados permitidos: `nuevo`, `en_gestion`, `confirmado`
  - Excluir pedidos `cancelado` o `entregado`
- El usuario selecciona un pedido existente.
- El producto se agrega como nuevo `pedido_item`.

#### Opción B: Crear nuevo pedido
- Si no existe un pedido o el usuario lo prefiere:
  - Permitir crear un pedido nuevo.
- Flujo:
  1. Seleccionar o crear cliente (por teléfono).
  2. Crear pedido con estado inicial `nuevo`.
  3. Agregar automáticamente el producto como primer ítem.

---

## 6. Creación del ítem del pedido (pedido_items)

Al agregar un producto a un pedido (nuevo o existente), el sistema debe:

### 6.1 Datos que se toman automáticamente del producto

Desde la tabla `productos`:

- `producto_id`
- `titulo` → `titulo_articulo`
- `precio_final_cop` → `precio_venta_cop`
- `costo_total_cop` → `costo_cop`
- `ganancia_cop` → cálculo base (puede recalcularse)
- `id_lista` → `lista_oferta_id`

Estos valores se guardan como **snapshot** (no deben cambiar si el producto se edita luego).

---

### 6.2 Datos iniciales del ítem

Al momento de crear el `pedido_item`:

- `cantidad` = 1 (por defecto)
- `fue_encontrado` = false
- `estado_item` = 'solicitado'
- `created_at` = now()

---

### 6.3 Campos adicionales (opcionales, editables en UI)

Estos campos **NO son obligatorios al crear el ítem**, se completan posteriormente desde la pantalla del pedido:

- `talla`
- `genero` (hombre, mujer, unisex, niños)
- `descripcion_detallada`
- `cantidad` (puede modificarse)
- `estado_item`
- `fue_encontrado`

---

## 7. Comportamiento si el producto ya existe en el pedido

Si el producto que se intenta agregar **ya existe** como ítem en el pedido:

Opciones recomendadas (definir una y aplicarla consistentemente):

### Opción recomendada
- Mostrar mensaje:
  > “Este producto ya existe en el pedido. ¿Deseas aumentar la cantidad?”
- Si el usuario confirma:
  - Incrementar `cantidad`.
- Si cancela:
  - No hacer cambios.

---

## 8. Integración con Clientes

### 8.1 Pedido nuevo
Si se crea un pedido nuevo:
- Se debe:
  - Seleccionar cliente existente por teléfono
  - O crear cliente nuevo (solo teléfono obligatorio)
- El pedido se crea con:
  - `estado = 'nuevo'`
  - `fecha_solicitud = now()`

### 8.2 Pedido existente
Si se usa un pedido existente:
- NO se modifica el cliente.
- NO se reinicia estado ni fechas.

---

## 9. Restricciones importantes

- ❌ No se pueden crear pedidos sin cliente.
- ❌ No se pueden agregar ítems sin producto_id.
- ❌ No se pueden agregar productos de listas cerradas o en borrador.
- ❌ No se pueden agregar productos no publicados.

---

## 10. Uso obligatorio del pricingEngine

- Los valores `precio_venta_cop`, `costo_cop` y `ganancia_cop` deben provenir:
  - Del producto ya calculado con `pricingEngine`.
- No recalcular precios manualmente en pedidos.
- El pedido trabaja con **snapshots**, no con valores dinámicos.

---

## 11. Resultado esperado

Al finalizar la implementación:

- Desde cualquier lista publicada, el admin puede:
  - Crear un pedido con 1 clic desde un producto.
  - Agregar productos adicionales a pedidos existentes.
- Todos los pedidos:
  - Se componen exclusivamente de productos reales y publicados.
  - Tienen consistencia de precios y costos.
- Se elimina completamente la posibilidad de pedidos “manuales” inconsistentes.

---

**Fin de la especificación**
