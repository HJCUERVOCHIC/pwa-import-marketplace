# 🧩 Sesión 011 — Especificación Funcional  
## Compartir productos y listas por WhatsApp  
### PWA Import Marketplace – Chic Import USA

**Versión:** v0.6.0  
**Fecha:** Noviembre 2025  
**Autor:** ChatGPT (Especificación funcional)  
**Implementación técnica:** Claude  

---

# 1. Objetivo del módulo

Permitir que los administradores compartan fácilmente, a través de WhatsApp, los productos publicados o las listas completas de ofertas dentro del Marketplace, usando mensajes preformateados y URLs públicas, garantizando rapidez, simplicidad y compatibilidad total con dispositivos móviles y escritorio.

Este módulo busca que el proceso sea **sencillo, eficiente y sin complejidad técnica** para los usuarios administradores.

---

# 2. Alcance

Este módulo incluye:

- Compartir **productos publicados** por WhatsApp.
- Compartir **listas completas** por WhatsApp.
- Generación automática de mensajes preformateados.
- Construcción dinámica de URLs públicas válidas.
- Botones y acciones visibles en la interfaz administrativa.

Este módulo **NO incluye**:

- Envíos automáticos o masivos.
- Integración con WhatsApp Business API.
- Cambios en la lógica de estados de productos o listas.
- Procesamiento de respuestas del usuario por WhatsApp.

---

# 3. Estados permitidos para compartir

## 3.1 Listas
Una lista solo puede compartirse si se encuentra en:

- **publicada**
- **cerrada**

Listas en `borrador` o `archivada` no deben permitir acciones de compartir.

## 3.2 Productos
Un producto solo puede compartirse si se encuentra:

- **publicado**

Productos en `borrador`, `listo_para_publicar` o `oculto` no deben permitir ser compartidos.

---

# 4. Reglas funcionales

## 4.1 Formato del mensaje para compartir un producto

El mensaje debe incluir:

- Título
- Marca
- Precio final COP
- URL pública del producto

Ejemplo:

Jordan 1 Mid
Marca: Nike
Precio: $385.000 COP

🔗 https://tusitio.com/catalogo/:id_lista/:id_producto


---

## 4.2 Formato del mensaje para compartir una lista

El mensaje debe incluir:

- Título de la lista
- Cantidad de productos publicados
- Listado resumido de productos (máximo 10)
- URL pública de la lista

Ejemplo:

¡Nueva oferta disponible en Chic Import USA! 🎉

Jordan 1 Mid — $385.000 COP

Vans SK8 — $245.000 COP

Nike Blazer — $299.000 COP

Ver todos los productos aquí:
🔗 https://tusitio.com/catalogo/:id_lista


Si hay más de 10 productos:

> Mostrar solo los primeros 10 y luego agregar  
> **"... y más productos disponibles en el enlace."**

---

# 5. Generación de URLs públicas

URLs generadas:

### Para una lista:

/catalogo/:id_lista


### Para un producto:
/catalogo/:id_lista/:id_producto


Al compartir siempre deben ser absolutas:
https://dominio.com/catalogo/:id_lista

https://dominio.com/catalogo/:id_lista/:id_producto


---

# 6. Mecanismo técnico para enviar por WhatsApp

WhatsApp permite abrir un chat con texto prellenado a través de:
https://wa.me/?text=<URL_ENCODED_MESSAGE>


Claude debe:

1. Construir el texto completo.
2. Realizar URL encoding del mensaje.
3. Open / redirect a `https://wa.me`.
4. Abrirlo en una nueva pestaña.
5. Funcionar tanto en móvil como escritorio.

---

# 7. Ubicación de botones en la UI

## 7.1 En panel administrativo

### Para cada **producto** en estado `publicado`:
Botón:
[ Compartir por WhatsApp ]

Ubicación: dentro de la ProductCard del admin.

### Para cada **lista** en estado `publicada` o `cerrada`:
Botón:
[ Compartir Lista por WhatsApp ]

Ubicación: header de la página de detalle de la lista.

---

## 7.2 Opcional (catálogo público)

En el catálogo público puede agregarse un botón:
[ Compartir ]

En cada página de producto.

---

# 8. Validaciones

1. No permitir compartir productos en `borrador`, `listo_para_publicar` o `oculto`.  
2. No permitir compartir listas en `borrador` o `archivada`.  
3. Verificar que la lista tenga al menos **1 producto publicado** antes de compartirla.  
4. Validar que el mensaje generado respete límites de WhatsApp (~4000 caracteres).  
5. Realizar URL-encoding correcto para caracteres especiales.  
6. El mensaje debe ser legible, con saltos de línea y secciones limpias.

---

# 9. Criterios de aceptación

1. El administrador puede compartir cualquier producto publicado con un clic.  
2. El administrador puede compartir listas completas desde su página correspondiente.  
3. WhatsApp se abre correctamente con el mensaje preformateado.  
4. Los enlaces llevan al usuario al producto o lista adecuada.  
5. El mensaje mantiene formato claro y estético (negritas, saltos de línea).  
6. En listas largas, se muestran solo los primeros 10 productos.  
7. La funcionalidad es compatible con móvil y escritorio.  
8. Los botones solo aparecen cuando la acción es válida según estados.

---

# 10. Entregables esperados por Claude

- Botones adicionales en la interfaz administrativa.  
- Funciones de generación de mensaje y codificación para WhatsApp.  
- Construcción dinámica de URLs públicas.  
- Apertura correcta de `https://wa.me`.  
- Validaciones basadas en estados de listas y productos.  
- Pruebas funcionales del flujo.

---

**FIN — Sesión 011  
Compartir productos y listas por WhatsApp**




