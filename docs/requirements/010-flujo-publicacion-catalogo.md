# 🧩 Sesión 010 — Especificación Funcional  
## Flujo de Publicación y Catálogo Público  
### PWA Import Marketplace – Chic Import USA

**Versión:** v0.5.0  
**Fecha:** Noviembre 2025  
**Autor:** ChatGPT (Especificación funcional)  
**Implementación técnica:** Claude  

---

# 1. Objetivo del módulo

Definir de manera detallada el **flujo completo de publicación** para listas y productos, y establecer el **Catálogo Público** accesible sin autenticación.

El módulo habilita:

- Publicación, cierre y archivo de listas.  
- Publicación y ocultamiento de productos.  
- Construcción del catálogo público donde clientes pueden visualizar ofertas activas.

Este documento contiene **especificación funcional**, sin código.  
Toda implementación es responsabilidad de **Claude**.

---

# 2. Estados formales involucrados

## 2.1 Listas (listas_oferta.estado)

- **borrador**  
- **publicada**  
- **cerrada**  
- **archivada**

### Reglas:

- Solo `publicada` y `cerrada` son visibles en el catálogo público.  
- `cerrada` ya no permite agregar ni modificar productos.  
- `archivada` desaparece completamente del catálogo.  
- `publicada` requiere al menos un producto publicable.

---

## 2.2 Productos (productos.estado)

- **borrador**  
- **listo_para_publicar**  
- **publicado**  
- **oculto**

### Reglas:

- Solo `publicado` es visible en el catálogo.  
- `oculto` jamás debe mostrarse públicamente.  
- `borrador` y `listo_para_publicar` solo se ven en el panel admin.

---

# 3. Flujo funcional de publicación

## 3.1 Publicar una lista

**Acción:** *Publicar lista*  
**Desde estado:** `borrador`

Validaciones:
- Debe tener al menos 1 producto publicable.  
- TRM configurada.  
- TAX configurado.  
- Cálculos completos (costo total, precio final, ganancia).  

Resultados:
- Lista → `publicada`  
- Productos en `listo_para_publicar` → `publicado`  
- Lista aparece en `/catalogo`

---

## 3.2 Cerrar una lista

**Acción:** *Cerrar lista*  
**Desde estado:** `publicada`

Resultados:
- Lista → `cerrada`  
- Sigue visible.  
- No permite agregar ni modificar productos.

---

## 3.3 Archivar una lista

**Acción:** *Archivar lista*  
**Desde estado:** `publicada` o `cerrada`

Resultados:
- Lista → `archivada`  
- Desaparece del catálogo público.  
- No admite más cambios.

---

## 3.4 Publicar producto

**Acción:** *Publicar producto*  
**Solo si lista está en estado:** `publicada`

Validaciones:
- Producto en `listo_para_publicar`.  
- Debe tener: costo total COP, precio final, ganancia.

---

## 3.5 Ocultar producto

**Acción:** *Ocultar producto*  

Resultados:
- Producto → `oculto`  
- No aparece en catálogo público.

---

# 4. Catálogo Público (Frontend)

Rutas principales:

/catalogo
/catalogo/:id_lista
/catalogo/:id_lista/:id_producto


Características clave:

- 100% accesible sin autenticación.  
- Debe usar el sistema de diseño Chic Import USA:  
  - Dorado, esmeralda, bordeaux  
  - Playfair Display (títulos) / Inter (cuerpo)  
  - Cards elevadas, sombras suaves  

---

# 5. Comportamiento del catálogo público

## 5.1 Listado de listas disponibles

Ruta: `/catalogo`

Visibles:
- Listas en estado `publicada`  
- Listas en estado `cerrada`

Información por card:
- Título  
- Descripción  
- Fecha de oferta  
- Badge de estado  
- Contador de productos publicados  
- Botón “Ver oferta”

Ordenamiento:
- Primero `publicada`, luego `cerrada`  
- Dentro del mismo estado: fecha_oferta DESC

---

## 5.2 Vista de productos de una lista

Ruta: `/catalogo/:id_lista`

Debe mostrar SOLO productos:
- `publicado`

Información por card:
- Imagen principal  
- Título  
- Marca  
- Precio final COP  
- Botón “Ver detalles”

No mostrar:
- Costos internos  
- Ganancias  
- Cálculos de TRM o TAX  

---

## 5.3 Vista detallada del producto

Ruta: `/catalogo/:id_lista/:id_producto`

Contenido:
- Carrusel de imágenes  
- Título  
- Marca  
- Descripción  
- Precio final COP  
- Badge del estado (si aplica)

Datos ocultos al público:
- TRM  
- TAX  
- Costo  
- Ganancia  

---

# 6. Comportamientos adicionales

### 6.1 Publicar lista
- Cambia todos los productos `listo_para_publicar` a `publicado`.

### 6.2 Cerrar lista
- La lista sigue visible.  
- No se pueden agregar o editar productos.

### 6.3 Archivar lista
- Lista desaparece del catálogo.  
- Productos también desaparecen.

### 6.4 Producto oculto
- No se muestra, ni siquiera si la lista está activa.

---

# 7. UI Administrativa

## 7.1 Acciones en listas

| Estado actual | Acciones disponibles |
|--------------|----------------------|
| borrador     | Publicar, Archivar   |
| publicada    | Cerrar, Archivar     |
| cerrada      | Archivar             |
| archivada    | *(ninguna)*          |

---

## 7.2 Acciones en productos

| Estado actual           | Acciones disponibles |
|------------------------|----------------------|
| borrador               | *(ninguna)*         |
| listo_para_publicar    | Publicar producto   |
| publicado              | Ocultar producto    |
| oculto                 | Publicar            |

---

# 8. Validaciones obligatorias

Una lista NO puede publicarse si:
- No tiene productos publicables.  
- No tiene TRM configurada.  
- No tiene TAX configurado.  

Un producto NO puede publicarse si:
- Su lista no está publicada.  
- Faltan cálculos financieros.  

Una lista cerrada:
- No admite productos nuevos.  

Una lista archivada:
- No admite ningún cambio.  

---

# 9. Criterios de aceptación

1. El catálogo público muestra únicamente listas publicadas y cerradas.  
2. Cada lista presenta solo productos publicados.  
3. El flujo de publicación cumple validaciones estrictas.  
4. El admin puede ejecutar acciones de publicación/cierre/archivo.  
5. Productos ocultos no aparecen en catálogo.  
6. Listas archivadas desaparecen del catálogo.  
7. La navegación pública fluye correctamente:  
   `/catalogo → /catalogo/:id_lista → /catalogo/:id_lista/:id_producto`  
8. La interfaz pública respeta el sistema de diseño Chic Import USA.  

---

# 10. Entregables esperados por Claude

- Implementación completa del flujo de publicación.  
- Implementación del Catálogo Público (3 vistas).  
- Lógica y validaciones de estados.  
- Ajustes requeridos en BD y RLS.  
- UI pública con sistema de diseño aplicado.  
- Componentes públicos: lista de ofertas, grid de productos, detalle.  

---

**FIN — Sesión 010  
Flujo de Publicación y Catálogo Público**



