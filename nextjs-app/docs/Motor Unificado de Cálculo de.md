# MÓDULO – Motor Unificado de Cálculo de Precios (Pricing Engine)
Proyecto: Chic Import USA (Next.js + Supabase)  
Fecha: _(poner fecha)_  
Versión: 1.0

## 1. Objetivo
Actualmente la plataforma calcula precios en más de un punto (por ejemplo: creación/edición de productos, vistas administrativas, y ahora toma de pedidos). Se requiere implementar una **funcionalidad centralizada y reutilizable** que ejecute el **mismo método de cálculo** de manera consistente, y que sea invocada desde cualquier parte de la aplicación que necesite cálculos de precio, costo, descuento y ganancia.

Esta funcionalidad debe:
- Recibir inputs estándar.
- Calcular todos los valores derivados con fórmulas únicas.
- Retornar un objeto con resultados completos (para guardar en BD y para mostrar en UI).
- Permitir que todas las pantallas usen **la misma fuente de verdad** del cálculo (sin duplicar fórmulas en componentes).

---

## 2. Fuente del cálculo (Excel oficial)
El método de cálculo se define por las variables y fórmulas del archivo Excel “Calculo de precios.xlsx”.

### 2.1 Variables de entrada (inputs)
- **TRM**: valor traído de la lista (listas_oferta).
- **%Tax**: valor traído de la lista (listas_oferta).  
- **precio_base_usd**: valor digitado en pantalla (producto).
- **margen_porcentaje**: valor digitado en pantalla (producto) o default de lista.
- **%descuento**: valor digitado en pantalla (producto).

### 2.2 Variables de salida (outputs) para almacenar
- **costo_total_usd**
- **costo_total_cop**
- **precio_sugerido_cop**
- **precio_final_cop**
- **ganancia_cop**

### 2.3 Variables de salida adicionales para visualizar (UI)
Según el bloque de “Ejemplo del cálculo para visualizar datos en la pantalla”, se deben calcular y exponer:
- **valor_producto_cop** (Valor del producto)
- **descuento_cop** (Descuento)
- **precio_final_cop** (Precio Final)
- **ganancia_cop** (Ganancia estimada)

---

## 3. Fórmulas oficiales (única fuente de verdad)

> Nota: En las fórmulas, `%Tax`, `margen_porcentaje` y `%descuento` están expresados como decimales (ej. 0.10 = 10%).

### 3.1 Cálculo de costo total USD
1) Precio con impuesto en USD:
- `precio_con_tax_usd = precio_base_usd + (precio_base_usd * tax_pct)`
- equivalente: `precio_con_tax_usd = precio_base_usd * (1 + tax_pct)`

2) Costo total USD con descuento:
- `costo_total_usd = precio_con_tax_usd - (precio_con_tax_usd * descuento_pct)`
- equivalente: `costo_total_usd = precio_con_tax_usd * (1 - descuento_pct)`

### 3.2 Cálculo de costo total COP
- `costo_total_cop = costo_total_usd * trm`

### 3.3 Cálculo de precio sugerido COP
- `precio_sugerido_cop = costo_total_cop + (costo_total_cop * margen_pct)`
- equivalente: `precio_sugerido_cop = costo_total_cop * (1 + margen_pct)`

### 3.4 Precio final COP
En el Excel:
- `precio_final_cop = precio_sugerido_cop`

En plataforma:
- Por defecto: `precio_final_cop = precio_sugerido_cop`
- Si existe funcionalidad de “precio final manual” (ya existe en productos), entonces:
  - si `precio_final_manual_cop` está definido: `precio_final_cop = precio_final_manual_cop`
  - si no: `precio_final_cop = precio_sugerido_cop`

### 3.5 Ganancia COP
- `ganancia_cop = precio_final_cop - costo_total_cop`

---

## 4. Cálculos para visualización en pantalla (UI)

### 4.1 Valor del producto (sin descuento aplicado)
Según el Excel:
- `valor_producto_cop = ((precio_con_tax_usd) + (precio_con_tax_usd * margen_pct)) * trm`
- equivalente: `valor_producto_cop = precio_con_tax_usd * (1 + margen_pct) * trm`

Interpretación:
- Es el “valor completo” del producto con impuesto y margen, **sin aplicar descuento**.

### 4.2 Descuento (en COP)
Según el Excel:
- `descuento_cop = valor_producto_cop - precio_sugerido_cop`

En plataforma (con precio final manual):
- Si `precio_final_manual_cop` existe, se debe exponer también:
  - `descuento_cop_vs_final = valor_producto_cop - precio_final_cop`
  - (Opcional) mantener `descuento_cop` como referencia contra sugerido.

### 4.3 Precio final y ganancia estimada
- `precio_final_cop` (el que verá el usuario)
- `ganancia_cop` (estimada según el precio final actual)

---

## 5. Ejemplo oficial (debe coincidir con Excel)

Inputs:
- `trm = 4000`
- `tax_pct = 0.10`
- `precio_base_usd = 100`
- `margen_pct = 1.00`
- `descuento_pct = 0.50`

Resultados esperados:
- `precio_con_tax_usd = 110`
- `costo_total_usd = 55`
- `costo_total_cop = 220000`
- `precio_sugerido_cop = 440000`
- `precio_final_cop = 440000` (si no hay override manual)
- `ganancia_cop = 220000`
- `valor_producto_cop = 880000`
- `descuento_cop = 440000`

---

## 6. Requerimiento técnico: Función centralizada reutilizable

### 6.1 Requisito principal
Crear un módulo único de cálculo, por ejemplo:
- `src/lib/pricingEngine.ts` (o ruta equivalente)

Este módulo debe exportar una función pura (sin acceso a UI, sin dependencias de React):
- `calculatePricing(input) -> output`

### 6.2 Firma sugerida (conceptual)
**Input:**
- `trm: number`
- `tax_pct: number` (ej. 0.10)
- `precio_base_usd: number`
- `margen_pct: number`
- `descuento_pct: number`
- `precio_final_manual_cop?: number | null` (opcional)

**Output (mínimo requerido):**
- `precio_con_tax_usd`
- `costo_total_usd`
- `costo_total_cop`
- `precio_sugerido_cop`
- `precio_final_cop`
- `ganancia_cop`
- `valor_producto_cop`
- `descuento_cop`

**Output opcional (si aplica override manual):**
- `descuento_cop_vs_final`

---

## 7. Validaciones y reglas

### 7.1 Validaciones de rango
- `trm > 0`
- `precio_base_usd >= 0`
- `tax_pct >= 0`
- `margen_pct >= 0`
- `descuento_pct >= 0` y `descuento_pct <= 1`
- Si `precio_final_manual_cop` existe: `precio_final_manual_cop >= 0`

### 7.2 Manejo de valores faltantes
- Si un campo requerido no existe o no es numérico, retornar error controlado (o valores nulos y un flag de “invalid”).
- Si `margen_pct` no se define en producto, usar:
  - `margen_default` de la lista (si existe en listas_oferta)
- Si `descuento_pct` no se define, asumir `0`.

---

## 8. Redondeo / formato
La función debe retornar valores numéricos consistentes. Se define:
- COP: sin decimales (entero).
- USD: puede tener decimales, pero para consistencia se recomienda retornar hasta 2 decimales.

**Regla recomendada:**
- Redondear COP con `Math.round()` (o equivalente), antes de guardar o mostrar.

_(Si se requiere redondeo a múltiplos de 100 o 500 COP, dejar el redondeo parametrizable como “strategy”, pero por ahora usar entero estándar.)_

---

## 9. Puntos de uso obligatorios (no duplicar fórmulas)
Todas las partes de la plataforma que requieran cálculos deben invocar el Pricing Engine:

### 9.1 Admin – Productos (obligatorio)
- En creación/edición de producto:
  - Cuando cambie `precio_base_usd`, `margen_pct`, `descuento_pct` o cuando cambie la lista asociada (trm/tax), recalcular:
    - costo_total_usd, costo_total_cop, precio_sugerido_cop, precio_final_cop, ganancia_cop, valor_producto_cop, descuento_cop
- Si existe “precio final manual”, recalcular ganancia y métricas usando ese precio final.

### 9.2 Admin – Pedidos (obligatorio)
- Al agregar un ítem a un pedido, si se requiere recomputar (o validar) ganancia/costo/venta:
  - Usar el engine para consistencia.
  - Respetar snapshots si el módulo de pedidos guarda precios/costos “congelados”.

### 9.3 Dashboard / métricas (si aplica)
- Cualquier resumen de valores debe usar los valores almacenados (ya calculados por engine) o recalcular consistentemente desde el engine.

---

## 10. Persistencia en base de datos (recomendación)
Para evitar inconsistencias por cambios futuros de TRM/TAX, se recomienda almacenar en producto:
- `costo_total_usd`
- `costo_total_cop`
- `precio_sugerido_cop`
- `precio_final_cop`
- `ganancia_cop`
- `descuento_pct`
- (Opcional) `tax_pct_snapshot`, `trm_snapshot` si se requiere auditoría.

Para UI, se puede calcular “valor_producto_cop” y “descuento_cop” en runtime o almacenarlos si se requiere rapidez; preferible retornarlos desde engine para UI y no necesariamente persistirlos.

---

## 11. Entregables esperados (Claude)
1) Crear el módulo `pricingEngine` con pruebas básicas del ejemplo oficial.  
2) Reemplazar cualquier cálculo duplicado en la app por llamadas al engine.  
3) Garantizar que los mismos inputs producen los mismos resultados en:
   - Productos
   - Pedidos
   - Catálogo (si aplica)
4) Documentar en README interno:
   - dónde está el engine
   - cómo se usa
   - qué retorna

---

**Fin del requerimiento.**
