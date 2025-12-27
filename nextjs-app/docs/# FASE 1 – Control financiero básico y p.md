# FASE 1 – Control financiero básico y período de venta

## Objetivo
Implementar el control financiero por pedido y cliente, incluyendo:
- registro de pagos parciales
- cálculo automático de saldos
- definición clara del período de venta mensual

## Alcance
- Pagos y abonos por pedido.
- Cálculo de total abonado y saldo.
- Consolidado de deuda por cliente.
- Asignación automática del período de venta del pedido.

## Requerimientos funcionales
- Crear tabla `pedido_pagos`.
- Registrar pagos con:
  - monto
  - fecha_pago
  - método de pago
  - referencia
  - estado (confirmado | pendiente_validacion | anulado)
- Solo pagos confirmados afectan los totales.
- Calcular automáticamente:
  - total_abonado_cop
  - saldo_cop
- Mostrar en UI:
  - total pedido
  - total abonado
  - saldo pendiente
- Agregar a `pedidos` el campo:
  - `periodo_venta` (formato YYYY-MM)

## Reglas de negocio
- Un pedido solo cuenta como venta cuando está en estado `confirmado` o superior.
- Al pasar a estado `confirmado`:
  - se asigna automáticamente `fecha_confirmacion` si no existe
  - se asigna automáticamente `periodo_venta` basado en la fecha de confirmación
- El `periodo_venta` es un snapshot:
  - NO se recalcula automáticamente
- No permitir pagos negativos.
- No permitir pagos que excedan el saldo.

## Entregables
- Modelo de datos de pagos.
- Triggers de cálculo financiero.
- Trigger de asignación de período de venta.
- UI mínima para pagos y saldos.

## Criterios de aceptación
- Se puede conocer cuánto se vendió por mes.
- El saldo del pedido se actualiza automáticamente.
- Se puede ver la deuda por cliente.
