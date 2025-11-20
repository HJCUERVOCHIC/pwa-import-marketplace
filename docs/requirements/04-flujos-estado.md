# 🧩 04 Flujos de estado  – Especificación de Flujos de Cambio de Estado (Listas y Productos)
**Versión:** v0.4.1  
**Fecha:** Noviembre 2025  
**Autor:** ChatGPT (Especificaciones)  
**Proyecto:** PWA Import Marketplace  

> Nota: Este documento es **solo de especificación funcional**. Toda la codificación será responsabilidad de **Claude**. No se incluyen ejemplos de código, estructuras técnicas ni consultas SQL.

---

## 1) Objetivo
Definir con precisión los **flujos de cambio de estado** para las entidades **Listas** y **Productos**, incluyendo reglas de negocio, validaciones, visibilidad en el catálogo público, comportamiento de la interfaz administrativa y criterios de aceptación. El CRUD ya existe y no forma parte de este alcance.

---

## 2) Alcance
- **Incluye**: estados permitidos, transiciones válidas, reglas de consistencia, visibilidad pública por estado, acciones de UI en el área admin, mensajería/errores, auditoría de eventos, y criterios de prueba.
- **No incluye**: diseño visual avanzado, cambios en el modelo físico de datos, migraciones técnicas, integración de almacenamiento de imágenes, ni características PWA.

---

## 3) Actores y roles
- **Administrador** (autenticado): crea listas y productos (existente) y ejecuta **cambios de estado** conforme a las reglas aquí definidas.
- **Usuario anónimo** (no autenticado): visualiza el **catálogo público** con los criterios de visibilidad definidos.
- **Sistema**: aplica las reglas, valida transiciones, registra eventos y devuelve mensajes claros de éxito/error.

---

## 4) Definiciones
- **Lista**: conjunto de productos agrupados con metadatos (título, descripción, estado, etc.).
- **Producto**: ítem individual con información comercial y de presentación.
- **Catálogo público**: vistas accesibles sin autenticación que muestran listas y productos **elegibles** según estado.
- **Transición**: cambio de estado solicitado por un administrador y evaluado por reglas del sistema.

---

## 5) Estados y transiciones permitidas

### 5.1 Listas
**Estados posibles:** `borrador`, `publicada`, `pausada`, `archivada`.

**Transiciones válidas:**
- `borrador` → `publicada`
- `borrador` → `archivada`
- `publicada` → `pausada`
- `publicada` → `archivada`
- `pausada` → `publicada`
- `pausada` → `archivada`
- `archivada` → *(no permite más transiciones)*

**Efectos funcionales:**
- Al pasar a **publicada**: la lista queda elegible para el catálogo público (ver §7).
- Al pasar a **pausada**: la lista **deja de ser visible** en el catálogo y se ejecuta la regla de sincronización de productos (ver §6.3).
- Al pasar a **archivada**: la lista deja de ser gestionable y no es visible en el catálogo.

### 5.2 Productos
**Estados posibles:** `borrador`, `activo`, `pausado`, `agotado`, `archivado`.

**Transiciones válidas:**
- `borrador` → `activo`
- `borrador` → `archivado`
- `activo` → `pausado`
- `activo` → `agotado`
- `activo` → `archivado`
- `pausado` → `activo`
- `pausado` → `archivado`
- `agotado` → `activo`
- `agotado` → `archivado`
- `archivado` → *(no permite más transiciones)*

**Efectos funcionales:**
- Al pasar a **activo**: el producto **solo** será visible públicamente si su lista está **publicada** (ver §6.2 y §7).
- Al pasar a **agotado**: el producto puede seguir mostrándose (si se define así en §7), con indicador de agotamiento.
- Al pasar a **archivado**: el producto deja de ser gestionable y no es visible en el catálogo.

---

## 6) Reglas de negocio

### 6.1 Consistencia Lista ↔ Producto
- No se puede activar un producto (`activo`) si su **lista asociada** no está en estado **publicada**.
- Si una lista **se pausa** o **se archiva**, todos los productos **activos** ligados a esa lista pasan automáticamente a **pausado** (efecto sistémico).
- Productos en `borrador` o `archivado` **nunca** son visibles públicamente, sin importar el estado de la lista.

### 6.2 Activación condicionada
- Una solicitud para pasar un producto a `activo` **debe fallar** si la lista no está `publicada`, con un mensaje específico (ver §9).

### 6.3 Sincronización descendente al pausar/archivar lista
- Cuando una lista cambia a `pausada` o `archivada`, el sistema **debe sincronizar** sus productos activos a `pausado`. No se alteran productos en otros estados.

### 6.4 Inmutabilidad de estados finales
- Listas `archivadas` y productos `archivados` **no admiten** nuevas transiciones.
- Cualquier intento debe devolver **error funcional** (ver §9).

### 6.5 Fechas de referencia (solo como comportamiento)
- Al publicar una lista por primera vez, se registra su **fecha de publicación** si no existe.
- Al archivar listas o productos, se registra su **fecha de archivo** si aplica.
- Al activar un producto por primera vez, se registra su **fecha de activación** si no existe.

*(La implementación concreta de campos/almacenamiento la define Claude; aquí solo se exige el comportamiento observable.)*

---

## 7) Visibilidad en el catálogo público

### 7.1 Criterios de elegibilidad
- **Listas:** visibles solo si su estado es `publicada`.
- **Productos:** visibles solo si su estado es `activo` o `agotado` **y** su lista está `publicada`.

### 7.2 Comportamiento recomendado de presentación
- Productos `agotado` pueden mostrarse con **indicador visual** (“Agotado”).
- Productos `pausado`, `borrador` o `archivado` **no** deben mostrarse al público.

*(La política exacta de visibilidad la implementará Claude, respetando estos criterios.)*

---

## 8) Interfaz administrativa – acciones y UX

### 8.1 Listas
- **borrador**: acciones disponibles → **Publicar**, **Archivar**.
- **publicada**: acciones disponibles → **Pausar**, **Archivar**.
- **pausada**: acciones disponibles → **Reanudar (Publicar)**, **Archivar**.
- **archivada**: sin acciones (solo lectura).

### 8.2 Productos
- **borrador**: **Activar**, **Archivar**.
- **activo**: **Pausar**, **Marcar Agotado**, **Archivar**.
- **pausado**: **Activar**, **Archivar**.
- **agotado**: **Activar**, **Archivar**.
- **archivado**: sin acciones (solo lectura).

### 8.3 Confirmaciones y feedback
- Toda acción de cambio de estado debe solicitar **confirmación** (modal/diálogo).
- Tras ejecutarse, debe mostrarse **notificación** de éxito o error con mensajes descritos en §9.
- Las vistas deben **actualizarse** para reflejar el nuevo estado sin acciones adicionales del usuario (refresco automático).

---

## 9) Validaciones y mensajes funcionales

### 9.1 Validaciones
- Intentar **activar** un producto cuando su lista **no** está `publicada` → rechazar con error.
- Intentar **modificar** estado de una lista `archivada` → rechazar con error.
- Intentar **modificar** estado de un producto `archivado` → rechazar con error.
- Intentar una transición **no listada** en §5 → rechazar con error.

### 9.2 Mensajes recomendados (texto orientativo)
- **Éxito Lista**: “La lista se ha **{nuevo_estado}** correctamente.”  
- **Éxito Producto**: “El producto se ha **{nuevo_estado}** correctamente.”  
- **Error Consistencia**: “No es posible **activar** el producto porque su lista no está **publicada**.”  
- **Error Archivo Lista**: “La lista está **archivada** y no admite cambios de estado.”  
- **Error Archivo Producto**: “El producto está **archivado** y no admite cambios de estado.”  
- **Error Transición**: “Transición **no permitida** desde **{estado_actual}** a **{estado_solicitado}**.”

*(Claude puede ajustar copy y localización, pero debe mantener la intención y claridad funcional.)*

---

## 10) Auditoría y métricas (recomendado)
- Registrar eventos de cambio de estado con: entidad (lista/producto), identificador, evento ejecutado, motivo opcional, usuario que ejecuta y fecha/hora.
- Métricas sugeridas: número de listas publicadas activas, productos activos por lista, tiempo promedio de vida en cada estado, ratio de pausas vs publicaciones, frecuencia de cambios de estado.

---

## 11) Criterios de aceptación (Done)
1. Se puede **publicar, pausar y archivar** una lista respetando transiciones válidas.
2. Al **pausar/archivar** una lista, los productos **activos** quedan en `pausado` automáticamente.
3. No es posible **activar** un producto si su lista no está `publicada`.
4. Listas `archivadas` y productos `archivados` rechazan cualquier cambio de estado.
5. El catálogo público solo muestra **listas publicadas** y, dentro de ellas, **productos activos o agotados**.
6. La UI administrativa muestra **solo acciones válidas** para el estado actual.
7. Todas las acciones muestran **confirmación previa** y **notificación** tras ejecutarse.
8. Existe **registro de eventos** de cambios de estado.
9. Se dispone de **mensajes de error claros** para cada regla violada.

---

## 12) Casos de prueba (funcionales)

### 12.1 Listas
- **L-01**: Crear lista en `borrador` → **Publicar** → visible en catálogo.  
- **L-02**: Lista `borrador` → **Archivar** → no permite más cambios.  
- **L-03**: Lista `publicada` → **Pausar** → deja de ser visible; productos activos pasan a `pausado`.  
- **L-04**: Lista `pausada` → **Publicar** → vuelve a ser visible; no altera productos.  
- **L-05**: Lista `publicada` → **Archivar** → no permite cambios posteriores.  
- **L-06 (negativo)**: Intentar cambiar estado de lista `archivada` → error.  
- **L-07 (negativo)**: Intentar transición no definida (p. ej., `borrador` → `pausada`) → error.

### 12.2 Productos
- **P-01**: Producto `borrador` con lista `publicada` → **Activar** → visible en catálogo.  
- **P-02**: Producto `borrador` con lista `borrador` → **Activar** → error por consistencia.  
- **P-03**: Producto `activo` → **Pausar** → no visible en catálogo.  
- **P-4**: Producto `activo` → **Marcar Agotado** → visible con indicador (si se decide mostrar agotados).  
- **P-05**: Producto `agotado` → **Activar** → visible como activo.  
- **P-06**: Producto `activo` → **Archivar** → no visible y sin más cambios permitidos.  
- **P-07 (negativo)**: Intentar transición no definida (p. ej., `borrador` → `pausado`) → error.  
- **P-08 (negativo)**: Intentar modificar estado de producto `archivado` → error.

### 12.3 Sincronización Lista → Productos
- **S-01**: Lista con 3 productos (`activo`, `pausado`, `agotado`). Al **pausar** lista → solo el `activo` pasa a `pausado`.
- **S-02**: Lista con productos `activo`. Al **archivar** lista → todos esos `activo` pasan a `pausado` (o quedan invisibles según la implementación), y la lista queda inmutable.

---

## 13) Consideraciones de seguridad y permisos
- Solo **administradores autenticados** pueden ejecutar cambios de estado.
- La visibilidad pública debe limitarse estrictamente a los criterios de §7.
- Todo intento fuera de reglas debe ser **rechazado** con mensajes del §9.

---

## 14) No funcionales
- **Rendimiento**: transiciones deben completarse en < 2s en condiciones normales.
- **Confiabilidad**: transiciones atómicas (todo o nada) y sin estados intermedios inválidos.
- **Trazabilidad**: cada transición debe quedar registrada (ver §10).
- **UX**: acciones disponibles coherentes con el estado; mensajes claros y en el idioma del usuario.

---

## 15) Entregables esperados (por Claude)
1. Implementación de lógica de transiciones y reglas de negocio indicadas.
2. Ajuste de visibilidad en catálogo público.
3. Acciones, confirmaciones y notificaciones en UI admin.
4. Registro de eventos de cambios de estado.
5. Conjunto de pruebas funcionales que cubran §12, con evidencias.

---

## 16) Riesgos y mitigaciones
- **Estados inconsistentes** por fallos parciales → exigir atomicidad y registro de auditoría.
- **Exposición pública indebida** → validar rigurosamente criterios de visibilidad antes del render.
- **Errores de usuario** (clics accidentales) → confirmaciones previas y posibilidad de revertir cuando la transición lo permita.

---

## 17) Glosario
- **Activo**: estado de producto visible y disponible dentro de una lista publicada.
- **Agotado**: estado de producto visible sin disponibilidad (indicador informativo).
- **Pausado**: estado temporal de suspensión de visibilidad.
- **Archivado**: estado final sin posibilidad de nuevas transiciones.
- **Publicada**: estado de lista elegible para catálogo público.

---

**Fin — Sesión 009 (Especificación de Flujos de Estado)**
