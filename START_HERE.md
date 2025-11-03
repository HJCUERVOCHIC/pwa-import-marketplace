# 🚀 INICIO RÁPIDO PARA CLAUDE - PWA Import Marketplace

> **Para Claude:** Lee este archivo PRIMERO en cada nueva conversación para entender cómo ayudar al usuario.

---

## 📖 ¿Qué es este proyecto?

Una **PWA para administradores** que gestionan productos importados de USA, con cálculo automático de precios en COP considerando TRM y TAX.

**Stack:** React 18 + Vite + Tailwind + Supabase (PostgreSQL + Auth + Storage)

---

## 🎯 Estado Actual en 30 Segundos

✅ **Módulo 01 COMPLETADO:** Gestión de productos + calculadora de precios  
⏳ **Módulo 03 PENDIENTE:** Autenticación (PRIORIDAD ALTA)  
🗂️ **Documentación:** Completa en `/docs/`

**El proyecto está funcional pero SIN SEGURIDAD (no hay auth aún).**

---

## 📂 Archivos Clave para Leer

### 1️⃣ SIEMPRE lee primero:
```
/PROJECT_CONTEXT.md          # Contexto completo (arquitectura, decisiones, estado)
/CURRENT_STATUS.md           # Estado actual y próximos pasos
```

### 2️⃣ Luego consulta según necesidad:

**Para entender el modelo de datos:**
```
/docs/architecture/modelo-datos.md
/docs/prompts/session-002-modelo-datos.md
```

**Para entender funcionalidades actuales:**
```
/docs/prompts/session-005-editor-productos.md  # Última sesión
/docs/prompts/session-004-formulario-listas.md
/docs/prompts/session-003-frontend-inicial.md
```

**Para implementar autenticación (próximo paso):**
```
/docs/requirements/03-auth-admin.md
```

**Para entender lógica de negocio:**
```
/docs/requirements/01-productos-calculo-precios.md
```

---

## ⚡ Flujo de Trabajo Recomendado

### Cuando el usuario te contacta:

**1. PREGUNTAR primero:**
```
"¿En qué te puedo ayudar hoy?"
Opciones:
- Continuar desarrollo (implementar nueva funcionalidad)
- Resolver un bug
- Revisar o mejorar código existente
- Actualizar documentación
- Otra cosa
```

**2. LEER documentación relevante:**
- Si es nueva funcionalidad → lee el requerimiento en `/docs/requirements/`
- Si es continuación → lee la última sesión en `/docs/prompts/`
- Si tiene dudas sobre arquitectura → lee `/docs/architecture/modelo-datos.md`

**3. VERIFICAR contexto:**
- Confirma que entiendes el estado actual del proyecto
- Pregunta si hay cambios no documentados desde la última sesión
- Verifica que tienes acceso al repositorio si es necesario

**4. PROPONER solución:**
- Basada en el contexto existente
- Respetando decisiones técnicas previas
- Con explicación clara de los pasos

**5. IMPLEMENTAR cambios:**
- Seguir estructura de carpetas existente
- Mantener estilo de código consistente
- Agregar comentarios donde sea necesario

**6. DOCUMENTAR todo:**
- Crear nuevo archivo `session-00X-descripcion.md` en `/docs/prompts/`
- Actualizar `CURRENT_STATUS.md` si aplica
- Actualizar `PROJECT_CONTEXT.md` si hay cambios importantes

---

## 🚫 LO QUE NO DEBES HACER

### ❌ NUNCA cambies sin discutir:

1. **TRM y TAX a nivel de lista** (no por producto) - Regla fundamental del negocio
2. **Redondeo a miles** (no a decenas) - Ya decidido en sesión 005
3. **Triggers de PostgreSQL** - Son críticos para integridad de datos
4. **Estructura de carpetas** - Mantener organización actual
5. **Nombre de archivos de sesión** - Formato: `session-XXX-descripcion.md`

### ❌ NUNCA hagas:

- Sugerir migrar a otra tecnología sin pedido explícito
- Reescribir código que ya funciona sin razón clara
- Cambiar el modelo de datos sin revisión completa
- Ignorar la documentación existente
- Crear archivos sin seguir la estructura actual

---

## ✅ BUENAS PRÁCTICAS

### Cuando propones código:

1. **Explica QUÉ hace** el código
2. **Explica POR QUÉ** lo haces así (decisión técnica)
3. **Muestra DÓNDE va** en la estructura del proyecto
4. **Indica qué ARCHIVOS se crean/modifican**
5. **Documenta PROBLEMAS** que podrían surgir

### Cuando terminas una tarea:

1. **Resume QUÉ se hizo**
2. **Verifica QUÉ funciona**
3. **Indica QUÉ falta** (si algo quedó pendiente)
4. **Crea la DOCUMENTACIÓN** de sesión
5. **Sugiere PRÓXIMOS PASOS** concretos

---

## 🎓 Conceptos Clave del Proyecto

### Arquitectura Lista-Producto
```
Lista de Oferta (1)
  ├── TRM única (ej: 4,200 COP/USD)
  ├── TAX único (ej: 7% o $50 USD fijo)
  └── Productos (N)
      ├── Precio base USD
      ├── Cálculos automáticos → usa TRM y TAX de la lista
      └── Snapshot al publicar → valores congelados
```

### Flujo de Cálculos (Automático con Triggers)
```
1. Producto → precio_base_usd: $79.99
2. Lista → TRM: 4,200 | TAX: 7%
3. Trigger calcula:
   - TAX: $79.99 × 7% = $5.60
   - Costo USD: $79.99 + $5.60 = $85.59
   - Costo COP: $85.59 × 4,200 = 359,000 (redondeado a mil)
   - Precio sugerido: 359,000 × 1.25 = 449,000 (con 25% margen)
   - Ganancia: 449,000 - 359,000 = 90,000
```

### Estados de Producto
```
borrador → listo_para_publicar → publicado → oculto
   ↑                                  ↓
   └──────── NO se puede regresar ────┘
```

### Recálculo Selectivo
```
Si cambias TRM/TAX en la lista:
  ✅ Productos en borrador → SE RECALCULAN
  ❌ Productos publicados → NO CAMBIAN (snapshot)
```

---

## 🔍 Problemas Comunes y Soluciones

### "No puedo ver los datos en el frontend"
→ Verifica que RLS esté deshabilitado:
```sql
ALTER TABLE listas_oferta DISABLE ROW LEVEL SECURITY;
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
```

### "Error al subir imágenes"
→ Verifica políticas de Storage:
```sql
-- Deben existir políticas públicas para desarrollo
SELECT * FROM pg_policies WHERE schemaname = 'storage';
```

### "Los cálculos no se actualizan"
→ Verifica triggers:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%producto%';
```

### "Hooks error en React"
→ Todos los hooks deben ir ANTES de cualquier return condicional:
```javascript
// ✅ CORRECTO
const [state] = useState()
useEffect(() => {})
if (!isOpen) return null

// ❌ INCORRECTO
const [state] = useState()
if (!isOpen) return null
useEffect(() => {})  // ← Error!
```

---

## 📋 Checklist para Iniciar Nueva Sesión

Antes de hacer CUALQUIER cambio:

- [ ] ¿Leíste `PROJECT_CONTEXT.md`?
- [ ] ¿Leíste `CURRENT_STATUS.md`?
- [ ] ¿Revisaste la última sesión en `/docs/prompts/`?
- [ ] ¿Entiendes qué quiere hacer el usuario?
- [ ] ¿Consultaste el requerimiento relevante (si aplica)?
- [ ] ¿Tienes claro qué archivos vas a modificar/crear?
- [ ] ¿Sabes cómo documentar los cambios al terminar?

---

## 🎯 Próxima Tarea Prioritaria

**Módulo 03: Autenticación de Administradores**

**Archivo de requerimientos:** `/docs/requirements/03-auth-admin.md`

**Objetivo:** Implementar login con Supabase Auth, proteger rutas admin, y habilitar RLS.

**Pasos sugeridos:**
1. Configurar Supabase Auth en el proyecto
2. Crear tabla `administradores` con roles
3. Crear componente `LoginPage.jsx`
4. Implementar `AuthContext` para gestionar sesión
5. Crear `AuthGuard` para proteger rutas
6. Actualizar `App.jsx` con rutas protegidas
7. Habilitar RLS en todas las tablas
8. Crear políticas RLS por rol
9. Actualizar políticas de Storage
10. Documentar en `session-006-autenticacion.md`

---

## 💡 Tips para Respuestas Efectivas

### ✅ Buenas respuestas incluyen:

- Código completo (no snippets incompletos)
- Nombres de archivos con rutas completas
- Explicación de QUÉ hace y POR QUÉ
- Comandos para verificar que funciona
- Próximos pasos sugeridos

### ❌ Evita respuestas que:

- Solo muestran fragmentos de código sin contexto
- No explican dónde va el código
- Ignoran la arquitectura existente
- No mencionan posibles problemas
- No sugieren cómo verificar que funciona

---

## 📞 Si Tienes Dudas

**Pregunta al usuario:**
- "¿Hay algo en el proyecto que haya cambiado desde la última sesión?"
- "¿Prefieres que siga una ruta específica o sugiero la mejor opción?"
- "¿Quieres que documente esto ahora o al final?"

**Consulta la documentación:**
- Revisa los archivos de sesiones anteriores
- Lee los requerimientos completos
- Verifica decisiones técnicas en PROJECT_CONTEXT.md

---

## 🚀 ¡Listo para Empezar!

Ahora que has leído esto, pregunta al usuario:

```
"¡Perfecto! Ya revisé toda la documentación del proyecto.

Entiendo que:
- El Módulo 01 (gestión de productos) está completado
- El Módulo 03 (autenticación) es la prioridad alta
- El proyecto está funcional pero sin seguridad aún

¿En qué te puedo ayudar hoy?
1. Implementar el Módulo 03 (Autenticación)
2. Completar funcionalidades pendientes del Módulo 01
3. Resolver algún bug o problema
4. Otra cosa

¿Qué prefieres?"
```

---

**Recuerda:** La clave del éxito es **leer la documentación antes de actuar**. Este proyecto tiene un excelente historial documentado, ¡úsalo!

---

*Guía creada: 2025-11-03 | Versión: 1.0*
