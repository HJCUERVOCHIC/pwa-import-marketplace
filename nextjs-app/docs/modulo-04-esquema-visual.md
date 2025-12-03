# MÓDULO 04 – Esquema visual de Clientes y Toma de Pedidos

> Este documento define el ESQUEMA VISUAL (layout, componentes y navegación) del módulo de Clientes y Pedidos dentro del área `/admin`, coherente con el diseño actual del panel administrativo de Chic Import USA (Next.js + Tailwind + paleta azul elegante).

---

## 1. Principios de diseño

- Reutilizar el **shell de admin** existente:
  - Barra lateral izquierda con navegación principal.
  - Header superior con título de página y acciones.
  - Contenido principal en un layout tipo “card” centrado.
- Usar la **paleta actual**:
  - Azul elegante para headers y botones principales.
  - Gris suave para textos secundarios y bordes.
  - Verde/estado para etiquetas de éxito (por ejemplo entregado).
- Mantener estilo **limpio y legible**, optimizado para uso en escritorio y móvil.
- Componentes principales:
  - Cards
  - Tablas responsivas
  - Formularios en paneles o modales
  - Badges para estados

---

## 2. Vista: Listado de Clientes (`/admin/clientes`)

### 2.1. Estructura general

- **Header página (zona superior)**  
  - Título: `Clientes`  
  - Subtítulo pequeño: `Gestión de clientes para toma de pedidos`  
  - Botón principal a la derecha: `+ Nuevo cliente` (botón azul)

- **Zona de filtros/búsqueda (debajo del header)**  
  - Input de texto ancho con placeholder: `Buscar por teléfono, nombre o alias…`  
  - El buscador debe filtrar en vivo por:
    - `telefono`
    - `nombres`
    - `apellidos`
    - `alias_whatsapp`

- **Tabla de clientes (contenido principal)**  
  Columnas recomendadas:
  - Teléfono (columna principal)
  - Nombre completo (concatenar nombres + apellidos, si existen)
  - Alias WhatsApp
  - Canal preferido (si se usa)
  - Fecha de creación (formato corto)
  - Columna de acciones:
    - Botón pequeño `Ver / Editar`
    - Botón pequeño `Ver pedidos` (abre `/admin/pedidos` filtrado por ese cliente, opcional)

- **Comportamiento en móvil**
  - La tabla se simplifica a cards apiladas:
    - Fila 1: Teléfono (negrita)  
    - Fila 2: Nombre/Alias  
    - Fila 3: Canal preferido + fecha  
    - Fila 4: botones de acción (`Ver / Editar`, `Ver pedidos`)

### 2.2. Formulario "Nuevo cliente" / "Editar cliente"

- Puede ser:
  - Un **modal centrado**  
  - o una **subpágina** `/admin/clientes/nuevo` (cualquiera de las dos es válida)

**Campos visuales:**
- Teléfono (input obligatorio, etiqueta clara)
- Nombres (input opcional)
- Apellidos (input opcional)
- Alias WhatsApp (input opcional)
- Canal preferido (select opcional: WhatsApp, Instagram, Referido, Otro)
- Notas (textarea)

**Acciones:**
- Botón principal: `Guardar`
- Botón secundario: `Cancelar` (cerrar modal / volver atrás)

---

## 3. Vista: Listado de Pedidos (`/admin/pedidos`)

### 3.1. Estructura general

- **Header página**
  - Título: `Pedidos`
  - Subtítulo: `Seguimiento de pedidos por cliente`
  - Botón principal a la derecha: `+ Nuevo pedido`

- **Zona de filtros**
  - Filtro por estado:
    - Dropdown o chips: `Todos`, `Nuevo`, `En gestión`, `Confirmado`, `En compra`, `En tránsito`, `Entregado`, `Cancelado`
  - Filtro por fecha (rango):
    - Desde / Hasta (datepickers)
  - Filtro por cliente:
    - Input de búsqueda por teléfono o nombre (similar a clientes)

- **Tabla de pedidos**
  Columnas recomendadas:
  - Código pedido (`codigo_pedido`)
  - Cliente (teléfono + alias o nombre)
  - Estado del pedido (badge de color)
  - Fecha de solicitud
  - Total venta (COP)
  - Total ganancia (COP)
  - Canal entrada (si se usa)
  - Columna de acciones:
    - Botón `Ver detalle`

- **Badges de estado**
  - `nuevo` → gris
  - `en_gestion` → azul suave
  - `confirmado` → azul fuerte
  - `en_compra` → naranja
  - `en_transito` → amarillo/ámbar
  - `entregado` → verde
  - `cancelado` → rojo/gris oscuro

### 3.2. Comportamiento en móvil

- Tabla se convierte en cards:
  - Línea 1: Código pedido + estado (badge)
  - Línea 2: Cliente (teléfono / alias)
  - Línea 3: Fecha solicitud + total venta
  - Línea 4: Canal + botones (`Ver detalle`)

---

## 4. Flujo visual: Crear nuevo pedido (`/admin/pedidos/nuevo`)

### 4.1. Paso 1 – Selección o creación de cliente

Pantalla con dos secciones principales:

1. **Buscador de cliente existente**
   - Input text: `Buscar cliente por teléfono, nombre o alias…`
   - Lista de resultados (similar a cards pequeños o tabla compacta):
     - Teléfono
     - Nombre / Alias
     - Botón `Seleccionar`

2. **Bloque “Crear nuevo cliente”**
   - Título pequeño: `¿No encuentras el cliente?`
   - Botón: `+ Registrar nuevo cliente`
   - Al pulsar:
     - O abre un modal con el formulario de cliente
     - O navega a una subvista que luego devuelve aquí con el cliente listo

Una vez seleccionado o creado el cliente, la UI muestra:

- Card informativa del cliente elegido:
  - Teléfono
  - Nombre / Alias
  - Notas (si existen)
  - Un icono para ver/editar cliente en una nueva pestaña o modal

- Botón grande centrado: `Crear pedido para este cliente`

### 4.2. Resultado del flujo

- Al presionar `Crear pedido para este cliente`:
  - Se crea el pedido en backend.
  - La UI redirige a: `/admin/pedidos/[id]` (vista de detalle del pedido).

---

## 5. Vista: Detalle de Pedido (`/admin/pedidos/[id]`)

Esta es la vista PRINCIPAL de trabajo del vendedor.

### 5.1. Layout sugerido (desktop)

Diseño en 2 secciones verticales principales:

1. **Sección superior: Información del pedido y del cliente**
2. **Sección inferior: Lista de artículos del pedido (pedido_items)**

Se puede plantear así:

---

#### 5.1.1. Cabecera del pedido

En la parte superior:

- Izquierda:
  - Título: `Pedido P-2025-0001` (usar `codigo_pedido` o `id`)
  - Subtítulo: `Cliente: +57 300 000 0000 (Alias o Nombre si existe)`

- Derecha:
  - Dropdown o select de `estado_pedido` (editable)
  - Botón secundario: `Volver a pedidos`
  - Botón con icono: `Más opciones` (para futuro: duplicar, exportar, etc.)

---

#### 5.1.2. Bloque de información del pedido (card)

Card con 2 columnas (en móvil pasa a una sola):

- **Columna 1 – Fechas**
  - Fecha de solicitud (datepicker o texto con icono de calendario)
  - Fecha probable de envío (datepicker editable)
  - Fecha de entrega (datepicker editable)

- **Columna 2 – Resumen económico**
  - Total items (badge con número)
  - Total venta COP (texto destacado en azul)
  - Total costo COP (texto normal)
  - Total ganancia COP (texto en verde)

Debajo, una línea con:

- Campo `canal_entrada` (select)
- `vendedor_user_id` mostrado como “Vendedor: [nombre usuario]” (si se gestiona).

---

#### 5.1.3. Bloque de información del cliente (card)

Otra card, justo debajo o a la derecha en layouts amplios:

- Teléfono (en grande, clickeable para copiar)
- Nombre y apellidos (si existen)
- Alias WhatsApp
- Canal preferido
- Notas internas (texto pequeño)

Botón pequeño tipo link: `Ver ficha de cliente` → `/admin/clientes` (filtro/edición).

---

### 5.2. Lista de artículos del pedido (sección inferior)

Card grande con título: `Artículos del pedido`.

#### 5.2.1. Barra superior de la sección

- Botón principal `+ Agregar artículo`
- Opcional: pequeño texto con contador: `3 artículos (2 encontrados, 1 pendiente)`

#### 5.2.2. Visualización de artículos

**En desktop** se sugiere una tabla con filas y columnas:

Columnas:

1. **Producto / Título**
   - Muestra:
     - `titulo_articulo` (texto principal)
     - Debajo, pequeño: `ID producto: XXX` (si `producto_id` no es null)
     - Debajo: `Lista: [nombre lista]` (si viene de `lista_oferta`)

2. **Datos adicionales**
   - Talla (texto: `M`, `8 US`, etc.)
   - Género (badge: `Hombre`, `Mujer`, `Unisex`, `Niños`)
   - Descripción (truncada con tooltip o ver más)

3. **Estado**
   - Switch / checkbox `Encontrado` vinculado a `fue_encontrado`
   - Badge para `estado_item` (`solicitado`, `en_busqueda`, `encontrado`, etc.)

4. **Cantidad**
   - Campo numérico (pequeño) editable

5. **Precio / Costo / Ganancia**
   - Precio venta unidad
   - Costo unidad
   - Ganancia unidad (o total por cantidad)
   - Visual: precio y ganancia pueden ir en texto destacado.

6. **Acciones**
   - Icono `Editar`
   - Icono `Eliminar` con confirmación

**En móvil**, cada ítem se ve como una card vertical:

- Línea 1: Título artículo
- Línea 2: Talla + Género + Estado (badges)
- Línea 3: Precio venta / Costo / Ganancia
- Línea 4: Toggle “Encontrado” + Cantidad
- Línea 5: Botones `Editar` y `Eliminar`

---

## 6. Vista: Agregar/Editar Artículo (modal o subpágina)

### 6.1. Comportamiento

Desde la vista de detalle del pedido:

- Al presionar `+ Agregar artículo`:
  - O se abre un modal de pantalla central
  - O se navega a `/admin/pedidos/[id]/add-item`

### 6.2. Estructura visual del formulario

Sección superior: **Selector de producto**

- Input de búsqueda: `Buscar producto por nombre, marca o categoría…`
- Dropdown filtrable con resultados:
  - Nombre producto
  - Marca
  - Lista oferta
  - Precio final COP actual

También debe permitir:

- Seleccionar un producto y cargar automáticamente:
  - `precio_venta_cop` con `precio_final_cop`
  - `costo_cop` con `costo_total_cop`

Opcionalmente, permitir:

- Botón `Agregar artículo manual` (sin `producto_id`), mostrando campos de texto libre.

---

Sección media: **Datos del artículo**

Campos:

- Título artículo (prellenado si viene de producto)
- Cantidad
- Precio venta COP (editable)
- Costo COP (editable, aunque por defecto viene del producto)
- Talla
- Género (select: Hombre, Mujer, Unisex, Niños)
- Descripción detallada (textarea)
- Estado ítem (select con valores sugeridos)

Sección inferior:

- Checkbox: `Artículo encontrado` (fue_encontrado)
- Botón principal: `Guardar`
- Botón secundario: `Cancelar`

---

## 7. Consideraciones de UX

- Siempre mantener visible de alguna forma el **cliente** y el **código de pedido** en la parte superior de la pantalla de detalle.
- Mantener coherencia con el resto del admin:
  - Uso de cards con sombras suaves
  - Bordes redondeados
  - Botones primarios azules
- Minimizar pasos:
  - Desde un producto en `/admin/listas/[id]/productos` en un futuro se podría tener botón “Crear pedido con este producto” que abra directamente `/admin/pedidos/nuevo` con el artículo precargado.
- Asegurar que los formularios sean fáciles de usar en móvil:
  - Inputs en ancho completo
  - Botones grandes
  - No saturar una misma vista con demasiados campos; usar grouping visual.

---

## 8. Resumen de vistas a implementar

1. `/admin/clientes`
   - Listado + buscador + botón “Nuevo cliente”
   - Formulario de creación/edición (modal o subvista)

2. `/admin/pedidos`
   - Listado con filtros por estado, rango de fechas y cliente
   - Botón “Nuevo pedido”

3. `/admin/pedidos/nuevo`
   - Vista para seleccionar o crear cliente
   - Card de cliente seleccionado
   - Botón `Crear pedido para este cliente`

4. `/admin/pedidos/[id]`
   - Cabecera con código de pedido, estado y cliente
   - Card de fechas y resumen económico
   - Card con información del cliente
   - Sección con lista de artículos
   - Botón `+ Agregar artículo` y acciones por ítem

5. `/admin/pedidos/[id]/add-item` (o modal equivalente)
   - Buscador de producto
   - Formulario para datos del ítem
   - Guardar/Cancelar

---

**Fin del esquema visual del módulo.**
