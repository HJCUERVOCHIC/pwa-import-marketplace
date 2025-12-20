# RESUMEN MÓDULO DE PEDIDOS
## Chic Import USA - 18 Diciembre 2024

---

## 📊 ESTADOS IMPLEMENTADOS

### Estados del PEDIDO (6 estados)

| Estado | Descripción | Automático | Manual |
|--------|-------------|------------|--------|
| `solicitado` | Todos los items están en solicitado | ✅ | |
| `en_gestion` | Al menos un item ≠ solicitado | ✅ | |
| `rechazado` | TODOS los items fueron rechazados | ✅ | |
| `confirmado` | Cliente confirmó el pedido completo | | ✅ |
| `enviado` | Pedido fue despachado | | ✅ |
| `entregado` | Cliente recibió el pedido | | ✅ |

### Estados del ITEM (4 estados)

| Estado | Descripción | Participa en totales |
|--------|-------------|---------------------|
| `solicitado` | Estado inicial al agregar producto | ✅ SÍ |
| `encontrado` | Producto localizado, imagen subida | ✅ SÍ |
| `confirmado` | Cliente confirmó este artículo | ✅ SÍ |
| `rechazado` | Cliente rechazó este artículo | ❌ NO |

---

## 🔄 FLUJO DE TRABAJO

```
┌─────────────┐
│ SOLICITADO  │ ← Estado inicial
└──────┬──────┘
       │ (subir imagen obligatoria)
       ▼
┌─────────────┐
│ ENCONTRADO  │ → Enviar WhatsApp al cliente
└──────┬──────┘
       │
       ├────────────────┐
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│ CONFIRMADO  │  │ RECHAZADO   │
│ (suma)      │  │ (NO suma)   │
└─────────────┘  └─────────────┘
```

---

## 📱 WHATSAPP - IMAGEN DE CONFIRMACIÓN

### Características:
- **Una sola imagen** por artículo (no importa cuántas fotos tenga)
- Si hay 1 foto → Imagen completa + texto
- Si hay 2 fotos → Ambas fotos lado a lado + texto
- Usa `navigator.share()` (Web Share API)
- Fallback: descarga la imagen si no soporta Web Share

### Contenido de la imagen:
```
┌─────────────────────────────────────┐
│  ENCONTRADO              [N fotos]  │
│                                     │
│    [FOTO 1]    │    [FOTO 2]       │
│                                     │
├─────────────────────────────────────┤
│  Chic Import USA                    │
│  ─────────────────────────────────  │
│  Producto: [nombre]                 │
│  Sexo: [sexo]                       │
│  Talla: [talla]                     │
│  Detalles: [descripción]            │
│  ─────────────────────────────────  │
│  Por favor confirma respondiendo:   │
│  CONFIRMAR        RECHAZAR          │
│                                     │
│     Gracias por confiar en Chic...  │
└─────────────────────────────────────┘
```

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Tabla: `pedidos`
```sql
- id (uuid, PK)
- codigo_pedido (text, único)
- cliente_id (FK → clientes)
- lista_oferta_id (FK → listas_oferta)
- estado_pedido (text) -- solicitado, en_gestion, rechazado, confirmado, enviado, entregado
- fecha_solicitud (timestamp)
- fecha_confirmacion (timestamp, nullable)
- fecha_envio (timestamp, nullable)
- fecha_entrega (timestamp, nullable)
- total_items (int)
- total_venta_cop (numeric)
- total_costo_cop (numeric)
- total_ganancia_cop (numeric)
- notas (text, nullable)
```

### Tabla: `pedido_items`
```sql
- id (uuid, PK)
- pedido_id (FK → pedidos)
- producto_id (FK → productos)
- lista_oferta_id (FK → listas_oferta)
- titulo_articulo (text) -- SNAPSHOT
- precio_venta_cop (numeric) -- SNAPSHOT
- costo_cop (numeric) -- SNAPSHOT
- ganancia_cop (numeric) -- GENERADO
- cantidad (int)
- estado_item (text) -- solicitado, encontrado, confirmado, rechazado
- talla (text, nullable)
- genero (text, nullable) -- hombre, mujer, unisex, niños
- descripcion_detallada (text, nullable)
- imagenes_encontrado (jsonb) -- URLs de imágenes subidas
- whatsapp_enviado (boolean)
- fecha_whatsapp_enviado (timestamp, nullable)
- fecha_estado_cambio (timestamp)
```

### Triggers activos:
1. `trigger_actualizar_estado_pedido` - Actualiza estado del pedido automáticamente
2. `recalcular_totales_pedido` - Recalcula totales excluyendo rechazados

---

## 📁 ARCHIVOS DEL MÓDULO

### Componentes React:
```
src/app/admin/pedidos/
├── page.js                    # Listado de pedidos
└── [id]/
    └── page.js                # Detalle de pedido (ACTUALIZADO)

src/components/
└── ModalAgregarAPedido.js     # Modal para agregar productos (ACTUALIZADO)
```

### Servicios:
```
src/services/
└── whatsappService.js         # Servicio de WhatsApp (ACTUALIZADO)
```

### Storage (Supabase):
```
Bucket: pedido-items-encontrados (público)
- Políticas RLS configuradas para INSERT, SELECT, UPDATE, DELETE
```

---

## ✅ FUNCIONALIDADES COMPLETADAS

- [x] Crear pedido desde catálogo de productos
- [x] Agregar productos a pedido existente
- [x] Estados de items (solicitado → encontrado → confirmado/rechazado)
- [x] Estados automáticos del pedido según items
- [x] Subida obligatoria de imagen para "encontrado"
- [x] Soporte para 1 o 2 imágenes por artículo
- [x] Generación de imagen de confirmación con canvas
- [x] Compartir por WhatsApp (Web Share API)
- [x] Totales excluyen artículos rechazados
- [x] Edición de talla, sexo, descripción detallada
- [x] Visualización de imágenes del producto encontrado
- [x] Indicador de WhatsApp enviado con fecha

---

## ⚠️ PENDIENTES

- [ ] Revisar filtros en página de listado de pedidos (`src/app/admin/pedidos/page.js`)
- [ ] Dashboard con métricas de pedidos
- [ ] Reportes de ventas y ganancias
- [ ] Notificaciones de nuevos pedidos
- [ ] Historial de cambios de estado

---

## 🚀 ARCHIVOS MODIFICADOS EN ESTA SESIÓN

1. `src/app/admin/pedidos/[id]/page.js` - Detalle de pedido con WhatsApp mejorado
2. `src/components/ModalAgregarAPedido.js` - Agregado estado 'solicitado' a filtros
3. `src/services/whatsappService.js` - Eliminada dependencia de APP_CONFIG
4. SQL: `storage_policies.sql` - Políticas RLS para bucket
5. SQL: `migracion_flujo_pedidos.sql` - Triggers y funciones

---

## 📝 COMANDOS GIT SUGERIDOS

```bash
cd nextjs-app

git add .

git commit -m "feat(pedidos): WhatsApp con imagen combinada y estados corregidos

- Genera una sola imagen combinando múltiples fotos + texto
- Agregado estado 'solicitado' a filtros del modal
- Estado inicial del pedido cambiado a 'solicitado'
- Mejorado manejo de canvas para múltiples imágenes
- Políticas RLS para bucket de storage"

git push origin main
```
