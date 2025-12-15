#!/bin/bash

# ============================================
# SCRIPT DE COMMIT - Sesión Diciembre 14, 2025
# Chic Import USA - pricingEngine + Simplificación Estados
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

# Mostrar qué se va a commitear
echo ""
echo -e "${BLUE}📦 Archivos preparados para commit:${NC}"
git status --short
echo ""

# Hacer el commit
echo -e "${YELLOW}💾 Creando commit...${NC}"
git commit -m "feat: Implementar pricingEngine.js unificado + Simplificar estados de productos

🔧 MOTOR DE PRECIOS UNIFICADO (pricingEngine.js)
================================================
✅ Implementado en Productos Normales (igual que Productos Rápidos)
✅ Única fuente de verdad para cálculos de precios
✅ Funciones: calculatePricing(), crearPricingInput(), formatearCOP()
✅ Soporte completo para descuentos en ambos tipos de productos

📐 CAMPOS CALCULADOS POR EL MOTOR:
- precio_con_tax_usd: Precio base + TAX
- costo_total_usd/cop: Costo con descuento aplicado
- precio_sugerido_cop: Costo + margen (sin descuento)
- valor_producto_cop: Precio sin descuento (para mostrar tachado)
- precio_final_cop: Precio de venta real
- ganancia_cop: Utilidad por producto
- descuento_cop: Ahorro del cliente

🎨 REORGANIZACIÓN DE FORMULARIOS
================================
✅ Imagen movida AL FINAL del formulario (después de cálculos)
✅ La imagen solo aparece cuando hay cálculos válidos
✅ Flujo: Datos → Precios → Cálculos → Imagen → Guardar

🚫 FUNCIONALIDAD ELIMINADA
==========================
❌ Precio manual (checkbox + input)
❌ Estados borrador/oculto
❌ Botón Publicar
❌ Botón Ocultar
❌ ESTADOS_PRODUCTO constante
❌ handlePublicarProducto()
❌ handleOcultarProducto()
❌ getAccionesProducto() (simplificado)

✅ FUNCIONALIDAD SIMPLIFICADA
=============================
✅ Productos se crean directamente como 'publicado'
✅ Solo 3 botones: Editar, Eliminar, Compartir WhatsApp
✅ Sin badge de estado en tarjetas (todos son publicados)
✅ Campo de descuento agregado al formulario

📱 WHATSAPP - IMAGEN GENERADA CON DESCUENTOS
============================================
✅ Badge de descuento rojo (-X%) en esquina superior
✅ Precio tachado cuando hay descuento
✅ Precio final grande (dorado)
✅ Texto '🔥 Ahorras \$XXX' cuando aplica
✅ Productos Normales: Bloque azul elegante + título/marca/descripción
✅ Productos Rápidos: Bloque naranja + solo precios

📁 ARCHIVOS MODIFICADOS:
- app/admin/listas/[id]/productos/page.js
- app/admin/listas/[id]/productos-rapidos/page.js
- lib/pricingEngine.js (referencia)
"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Commit creado exitosamente${NC}"
else
    echo -e "${RED}❌ Error al crear commit${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🚀 Haciendo push a GitHub...${NC}"
git push

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Push completado exitosamente${NC}"
    echo ""
    echo -e "${BLUE}📊 Último commit:${NC}"
    git log -1 --oneline
else
    echo -e "${RED}❌ Error en push. Intenta manualmente: git push${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}🎉 Proceso completado${NC}"
echo "========================================"