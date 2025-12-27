#!/bin/bash

# ============================================
# SCRIPT DE COMMIT - Sesión Diciembre 27, 2025
# Chic Import USA - Fase 2 Cartera + Estados Automáticos
# ============================================

echo "🚀 COMMIT DE CAMBIOS - Chic Import USA"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Ir al directorio del proyecto
cd ~/Documents/pwa-import-marketplace/nextjs-app

# Verificar que estamos en el directorio correcto
if [ ! -d ".git" ] && [ ! -d "../.git" ]; then
    echo -e "${RED}⚠️  No estás en un repositorio git${NC}"
    echo "Por favor, ejecuta este script desde el proyecto"
    exit 1
fi

# Subir al directorio raíz del repo si es necesario
if [ -d "../.git" ]; then
    cd ..
fi

echo -e "${BLUE}📋 Estado actual del repositorio:${NC}"
git status --short
echo ""

# Agregar todos los archivos
echo -e "${BLUE}➕ Agregando archivos modificados...${NC}"
git add .

# Mostrar lo que se va a commitear
echo ""
echo -e "${YELLOW}📦 Archivos a commitear:${NC}"
git diff --cached --name-only
echo ""

# Hacer el commit
echo -e "${GREEN}✅ Realizando commit...${NC}"
git commit -m "feat: Gestión de estados de pedido + UI de pagos mejorada

CAMBIOS EN ESTA SESIÓN:

🔧 ESTADOS AUTOMÁTICOS DEL PEDIDO
- Trigger SQL para calcular estado basado en items
- solicitado → en_gestion → confirmado (automáticos)
- enviado → entregado (manuales)
- Función rechazar_pedido_completo()

💳 GESTIÓN DE PAGOS (GestionPagos.js)
- Diseño con cards separadas (Resumen + Historial)
- Solo permite pagos en estados: confirmado, enviado, entregado
- Separador visual entre artículos y pagos
- Fix: recargarPedido() incluye JOIN con clientes

📋 LISTADO DE PEDIDOS (pedidos-page.js)
- Estados corregidos: solicitado, en_gestion, confirmado, rechazado, enviado, entregado
- Muestra saldo pendiente y motivo de rechazo
- Pedidos rechazados con estilo visual diferenciado

📝 DETALLE DE PEDIDO (pedido-detalle-page.js)
- Botón 'Rechazar Pedido' con validación de pagos
- Modal de rechazo con motivo obligatorio
- Tarjeta de motivo de rechazo visible
- Modal editar: solo estados manuales (enviado, entregado)

🗄️ SQL (estados-pedido-automaticos.sql)
- Campo motivo_rechazo en tabla pedidos
- Triggers en pedido_items para actualizar estado_pedido
- Migración de pedidos existentes
"

# Push
echo ""
echo -e "${BLUE}🚀 Subiendo cambios a origen...${NC}"
git push origin main

echo ""
echo -e "${GREEN}✅ ¡Commit completado exitosamente!${NC}"
echo ""
echo "=========================================="
echo "RESUMEN DE CAMBIOS:"
echo "- GestionPagos.js (nuevo diseño + validación estados)"
echo "- pedidos-page.js (estados corregidos)"
echo "- pedido-detalle-page.js (rechazo + modal editar)"
echo "- estados-pedido-automaticos.sql (triggers)"
echo "=========================================="