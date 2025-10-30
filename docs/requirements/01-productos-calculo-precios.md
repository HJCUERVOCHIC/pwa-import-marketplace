# Módulo 01: Gestión de Productos y Cálculo de Precios

## Descripción General
Este módulo permite a los **administradores** registrar y gestionar productos cazados en tiendas de EE. UU. (físicas o en línea), calcular su precio final de venta en Colombia y preparar los productos para su publicación dentro de una lista de oferta.

Cada producto cazado contiene información básica (nombre, marca, categoría, descripción, imágenes) y un cálculo automático del precio de venta final en COP. **La TRM y la política de TAX se definen a nivel de _Lista de Oferta_ y se aplican por igual a _todos_ los productos de esa lista**, garantizando coherencia de parámetros dentro de cada oferta.  
El administrador puede realizar múltiples cálculos, ajustar manualmente el precio final antes de publicar (sin permitir precio por debajo del costo), y el sistema registra el **costo real en pesos** y la **ganancia esperada**.  
Una vez publicado, el producto queda bloqueado para edición y conserva un _snapshot_ de los valores usados.

---

## Actores
- **Administrador (admin_full):** Registra, edita, calcula y publica productos.  
- **Superadministrador (superadmin):** Puede editar y eliminar productos de cualquier lista, además de definir políticas globales (por ejemplo, margen por defecto o fuente de TRM).

---

## Reglas de Negocio
1. Un producto siempre pertenece a una **Lista de Oferta** específica.
2. **TRM y TAX son propiedades de la Lista de Oferta** y aplican a todos sus productos.  
   - La lista define una **TRM única** (`trm_lista`) para todos sus productos.  
   - La lista define una **política de TAX única** (`tax_modo_lista` + `tax_porcentaje_lista` *o* `tax_usd_lista`).  
   - En el editor de producto estos valores se muestran **solo lectura** (no editables por producto).
3. Estados del producto:  
   - `borrador` → edición/cálculo.  
   - `listo_para_publicar` → cumple requisitos mínimos.  
   - `publicado` → visible en la lista pública (precio congelado).  
   - `oculto` → fue publicado pero se deshabilitó su visibilidad.
4. El **costo del producto en COP** se calcula como:  
   `(precio_base_usd + tax_usd_final_lista) × trm_lista`, con redondeo a decena.
5. La **ganancia esperada en COP** se calcula como:  
   `precio_final_cop - costo_total_cop`, con redondeo a decena.
6. El **precio final COP** puede modificarse manualmente mientras el producto esté `borrador` o `listo_para_publicar`, pero **nunca puede ser menor que el costo_total_cop**.
7. **Redondeo:** todos los valores en COP se redondean a la **decena** más cercana (no se manejan decimales en COP).
8. Una vez publicado, el producto **congela**: `precio_final_cop`, `costo_total_cop`, `ganancia_cop`, `trm_usada_publicacion = trm_lista`, `tax_usado_publicacion` (derivado de la política de lista), `margen_usado_publicacion` (si aplica), y `publicado_at`.
9. Si el administrador **modifica la TRM o TAX de la lista**:  
   - Los **productos en borrador** se **recalculan automáticamente** con los nuevos valores.  
   - Los **productos publicados no cambian** (mantienen su snapshot).
10. Los campos obligatorios para publicar un producto son: **título**, **al menos una imagen** y **precio_final_cop** válido (≥ costo).
11. Los cálculos se pueden repetir indefinidamente mientras el producto no esté publicado.
12. Todos los productos publicados deben estar asociados a una **Lista de Oferta en estado `publicada`**.

---

## Flujo Principal

1. El administrador accede a una Lista de Oferta en estado `borrador`, la cual **ya tiene definida** `trm_lista` y **política de TAX** (`tax_modo_lista` + valor).  
2. Hace clic en “Agregar producto”.  
3. Se abre el **Editor de Producto** (muestra TRM y TAX de la lista en solo lectura).  
4. El administrador ingresa datos básicos: Título, Marca, Categoría, Descripción, Origen (física o web).  
5. Sube una o más imágenes del producto.  
6. Ingresa **precio_base_usd** y **margen_porcentaje** (si existe margen por producto).  
7. El sistema calcula automáticamente:  
   - `tax_usd_final_lista` según la política de la lista.  
   - `costo_total_usd`  
   - `costo_total_cop`  
   - `precio_sugerido_cop`  
   - `ganancia_cop` (con el precio final actual).  
8. El administrador puede ajustar **precio_final_cop** (≥ costo).  
9. Guarda el producto como `borrador` o lo pasa a `listo_para_publicar`.  
10. Al publicar, el sistema congela los valores económicos y de contexto (TRM/TAX/margen usados).

---

## Flujos Alternativos / Excepciones

- **Si el admin intenta publicar sin imagen:**  
  → “Debes subir al menos una imagen para publicar”.
- **Si TRM/TAX de lista no están definidos:**  
  → No permitir carga de productos; mostrar “Define TRM y TAX en la lista antes de agregar productos”.
- **Si el producto ya fue publicado:**  
  → No permitir edición de precio ni cálculos; solo ocultar o duplicar.
- **Si la API de TRM falla al definir la lista:**  
  → Permitir ingresar TRM manual en la lista; los productos usarán ese valor.
- **Si el cálculo da error (valores no numéricos):**  
  → “Verifica los valores numéricos del cálculo”.
- **Si el admin ingresa un precio_final_cop menor al costo:**  
  → “El precio de venta no puede ser menor al costo del producto”.

---

## Validaciones Requeridas
- Lista de oferta debe tener **TRM** y **TAX** definidos antes de permitir agregar productos.  
- Título: obligatorio (mín. 3 caracteres).  
- Categoría: seleccionada de lista predefinida.  
- Al menos **una imagen** para publicar.  
- **Precio base USD** > 0.  
- **Margen** numérico (≥ 0) si aplica por producto.  
- **Precio final COP** obligatorio antes de publicar y **≥ costo_total_cop**.  
- **Redondeo a decena** para todos los valores COP.  
- No publicar productos duplicados (mismo título + misma lista).

---

## Datos a Capturar / Almacenar

> **Nota:** TRM y TAX residen en la **Lista de Oferta** y se referencian desde el producto. El producto guarda sus valores calculados y un snapshot al publicar.

### Campos de Producto
| Campo | Tipo | Obligatorio | Descripción / Restricciones |
|--------|------|-------------|-----------------------------|
| `id_producto` | UUID | ✅ | Identificador único |
| `id_lista` | UUID (FK) | ✅ | Relación con Lista de Oferta |
| `titulo` | string | ✅ | Nombre del producto |
| `marca` | string | opcional | Marca o fabricante |
| `categoria` | enum | ✅ | Ej. “Calzado”, “Ropa”, “Tecnología” |
| `descripcion` | text | opcional | Texto visible al cliente |
| `imagenes` | array[string] | ✅ | URLs (Supabase Storage) |
| `precio_base_usd` | decimal(10,2) | ✅ | Precio original en USD |
| `margen_porcentaje` | decimal(5,2) | opcional | Margen específico del producto |
| `costo_total_usd` | decimal(10,2) | calculado | `precio_base_usd + tax_usd_final_lista` |
| `costo_total_cop` | decimal(12,0) | calculado | `(precio_base_usd + tax_usd_final_lista) × trm_lista` (redondeado a decena) |
| `precio_sugerido_cop` | decimal(12,0) | calculado | `costo_total_cop × (1 + margen/100)` (redondeado a decena) |
| `precio_final_cop` | decimal(12,0) | ✅ | Editable antes de publicar (≥ costo) |
| `ganancia_cop` | decimal(12,0) | calculado | `precio_final_cop - costo_total_cop` (redondeado a decena) |
| `estado` | enum | ✅ | `borrador` · `listo_para_publicar` · `publicado` · `oculto` |
| `publicado_at` | timestamp | automático | Fecha/hora de publicación |
| `publicado_por` | UUID (FK admin) | automático | Admin que publicó |
| `trm_usada_publicacion` | decimal(10,2) | automático | Copia de `trm_lista` al publicar |
| `tax_usado_publicacion` | decimal(10,2) | automático | Copia de `tax_usd_final_lista` al publicar |
| `margen_usado_publicacion` | decimal(5,2) | automático | Margen efectivo al publicar |
| `created_at` | timestamp | automático | Fecha de creación |
| `updated_at` | timestamp | automático | Última edición |

### Campos (referencia) en Lista de Oferta  *(para coordinación con el Módulo de Listas)*
| Campo | Tipo | Obligatorio | Descripción |
|------|------|-------------|-------------|
| `trm_lista` | decimal(10,2) | ✅ | TRM única de la lista |
| `tax_modo_lista` | enum | ✅ | `porcentaje` · `valor_fijo_usd` |
| `tax_porcentaje_lista` | decimal(5,2) | cond. | Requerido si `tax_modo_lista = porcentaje` |
| `tax_usd_lista` | decimal(10,2) | cond. | Requerido si `tax_modo_lista = valor_fijo_usd` |

---

## Cálculos / Fórmulas

### 1. TAX de la lista aplicado al producto
```
if tax_modo_lista == "valor_fijo_usd":
    tax_usd_final_lista = tax_usd_lista
elif tax_modo_lista == "porcentaje":
    tax_usd_final_lista = precio_base_usd * (tax_porcentaje_lista / 100)
else:
    tax_usd_final_lista = 0
```

### 2. Costo total USD
```
costo_total_usd = precio_base_usd + tax_usd_final_lista
```

### 3. Costo total COP (con redondeo a decena)
```
costo_total_cop = redondear_a_decena(costo_total_usd * trm_lista)
```

### 4. Precio sugerido COP (con redondeo a decena)
```
precio_sugerido_cop = redondear_a_decena(costo_total_cop * (1 + margen_porcentaje / 100))
```

### 5. Precio final COP (editable antes de publicar)
```
precio_final_cop = valor_ingresado_por_admin
validar(precio_final_cop >= costo_total_cop)
```

### 6. Ganancia esperada COP (con redondeo a decena)
```
ganancia_cop = redondear_a_decena(precio_final_cop - costo_total_cop)
```

> **Redondeo a decena**: `redondear_a_decena(x)` aproxima al múltiplo de 10 más cercano (ej.: 259,423 → 259,420; 121,675 → 121,680).

---

## Casos de Uso Ejemplo

### Escenario 1: Cálculo con TAX porcentaje
- **Lista:** `trm_lista = 4,200`; `tax_modo_lista = porcentaje`; `tax_porcentaje_lista = 7`.  
- **Producto:** `precio_base_usd = 79.99`; `margen = 25%`.  
- Cálculos:
  - `tax_usd_final_lista = 79.99 × 0.07 = 5.60`
  - `costo_total_usd = 85.59`
  - `costo_total_cop = redondear_a_decena(85.59 × 4200) = 359,480`
  - `precio_sugerido_cop = redondear_a_decena(359,480 × 1.25) = 449,350`
- El admin fija `precio_final_cop = 450,000` (válido ≥ costo).  
- `ganancia_cop = 450,000 - 359,480 = 90,520` → `90,520` (ya es decena).

### Escenario 2: Cambio de TRM en la lista con productos en borrador
- La lista cambia `trm_lista` de 4,200 a 4,300.  
- Los productos en `borrador` se **recalcularán** automáticamente con la nueva TRM.  
- Los productos `publicados` **no cambian** (conservan snapshot).

### Escenario 3: Validación de precio por debajo del costo
- Con `costo_total_cop = 359,480`, el admin intenta `precio_final_cop = 350,000`.  
- El sistema rechaza el guardado y muestra: “El precio de venta no puede ser menor al costo del producto”.

---

## Criterios de Aceptación
- [ ] TRM y TAX se definen **a nivel de Lista** y son comunes a todos los productos de esa lista.  
- [ ] El editor de producto muestra TRM/TAX de la lista **en solo lectura**.  
- [ ] Los productos en borrador se **recalculan** si cambia TRM/TAX de la lista.  
- [ ] Productos publicados no cambian al modificar TRM/TAX de la lista.  
- [ ] Se almacena el **costo** en COP y la **ganancia** por producto.  
- [ ] El **precio final** puede ser ajustado manualmente antes de publicar (≥ costo).  
- [ ] Todos los valores en COP se redondean a la **decena**.  
- [ ] Se congela snapshot completo al publicar (precio, costo, ganancia, TRM, TAX, margen, fechas, usuario).  
- [ ] No se puede editar un producto publicado (solo ocultar o duplicar).  
- [ ] No se permite publicar productos sin imagen ni duplicados (mismo título + misma lista).
