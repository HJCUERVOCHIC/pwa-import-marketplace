# ESPECIFICACION – Ajustes Finos al Flujo de Pedidos (CON PLANTILLA WHATSAPP)
Módulo: Pedidos  
Proyecto: Chic Import USA  
Versión: 1.3  
Fecha: _(definir)_

---

## 1. Objetivo

Ajustar y robustecer el flujo de pedidos para permitir:

- Complementar cada producto solicitado con información adicional (talla, sexo, descripción).
- Implementar un manejo claro de estados por artículo del pedido.
- Implementar un manejo automático y coherente de estados del pedido en función del estado de sus artículos.
- Integrar el flujo de confirmación del producto por parte del cliente vía WhatsApp.
- Garantizar que solo los artículos válidos participen en las sumatorias del pedido.

---

## 2. Datos adicionales por producto solicitado (pedido_items)

Cada artículo del pedido debe permitir complementar la solicitud con los siguientes campos **opcionales y editables**:

- `talla` (text)
- `sexo` (enum/text): `hombre`, `mujer`, `unisex`, `niños`
- `descripcion_detallada` (text)

Estos campos:
- No son obligatorios al crear el artículo.
- Se editan desde la pantalla de detalle del pedido.
- Deben mostrarse claramente asociados a cada artículo.

---

## 3. Estados del producto dentro del pedido (pedido_items)

### 3.1 Estados permitidos

1. **solicitado**
   - Estado inicial.
   - Artículo solicitado por el cliente.
   - Participa en sumatorias.

2. **encontrado**
   - ChicImportUSA localizó el producto.
   - Requiere carga de imágenes (ver 3.2).
   - Participa en sumatorias.

3. **confirmado**
   - Cliente confirma el producto.
   - Se procede con compra, envío y entrega.
   - Participa en sumatorias.

4. **rechazado**
   - Cliente no confirma el producto.
   - ❌ Se excluye de TODAS las sumatorias.
   - Es el único estado que descuenta valor del pedido.

---

### 3.2 Reglas obligatorias para estado “encontrado”

Cuando un artículo pasa a estado `encontrado`, el sistema debe exigir:

1. **Carga obligatoria de 1 imagen**
   - Foto clara del producto encontrado.

2. **Carga opcional de imagen adicional**
   - Imagen con tallas, medidas o información complementaria.

3. **Persistencia**
   - Las imágenes deben almacenarse en Supabase Storage.
   - Asociadas al `pedido_item`.

4. **Generación del mensaje de WhatsApp**
   - El sistema debe generar automáticamente un mensaje con la plantilla definida en el punto 8.
   - El mensaje debe incluir las imágenes cargadas.

5. **Envío del mensaje**
   - Puede ser automático o manual asistido mediante botón:
     - “Enviar confirmación por WhatsApp”
   - Debe registrarse que el mensaje fue enviado.

---

### 3.3 Confirmación o rechazo del cliente

- **Si el cliente confirma**:
  - `estado_item = confirmado`
  - El artículo sigue en sumatorias.

- **Si el cliente rechaza o no confirma**:
  - `estado_item = rechazado`
  - El artículo:
    - Se excluye de:
      - total_items
      - total_venta_cop
      - total_costo_cop
      - total_ganancia_cop

---

## 4. Manejo de estados del pedido (pedidos)

### 4.1 Estados del pedido

1. **solicitado**
   - Estado inicial.
   - Todos los artículos están en `solicitado`.

2. **en_gestion**
   - Automático cuando al menos un artículo cambia a:
     - `encontrado`
     - `confirmado`
     - `rechazado`

3. **rechazado**
   - Automático cuando TODOS los artículos están en `rechazado`.

4. **Estados manuales**
   - `confirmado`
   - `enviado`
   - `entregado`
   - Gestionados manualmente por ChicImportUSA.

---

### 4.2 Reglas automáticas del pedido

- Todos `solicitado` → pedido = `solicitado`
- Al menos uno ≠ `solicitado` → pedido = `en_gestion`
- Todos `rechazado` → pedido = `rechazado`

---

## 5. Impacto en sumatorias

- Estados que SÍ suman:
  - `solicitado`
  - `encontrado`
  - `confirmado`

- Estado que NO suma:
  - `rechazado`

Sumatorias afectadas:
- total_items
- total_venta_cop
- total_costo_cop
- total_ganancia_cop

---

## 6. Restricciones clave

- ❌ No se puede pasar a `encontrado` sin imagen obligatoria.
- ❌ No se puede confirmar sin haber estado en `encontrado`.
- ❌ Un artículo rechazado nunca participa en sumatorias.
- ❌ El pedido no se confirma automáticamente.

---

## 7. Registro y trazabilidad

El sistema debe poder mostrar:
- Fecha de cambio de estado del artículo.
- Si el mensaje de WhatsApp fue enviado.
- Estado actual del artículo y del pedido.

---

## 8. PLANTILLA OFICIAL DE MENSAJE WHATSAPP (OBLIGATORIA)

Esta es la **ÚNICA plantilla permitida** para solicitar confirmación al cliente.

### 8.1 Plantilla base

```
Hola 👋

Hemos encontrado el producto que solicitaste en Chic Import USA 🇺🇸✨

🛍️ Producto: {{titulo_articulo}}
👤 Sexo: {{sexo | "No especificado"}}
📏 Talla: {{talla | "No especificada"}}
📝 Detalles: {{descripcion_detallada | "Sin observaciones"}}

📸 Te enviamos la imagen del producto encontrado para que la revises.

Por favor confírmanos respondiendo a este mensaje:

✅ *CONFIRMAR*  
❌ *RECHAZAR*

Tan pronto confirmes, procederemos con la compra y el proceso de envío 📦✈️

Gracias por confiar en Chic Import USA 💙
```

### 8.2 Reglas de uso de la plantilla

- Los placeholders (`{{ }}`) deben reemplazarse por los datos reales del `pedido_item`.
- Si un campo opcional no existe, usar el texto por defecto indicado.
- El mensaje debe enviarse junto con:
  - La imagen obligatoria del producto.
  - La imagen adicional si existe.

---

## 9. Resultado esperado

- El cliente confirma explícitamente cada artículo.
- ChicImportUSA tiene control total del flujo.
- Los totales del pedido reflejan únicamente artículos válidos.
- Se elimina cualquier ambigüedad en estados y valores.

---

**Fin de la especificación**
