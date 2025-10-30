# Modelo de Datos - PWA Import Marketplace

## Visión General

El modelo de datos implementa una arquitectura de **Lista-Producto** donde:
- Una **Lista de Oferta** contiene múltiples productos
- TRM y TAX se definen a **nivel de lista** y aplican a todos sus productos
- Los productos calculan automáticamente sus valores económicos
- Al publicar, se congela un **snapshot** de los valores usados

## Diagrama de Entidades

```
┌─────────────────────────┐
│   listas_oferta         │
├─────────────────────────┤
│ id (PK)                 │
│ titulo                  │
│ trm_lista              │◄─────┐
│ tax_modo_lista         │      │ Referencia para
│ tax_porcentaje_lista   │      │ cálculos automáticos
│ tax_usd_lista          │      │
│ estado                 │      │
│ ...                    │      │
└─────────────────────────┘      │
           │ 1                   │
           │                     │
           │ N                   │
           ▼                     │
┌─────────────────────────┐      │
│     productos           │      │
├─────────────────────────┤      │
│ id (PK)                 │      │
│ id_lista (FK)           │──────┘
│ titulo                  │
│ precio_base_usd         │
│ costo_total_cop         │ ◄── Calculado automáticamente
│ precio_final_cop        │ ◄── Editable antes de publicar
│ ganancia_cop            │ ◄── Calculado automáticamente
│ estado                  │
│ trm_usada_publicacion   │ ◄── Snapshot al publicar
│ tax_usado_publicacion   │ ◄── Snapshot al publicar
│ ...                     │
└─────────────────────────┘
```

## Tablas Principales

### `listas_oferta`

**Propósito:** Agrupa productos con parámetros económicos comunes (TRM y TAX).

**Campos clave:**
- `trm_lista`: TRM única para todos los productos de la lista
- `tax_modo_lista`: Modo de cálculo del TAX ('porcentaje' o 'valor_fijo_usd')
- `tax_porcentaje_lista`: Porcentaje de TAX (si aplica)
- `tax_usd_lista`: Valor fijo en USD del TAX (si aplica)
- `margen_default_porcentaje`: Margen por defecto para productos sin margen específico

**Estados posibles:**
- `borrador`: En construcción, puede editarse
- `publicada`: Visible al público
- `cerrada`: Ya no acepta más productos
- `archivada`: Histórica, solo consulta

### `productos`

**Propósito:** Productos individuales con cálculos automáticos basados en su lista.

**Campos clave:**
- `precio_base_usd`: Precio original del producto en USD
- `costo_total_cop`: Calculado automáticamente (incluye TAX + TRM)
- `precio_final_cop`: **Editable** antes de publicar (debe ser ≥ costo)
- `ganancia_cop`: Calculado automáticamente
- `trm_usada_publicacion`: **Snapshot** de TRM al publicar
- `tax_usado_publicacion`: **Snapshot** de TAX al publicar

**Estados posibles:**
- `borrador`: En edición, cálculos se actualizan
- `listo_para_publicar`: Cumple requisitos mínimos
- `publicado`: Visible al público, valores congelados
- `oculto`: Fue publicado pero se deshabilitó

## Lógica de Cálculos

### Fórmulas Implementadas

```sql
-- 1. TAX aplicado al producto
tax_final = CASE
  WHEN tax_modo = 'valor_fijo_usd' THEN tax_usd_lista
  WHEN tax_modo = 'porcentaje' THEN precio_base_usd * (tax_porcentaje_lista / 100)
  ELSE 0
END

-- 2. Costo total USD
costo_total_usd = precio_base_usd + tax_final

-- 3. Costo total COP (redondeado a decena)
costo_total_cop = ROUND((costo_total_usd * trm_lista) / 10) * 10

-- 4. Precio sugerido COP
margen_efectivo = COALESCE(margen_porcentaje, margen_default_porcentaje, 0)
precio_sugerido_cop = ROUND((costo_total_cop * (1 + margen_efectivo / 100)) / 10) * 10

-- 5. Ganancia COP
ganancia_cop = ROUND((precio_final_cop - costo_total_cop) / 10) * 10
```

### Triggers Automáticos

1. **`trigger_calcular_valores_producto`**
   - Se ejecuta ANTES de INSERT/UPDATE en `productos`
   - Calcula automáticamente: costo_total_cop, precio_sugerido_cop, ganancia_cop
   - Se dispara cuando cambia: precio_base_usd, margen_porcentaje, precio_final_cop

2. **`trigger_congelar_snapshot`**
   - Se ejecuta ANTES de UPDATE en `productos`
   - Cuando el estado cambia a 'publicado', congela:
     - trm_usada_publicacion
     - tax_usado_publicacion
     - margen_usado_publicacion
     - publicado_at

3. **`trigger_recalcular_productos`**
   - Se ejecuta DESPUÉS de UPDATE en `listas_oferta`
   - Cuando cambia TRM o TAX de la lista:
     - Recalcula SOLO productos en 'borrador' o 'listo_para_publicar'
     - NO afecta productos 'publicados' (conservan su snapshot)

## Reglas de Negocio Implementadas

### Constraints a Nivel de Base de Datos

```sql
-- Validaciones de lista
CONSTRAINT trm_positiva CHECK (trm_lista > 0)
CONSTRAINT tax_porcentaje_valido CHECK (...)
CONSTRAINT tax_usd_valido CHECK (...)

-- Validaciones de producto
CONSTRAINT precio_base_positivo CHECK (precio_base_usd > 0)
CONSTRAINT precio_mayor_o_igual_costo CHECK (precio_final_cop >= costo_total_cop)
CONSTRAINT imagenes_minimo_una CHECK (array_length(imagenes, 1) >= 1 OR estado != 'publicado')
CONSTRAINT titulo_unico_por_lista UNIQUE(id_lista, titulo)
```

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas básicas para usuarios autenticados (admins).

En futuras iteraciones se pueden refinar las políticas según roles específicos.

## Consideraciones de Performance

- **Índices creados:**
  - Por estado (listas y productos)
  - Por fecha (listas)
  - Por categoría (productos)
  - Por lista (productos - FK)

- **Optimizaciones:**
  - Cálculos en triggers (evita cálculos en frontend)
  - Redondeo a nivel de base de datos
  - Uso de funciones IMMUTABLE para mejor cache

## Datos de Ejemplo

```sql
-- Lista de ejemplo
INSERT INTO listas_oferta (
  titulo, 
  trm_lista, 
  tax_modo_lista, 
  tax_porcentaje_lista,
  creado_por
) VALUES (
  'Ofertas Octubre 2025',
  4200.00,
  'porcentaje',
  7.00,
  'user-uuid-here'
);

-- Producto de ejemplo
INSERT INTO productos (
  id_lista,
  titulo,
  marca,
  categoria,
  precio_base_usd,
  margen_porcentaje,
  imagenes
) VALUES (
  'lista-uuid-here',
  'Nike Air Max 270',
  'Nike',
  'calzado',
  79.99,
  25.00,
  ARRAY['https://example.com/imagen1.jpg']
);
-- Los valores económicos se calculan automáticamente
```

## Próximas Mejoras

- [ ] Auditoría completa de cambios (tabla `audit_log`)
- [ ] Soft deletes en lugar de CASCADE
- [ ] Versionado de productos
- [ ] Caché de TRM histórica
- [ ] Notificaciones cuando cambia TRM de lista