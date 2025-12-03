# Checklist de Salida a Producción – Chic Import USA
Versión: 1.0  
Fecha: _(colocar fecha de despliegue)_

Este documento define todos los pasos necesarios para lanzar oficialmente la plataforma Chic Import USA a producción, asegurando estabilidad, seguridad y operatividad.

---

# 1. Configuración Técnica

## 1.1 Dominio y Certificados
- [ ] Dominio configurado en Vercel.
- [ ] Certificado SSL activo.
- [ ] URL de producción definida:
  - [ ] `https://TU-DOMINIO.com/catalogo`
  - [ ] `https://TU-DOMINIO.com/admin`

## 1.2 Variables de Entorno
- [ ] `SUPABASE_URL` (producción)
- [ ] `SUPABASE_ANON_KEY` (segura, pública)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Ninguna clave sensitive (Service Role Key) expuesta en el frontend.

## 1.3 Build y Calidad del Código
- [ ] `npm run build` sin errores críticos.
- [ ] Eliminar `console.log` de debugging.
- [ ] Quitar dependencias no usadas.
- [ ] Pages y componentes reorganizados correctamente.

---

# 2. Seguridad y Gover­nanza

## 2.1 Protección de Rutas
- [ ] `/admin` requiere usuario autenticado.
- [ ] Redirección automática si no hay sesión.

## 2.2 Supabase – Row Level Security (RLS)
Activar RLS en:
- [ ] `listas_oferta`
- [ ] `productos`
- [ ] `clientes`
- [ ] `pedidos`
- [ ] `pedido_items`

Policies mínimas:
- [ ] Los usuarios no autenticados no pueden leer datos internos.
- [ ] El catálogo público solo puede leer productos publicados.
- [ ] Solo administradores pueden ver costos, TRM, TAX y ganancias.

## 2.3 Backup y Restauración
- [ ] Habilitar backups automáticos en Supabase.
- [ ] Ensayar una restauración de backup (validar que funciona).
- [ ] Exportar tablas críticas a CSV:
  - [ ] productos
  - [ ] listas_oferta
  - [ ] clientes
  - [ ] pedidos
  - [ ] pedido_items

---

# 3. Pruebas Funcionales (QA)

## 3.1 Catálogo Público
- [ ] Carga correcta de `/catalogo`.
- [ ] Las listas publicadas se muestran correctamente.
- [ ] Los productos publicados se muestran con:
  - [ ] Imagen
  - [ ] Título
  - [ ] Descripción
  - [ ] Categoría (emoji)
  - [ ] Precio final COP
- [ ] No se muestra:
  - [ ] TRM
  - [ ] TAX
  - [ ] Precio base USD
  - [ ] Costo
  - [ ] Ganancia
- [ ] Botón de WhatsApp abre correctamente.
- [ ] Meta tags cargan bien al compartir productos.

## 3.2 Admin – Listas de Oferta
- [ ] CRUD de listas funciona.
- [ ] Configuración correcta de:
  - [ ] TRM
  - [ ] TAX
  - [ ] Márgenes
- [ ] Estados de la lista cambian bien (borrador → publicada → cerrada).

## 3.3 Admin – Productos
- [ ] CRUD de productos por lista funciona.
- [ ] Subida de imágenes desde móvil.
- [ ] Cálculo automático:
  - [ ] Precio final COP
  - [ ] Costo
  - [ ] Ganancia
- [ ] Estado del producto:
  - [ ] Borrador
  - [ ] Publicado
  - [ ] Oculto

## 3.4 Admin – Módulo de Clientes
- [ ] Crear cliente con solo teléfono.
- [ ] Editar cliente.
- [ ] Búsqueda por teléfono, nombre o alias.
- [ ] No permite duplicar números de teléfono.

## 3.5 Admin – Módulo de Pedidos
### Creación de pedido
- [ ] Selección o creación de cliente funciona.
- [ ] Pedido se crea correctamente con `estado_pedido = nuevo`.

### Agregar artículos
- [ ] Búsqueda de productos interna funciona.
- [ ] Snapshot de precios/costos funciona:
  - [ ] `precio_venta_cop` = precio ofrecido
  - [ ] `costo_cop` = costo de la lista
- [ ] Campos adicionales funcionan:
  - [ ] Talla
  - [ ] Género
  - [ ] Descripción detallada
- [ ] Cantidad editable.
- [ ] `fue_encontrado` funciona correctamente.

### Fechas del pedido
- [ ] Fecha de solicitud prellenada.
- [ ] Fecha probable de envío editable.
- [ ] Fecha de entrega actualiza estado a "entregado" si aplica.

### Totales
- [ ] Totales calculados correctamente:
  - [ ] total_items
  - [ ] total_venta_cop
  - [ ] total_costo_cop
  - [ ] total_ganancia_cop

---

# 4. Pruebas de Performance

- [ ] Lighthouse > 80 en móvil y desktop.
- [ ] Imágenes optimizadas (peso razonable).
- [ ] Lazy-loading habilitado en catálogo.
- [ ] Carga rápida en conexiones móviles (3G/4G).

---

# 5. Pruebas Reales (Operación Piloto)

## 5.1 Simulación interna
- [ ] Crear 2–3 listas reales.
- [ ] Publicar 20–30 productos.
- [ ] Crear 5–10 clientes reales.
- [ ] Crear 5–10 pedidos completos.
- [ ] Agregar y marcar artículos encontrados.
- [ ] Registrar entregas reales.

## 5.2 Prueba con vendedores
- [ ] Crear usuario admin para vendedor.
- [ ] Vendedor debe:
  - [ ] Crear lista
  - [ ] Crear cliente
  - [ ] Crear pedido
  - [ ] Agregar artículos
  - [ ] Marcar encontrados
  - [ ] Registrar entrega

## 5.3 Validación de Flujo Completo
- [ ] Cliente → Catálogo → WhatsApp → Pedido → Compra → Envío → Entrega  
  funciona de principio a fin sin fallas.

---

# 6. Preparación Operativa del Negocio

## 6.1 Manual Interno
- [ ] Definir cómo se crea una oferta estándar.
- [ ] Definir cómo manejar pedidos desde WhatsApp.
- [ ] Definir tiempos de envío y reglas internas.

## 6.2 Datos y Métricas
- [ ] Revisión semanal de:
  - [ ] Productos más vistos
  - [ ] Productos más pedidos
  - [ ] Ganancia por lista
  - [ ] Márgenes promedio
- [ ] Preparar dashboard simple (opcional).

---

# 7. Despliegue Final

- [ ] Hacer deploy en Vercel (última versión).
- [ ] Verificar logs de producción durante 24–48 horas.
- [ ] Verificar estabilidad del catálogo con tráfico real.
- [ ] Activar PWA (si aplica) para pruebas en móvil.

---

# 8. Checklist final antes de decir “PRODUCCIÓN OFICIAL”

- [ ] Catálogo 100% funcionando.
- [ ] Admin sin errores.
- [ ] Módulo de clientes 100% estable.
- [ ] Módulo de pedidos 100% funcional.
- [ ] Cálculos y snapshots verificados.
- [ ] Seguridad y RLS verificados.
- [ ] Piloto interno exitoso.
- [ ] Piloto con vendedor validado.
- [ ] Backups activados.
- [ ] Dominio configurado.
- [ ] Logs limpios.
- [ ] Operación lista para escala.

---

# Estado final
**La plataforma está lista para uso oficial cuando todos los checkboxes anteriores están en verde.**

