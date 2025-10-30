# Sesión 002 - Diseño del Modelo de Datos

**Fecha:** 2025-10-29  
**Módulo:** 01 - Gestión de Productos y Cálculo de Precios  
**Estado:** ✅ Completado - Diseño de Base de Datos  

---

## Contexto

Se recibió el requerimiento formal desde ChatGPT para el Módulo 01: Gestión de Productos y Cálculo de Precios. Este módulo es la base de la plataforma y define cómo los administradores registran productos importados de USA y calculan sus precios de venta en Colombia.

---

## Requerimiento Original

Ver archivo: `/docs/requirements/01-productos-calculo-precios.md`

**Aspectos clave del requerimiento:**
- TRM y TAX se definen a nivel de Lista de Oferta (no por producto individual)
- Los productos calculan automáticamente sus valores económicos
- Se debe congelar un "snapshot" al publicar
- Los productos en borrador se recalculan si cambia TRM/TAX de la lista
- Los productos publicados NO cambian cuando cambia la lista
- Todos los valores COP se redondean a la decena
- El precio final puede editarse pero debe ser ≥ costo

---

## Prompt Enviado a Claude

```
[Compartí el archivo completo 01-productos-calculo-precios.md]

Necesito que diseñes:
1. El modelo de datos completo (tablas, campos, tipos, relaciones)
2. Las migraciones SQL para Supabase
3. Los triggers necesarios para cálculos automáticos y recálculos
4. Constraints y validaciones a nivel de base de datos
```

---

## Respuesta de Claude - Decisiones Técnicas

### 1. Arquitectura de Base de Datos

**Dos tablas principales:**
- `listas_oferta`: Contiene TRM, TAX y parámetros económicos
- `productos`: Productos individuales con valores calculados

**Relación:** 1:N (Una lista → Muchos productos)

### 2. Tipos de Datos Personalizados (ENUMs)

```sql
- estado_lista: 'borrador' | 'publicada' | 'cerrada' | 'archivada'
- estado_producto: 'borrador' | 'listo_para_publicar' | 'publicado' | 'oculto'
- tax_modo: 'porcentaje' | 'valor_fijo_usd'
- categoria_producto: 'calzado' | 'ropa' | 'tecnologia' | ...
```

**Razón:** Los ENUMs proporcionan validación a nivel de BD y mejor performance que strings.

### 3. Lógica de Cálculos Automáticos

**Implementado con 3 triggers:**

1. **`trigger_calcular_valores_producto`** (BEFORE INSERT/UPDATE)
   - Calcula: costo_total_cop, precio_sugerido_cop, ganancia_cop
   - Se ejecuta cuando cambia: precio_base_usd, margen_porcentaje, precio_final_cop
   - Usa función `redondear_a_decena()` para todos los valores COP

2. **`trigger_congelar_snapshot`** (BEFORE UPDATE de estado)
   - Congela valores al publicar:
     - trm_usada_publicacion
     - tax_usado_publicacion
     - margen_usado_publicacion
     - publicado_at

3. **`trigger_recalcular_productos`** (AFTER UPDATE en listas_oferta)
   - Cuando cambia TRM/TAX de lista → recalcula productos en borrador
   - NO afecta productos publicados

**Razón:** Los triggers garantizan consistencia de datos sin depender del frontend.

### 4. Constraints Implementados

```sql
-- Validaciones críticas:
- precio_final_cop >= costo_total_cop (no vender por debajo del costo)
- Mínimo 1 imagen para publicar
- Título único por lista (no duplicados)
- TRM > 0
- TAX válido según modo elegido
```

### 5. Row Level Security (RLS)

Configurado básico para usuarios autenticados. Refinamiento de permisos se hará en módulos posteriores (gestión de usuarios/roles).

### 6. Índices de Performance

```sql
- idx_listas_estado
- idx_listas_fecha
- idx_productos_lista (FK)
- idx_productos_estado
- idx_productos_categoria
- idx_productos_publicado_at (filtered)
```

---

## Artefactos Generados

### 1. **schema_listas_productos.sql**
Esquema completo de base de datos con:
- Definición de tablas
- ENUMs personalizados
- Triggers y funciones
- Constraints y validaciones
- RLS policies
- Índices

### 2. **migration_001_inicial.sql**
Migración de Supabase (referencia al schema principal)

### 3. **modelo-datos.md**
Documentación técnica completa con:
- Diagrama de entidades
- Explicación de cada tabla
- Fórmulas de cálculo
- Triggers implementados
- Ejemplos de datos

---

## Próximos Pasos

- [ ] Aplicar la migración en Supabase
- [ ] Inicializar proyecto React con Vite
- [ ] Crear servicios para comunicación con Supabase
- [ ] Desarrollar componentes UI:
  - Gestión de listas de oferta
  - Formulario de producto
  - Calculadora de precios
  - Vista de catálogo

---

## Instrucciones para Aplicar en Supabase

1. Ve al Dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto `pwa-import-marketplace`
3. Ve a **SQL Editor**
4. Copia y pega el contenido de `schema_listas_productos.sql`
5. Ejecuta (Run)
6. Verifica que las tablas se crearon correctamente en **Table Editor**

---

## Notas Importantes

- **Redondeo a decenas:** Implementado a nivel de BD con función `redondear_a_decena()`
- **Recálculo automático:** Solo afecta productos en borrador/listo, nunca publicados
- **Snapshot inmutable:** Una vez publicado, los valores económicos quedan congelados
- **Validación de precio:** La BD rechaza precios menores al costo

---

## Validación del Diseño

✅ TRM y TAX a nivel de lista  
✅ Cálculos automáticos con triggers  
✅ Snapshot al publicar  
✅ Recálculo selectivo (solo borradores)  
✅ Redondeo a decenas  
✅ Validación precio ≥ costo  
✅ Constraint de imágenes mínimas  
✅ Título único por lista  

**Todos los criterios de aceptación del requerimiento están cubiertos a nivel de base de datos.**