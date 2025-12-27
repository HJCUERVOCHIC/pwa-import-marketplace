# FASE 2 – Gestión de cartera y vencimientos

## Objetivo
Clasificar la deuda de pedidos y clientes según su estado de pago y vencimiento.

## Alcance
- Fecha de vencimiento por pedido.
- Estado automático de cartera.
- Filtros por cartera.
- Análisis de cartera por período de venta.

## Requerimientos funcionales
- Agregar a `pedidos`:
  - fecha_vencimiento_pago
  - estado_cartera (al_dia | pendiente | vencido)
- Reglas automáticas:
  - saldo = 0 → al_dia
  - saldo > 0 y hoy <= vencimiento → pendiente
  - saldo > 0 y hoy > vencimiento → vencido
- Filtros por:
  - pedidos vencidos
  - clientes con cartera vencida
- Visualización de cartera agrupada por `periodo_venta`.

## Entregables
- Triggers de cálculo de cartera.
- Filtros de cartera en UI.
- Indicadores visuales de vencimiento.

## Criterios de aceptación
- Se identifican pedidos vencidos automáticamente.
- Se puede saber qué meses concentran mayor cartera pendiente.
