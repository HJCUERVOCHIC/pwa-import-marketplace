# Estado del Proyecto: Chic Import USA
**Fecha:** 27 de diciembre de 2025

---

## 📋 Descripción General

**Chic Import USA** es una plataforma e-commerce PWA para gestión de catálogos de productos importados con cálculos complejos de precios internacionales (USD → COP), impuestos, márgenes y descuentos.

### Stack Tecnológico
- **Frontend:** Next.js App Router
- **Backend:** Supabase (Auth, Database, Storage)
- **Estilos:** Tailwind CSS
- **Despliegue:** Vercel

---

## ✅ Módulos Completados

### 1. Autenticación y Protección de Rutas
- Login/logout con Supabase Auth
- Rutas protegidas para admin

### 2. Listas de Productos
- CRUD de listas con configuración TRM/TAX
- Estados: borrador, publicada, archivada
- Configuración de modo impuesto (incluido/sin impuesto)

### 3. Productos
- **Productos Normales:** Completos con todos los campos
- **Productos Rápidos:** Creación simplificada
- Motor de precios centralizado (`pricingEngine.js`)
- Estados: borrador, publicado, archivado

### 4. Clientes
- CRUD completo
- Teléfono como identificador único
- Búsqueda por teléfono/nombre

### 5. Pedidos - Flujo Completo

#### Estados del Pedido (6 estados)
```javascript
ESTADOS_PEDIDO = {
  solicitado: 'Solicitado',      // Estado inicial
  en_gestion: 'En Gestión',      // Automático cuando hay items en proceso
  rechazado: 'Rechazado',        // Automático si todos los items son rechazados
  confirmado: 'Confirmado',      // Manual - cliente confirma
  enviado: 'Enviado',            // Manual
  entregado: 'Entregado'         // Manual
}
```

#### Estados del Item (4 estados)
```javascript
ESTADOS_ITEM = {
  solicitado: 'Solicitado',   // Estado inicial
  encontrado: 'Encontrado',   // Producto localizado (requiere foto)
  confirmado: 'Confirmado',   // Cliente acepta
  rechazado: 'Rechazado'      // Cliente rechaza o no disponible
}
```

#### Flujo de Items
```
SOLICITADO → ENCONTRADO → CONFIRMADO
                       ↘ RECHAZADO
         ↘ RECHAZADO (si no se consigue)
```

#### Restricciones de Agregar Artículos (ACTUALIZADO)
Solo se pueden agregar artículos en estos estados:
- ✅ `nuevo`
- ✅ `solicitado`
- ✅ `en_gestion`
- ❌ `confirmado` (BLOQUEADO - cambio reciente)
- ❌ `enviado`
- ❌ `entregado`
- ❌ `rechazado`

### 6. WhatsApp Integration
- Generación de imagen con Canvas (foto + datos del producto)
- Web Share API para compartir
- Fallback: descarga de imagen
- Registro de envío (fecha/hora)

### 7. FASE 1 - Control Financiero Básico ✅ COMPLETADA

#### Campos nuevos en `pedidos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fecha_confirmacion` | TIMESTAMPTZ | Cuándo se confirmó el pedido |
| `periodo_venta` | TEXT (YYYY-MM) | Mes contable de la venta (snapshot) |
| `total_abonado_cop` | NUMERIC | Suma de pagos confirmados |
| `saldo_cop` | NUMERIC | Total - Abonado |

#### Nueva tabla `pedido_pagos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `pedido_id` | UUID | FK a pedidos |
| `cliente_id` | UUID | FK a clientes |
| `monto_cop` | NUMERIC | Valor del pago (> 0) |
| `fecha_pago` | DATE | Fecha real del pago |
| `metodo_pago` | TEXT | efectivo, transferencia, nequi, daviplata, tarjeta, otro |
| `referencia` | TEXT | Número de comprobante |
| `comprobante_url` | TEXT | URL del comprobante (opcional) |
| `estado` | TEXT | confirmado, pendiente_validacion, anulado |

#### Triggers Automáticos
1. Al confirmar pedido → Asigna `fecha_confirmacion` y `periodo_venta`
2. Al registrar/modificar pago → Recalcula `total_abonado_cop` y `saldo_cop`
3. Validación → No permite pagos que excedan el saldo

#### Vistas SQL
- `vista_deuda_clientes` - Deuda consolidada por cliente
- `vista_ventas_periodo` - Ventas por mes (periodo_venta)
- `vista_recaudo_periodo` - Recaudo por mes (fecha_pago)

#### Componentes React
- `GestionPagos.js` - UI de pagos en detalle de pedido
- `CarteraClientes.js` - Vista de deuda por cliente
- `/admin/cartera/page.js` - Página de cartera

#### Navegación Admin
- Dashboard
- Listas
- Pedidos
- Cartera

---

## 🔄 Concepto: Período de Venta vs Recaudo

| Concepto | Basado en | Uso |
|----------|-----------|-----|
| **Ventas por mes** | `periodo_venta` | Cuánto se vendió en ese mes |
| **Recaudo por mes** | `fecha_pago` | Cuánto dinero entró ese mes |
| **Cartera por mes** | `periodo_venta` | Deuda pendiente por mes de origen |

**Ejemplo:**
- Pedido confirmado en **enero** (`periodo_venta = 2025-01`)
- Cliente paga en **febrero** (`fecha_pago = 2025-02-15`)

**Resultado:**
- La **venta** cuenta en enero
- El **recaudo** cuenta en febrero
- La **cartera de enero** se reduce cuando paga

---

## 📁 Estructura de Archivos Clave

```
src/
├── app/
│   └── admin/
│       ├── clientes/page.js
│       ├── pedidos/
│       │   ├── page.js
│       │   ├── nuevo/page.js
│       │   └── [id]/page.js
│       ├── cartera/page.js
│       └── listas/
│           └── [id]/page.js
├── components/
│   ├── AdminLayout.js
│   ├── AdminNavbar.js
│   ├── GestionPagos.js
│   ├── CarteraClientes.js
│   └── ModalAgregarAPedido.js
├── lib/
│   ├── supabase.js
│   └── pricingEngine.js
└── services/
    └── whatsappService.js
```

---

## 🚀 Fases Pendientes

### FASE 2: Gestión de Cartera y Vencimientos
- Campo `fecha_vencimiento_pago` en pedidos
- Campo `estado_cartera` (al_dia, pendiente, vencido)
- Triggers de cálculo automático de estado
- Filtros visuales por estado de cartera

### FASE 3: Vistas Avanzadas de Gestión
- Dashboard con métricas
- Filtros avanzados
- Reportes básicos

### FASE 4: Dashboard y KPIs del Negocio
- Métricas de ventas
- Análisis de rentabilidad
- Gráficos y visualizaciones

### FASE 5: Auditoría y Control de Acceso
- Historial de cambios
- Roles y permisos
- Trazabilidad

### FASE 6: Reportes y Exportación
- Exportar a Excel/PDF
- Reportes personalizados
- Análisis por período

---

## 🔧 Reglas de Negocio Importantes

1. **Solo pagos confirmados** afectan el saldo
2. **No se permiten** pagos negativos
3. **No se permiten** pagos que excedan el saldo
4. El `periodo_venta` es un **snapshot** (no se recalcula)
5. El `periodo_venta` se asigna **solo al confirmar** el pedido
6. Los **artículos rechazados** no suman en los totales del pedido
7. Para marcar un item como "encontrado" se requiere **al menos 1 imagen**
8. Los precios se guardan como **snapshot** al agregar al pedido
9. **No se pueden agregar artículos** a pedidos confirmados, enviados, entregados o rechazados

---

## 📝 Último Cambio Realizado

**Archivo:** `ModalAgregarAPedido.js`
**Cambio:** Removido el estado `confirmado` de la lista de estados permitidos para agregar artículos.

```javascript
// ANTES
const ESTADOS_PEDIDO_PERMITIDOS = ['solicitado', 'nuevo', 'en_gestion', 'confirmado']

// DESPUÉS
const ESTADOS_PEDIDO_PERMITIDOS = ['solicitado', 'nuevo', 'en_gestion']
```

---

## 🗄️ Queries SQL Útiles

```sql
-- Ver ventas por período (mes de confirmación)
SELECT * FROM vista_ventas_periodo;

-- Ver recaudo por período (mes de pago real)
SELECT * FROM vista_recaudo_periodo;

-- Ver deuda por cliente
SELECT * FROM vista_deuda_clientes WHERE deuda_total_cop > 0;

-- Ver pagos de un pedido
SELECT * FROM pedido_pagos 
WHERE pedido_id = 'UUID_DEL_PEDIDO' 
ORDER BY fecha_pago DESC;

-- Verificar saldos calculados correctamente
SELECT 
  codigo_pedido,
  total_venta_cop,
  total_abonado_cop,
  saldo_cop,
  (total_venta_cop - total_abonado_cop) as saldo_calculado,
  periodo_venta
FROM pedidos
WHERE total_venta_cop > 0;
```

---

## 🎯 Próximo Paso Sugerido

Continuar con **FASE 2: Gestión de Cartera y Vencimientos** o estabilizar y probar más la Fase 1 actual.
