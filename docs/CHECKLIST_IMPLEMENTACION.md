# ✅ CHECKLIST DE IMPLEMENTACIÓN - Seguridad Completa

## 📌 ANTES DE EMPEZAR

- [ ] Hacer backup completo de la base de datos de Supabase
- [ ] Hacer commit de los cambios actuales del código
- [ ] Tener acceso al panel de Supabase
- [ ] Tener el proyecto corriendo localmente

---

## FASE 1: PREPARACIÓN (15 min)

### Paso 1.1: Verificar Estado Actual
- [ ] Ir a Supabase → SQL Editor
- [ ] Ejecutar `verificar_seguridad.sql`
- [ ] Anotar los resultados:
  - RLS habilitado: ___ / 4 tablas
  - Políticas creadas: ___ 
  - Admins activos: ___
  - Admins vinculados: ___

### Paso 1.2: Verificar Usuario Admin
- [ ] Ir a Supabase → Authentication → Users
- [ ] Verificar que existe tu usuario admin
- [ ] Copiar el `User UID` (UUID)
- [ ] Ir a SQL Editor y verificar:
```sql
SELECT * FROM administradores 
WHERE auth_user_id = 'TU_UUID_AQUI';
```
- [ ] ✅ Debe retornar tu registro
- [ ] ⚠️ Si no existe, crearlo:
```sql
INSERT INTO administradores (email, nombre, role, activo, auth_user_id)
VALUES (
  'tu@email.com',
  'Tu Nombre',
  'superadmin',
  true,
  'TU_UUID_AQUI'
);
```

### Paso 1.3: Backup de Configuración Actual
- [ ] En Supabase → Database → Policies
- [ ] Tomar screenshot de políticas actuales (por si acaso)
- [ ] Anotar si RLS está habilitado o no en cada tabla

---

## FASE 2: ACTUALIZAR CÓDIGO FRONTEND (30 min)

### Paso 2.1: Actualizar App.jsx
- [ ] Abrir `frontend/src/App.jsx`
- [ ] Reemplazar con el contenido de `App.jsx` (archivo generado)
- [ ] Verificar imports (ajustar rutas si es necesario)
- [ ] Guardar cambios

### Paso 2.2: Actualizar Layout.jsx
- [ ] Abrir `frontend/src/components/Layout.jsx`
- [ ] Reemplazar con el contenido de `Layout.jsx` (archivo generado)
- [ ] Verificar imports (ajustar rutas si es necesario)
- [ ] Guardar cambios

### Paso 2.3: Actualizar ModalCrearLista.jsx
- [ ] Abrir `frontend/src/components/ModalCrearLista.jsx`
- [ ] Agregar import: `import { useAuth } from '@/features/auth/context/AuthContext'`
- [ ] Agregar hook: `const { user } = useAuth()`
- [ ] En `handleSubmit`, agregar: `creado_por: user?.id`
- [ ] Guardar cambios

### Paso 2.4: Actualizar ModalEditorProducto.jsx
- [ ] Abrir `frontend/src/components/ModalEditorProducto.jsx`
- [ ] Agregar import: `import { useAuth } from '@/features/auth/context/AuthContext'`
- [ ] Agregar hook: `const { user } = useAuth()`
- [ ] Agregar lógica para `publicado_por` (ver MODIFICACIONES_MODALES.md)
- [ ] Guardar cambios

### Paso 2.5: Probar Compilación
- [ ] Ir a terminal
- [ ] Ejecutar: `cd frontend && npm run dev`
- [ ] ✅ Debe compilar sin errores
- [ ] ⚠️ Si hay errores, revisar imports y rutas

---

## FASE 3: CONFIGURAR SEGURIDAD EN SUPABASE (20 min)

### Paso 3.1: Habilitar RLS y Políticas
- [ ] Ir a Supabase → SQL Editor
- [ ] Copiar TODO el contenido de `enable_rls_security.sql`
- [ ] Pegar en SQL Editor
- [ ] ✅ **EJECUTAR** el script completo
- [ ] Verificar que aparezca: "✅ Script ejecutado correctamente"
- [ ] Revisar sección de verificación al final

### Paso 3.2: Verificar Políticas Creadas
- [ ] Ir a Supabase → Database → Policies
- [ ] Verificar tabla `listas_oferta`:
  - [ ] SELECT: enable_read_for_authenticated
  - [ ] INSERT: enable_insert_for_authenticated
  - [ ] UPDATE: enable_update_for_authenticated
  - [ ] DELETE: enable_delete_for_superadmins
- [ ] Verificar tabla `productos`:
  - [ ] SELECT: enable_read_for_authenticated
  - [ ] INSERT: enable_insert_for_authenticated
  - [ ] UPDATE: enable_update_for_authenticated
  - [ ] DELETE: enable_delete_for_authenticated

### Paso 3.3: Verificar Storage
- [ ] Ir a Supabase → Storage → Policies
- [ ] Verificar bucket `productos-imagenes`:
  - [ ] INSERT: Authenticated users can upload
  - [ ] SELECT: Authenticated users can view
  - [ ] DELETE: Authenticated users can delete own files

### Paso 3.4: Ejecutar Verificación Final
- [ ] Volver a SQL Editor
- [ ] Ejecutar `verificar_seguridad.sql` completo
- [ ] Revisar sección "RESUMEN EJECUTIVO"
- [ ] ✅ Todos los checks deben estar en verde

---

## FASE 4: PRUEBAS FUNCIONALES (30 min)

### Paso 4.1: Prueba de Login/Logout
- [ ] Abrir navegador en modo incógnito
- [ ] Ir a `http://localhost:3000`
- [ ] ✅ Debe redirigir a `/admin/login`
- [ ] Ingresar credenciales correctas
- [ ] ✅ Debe redirigir a `/admin/dashboard`
- [ ] ✅ Header debe mostrar tu nombre y rol
- [ ] ✅ Debe haber botón de "Cerrar Sesión"
- [ ] Click en "Cerrar Sesión"
- [ ] ✅ Debe redirigir a `/admin/login`

### Paso 4.2: Prueba de Protección de Rutas
- [ ] Sin login, intentar ir a:
  - [ ] `http://localhost:3000/admin/dashboard`
  - [ ] `http://localhost:3000/admin/listas`
- [ ] ✅ Ambas deben redirigir a login
- [ ] Hacer login
- [ ] ✅ Ahora debe poder acceder a ambas rutas

### Paso 4.3: Prueba de Creación de Lista
- [ ] Hacer login
- [ ] Ir a página de listas
- [ ] Click en "Nueva Lista"
- [ ] Llenar formulario completo
- [ ] ✅ Crear lista exitosamente
- [ ] Ir a Supabase → Table Editor → listas_oferta
- [ ] Buscar la lista recién creada
- [ ] ✅ Campo `creado_por` debe tener tu UUID
- [ ] ✅ NO debe ser NULL

### Paso 4.4: Prueba de Creación de Producto
- [ ] Entrar a una lista
- [ ] Click en "Agregar Producto"
- [ ] Llenar formulario (dejar en estado "borrador")
- [ ] ✅ Crear producto exitosamente
- [ ] Ir a Supabase → Table Editor → productos
- [ ] Buscar el producto recién creado
- [ ] ✅ Campo `publicado_por` debe ser NULL (es borrador)
- [ ] En la app, cambiar estado a "publicado"
- [ ] ✅ Campo `publicado_por` debe actualizarse con tu UUID

### Paso 4.5: Prueba de Upload de Imágenes
- [ ] Intentar subir imagen en producto
- [ ] ✅ Debe funcionar normalmente
- [ ] Ir a Supabase → Storage → productos-imagenes
- [ ] ✅ Imagen debe estar visible
- [ ] Intentar eliminar imagen
- [ ] ✅ Debe poder eliminar

### Paso 4.6: Prueba de Sesión Expirada
- [ ] Hacer login
- [ ] Abrir DevTools (F12)
- [ ] Application → Local Storage
- [ ] Eliminar todos los items
- [ ] Refrescar página (F5)
- [ ] ✅ Debe redirigir a login
- [ ] ⚠️ Idealmente debe mostrar mensaje "Sesión expirada"

### Paso 4.7: Prueba de Acceso Directo
- [ ] Logout
- [ ] Cerrar navegador completamente
- [ ] Abrir nuevo navegador
- [ ] Intentar ir directamente a `http://localhost:3000/admin/listas`
- [ ] ✅ Debe redirigir a login
- [ ] Login
- [ ] ✅ Debe redirigir a `/admin/listas` (recordó la ruta)

### Paso 4.8: Prueba de Refresh de Página
- [ ] Hacer login
- [ ] Navegar por varias páginas
- [ ] En cualquier página, presionar F5 (refresh)
- [ ] ✅ NO debe expulsar al login
- [ ] ✅ Debe mantener la sesión

---

## FASE 5: VERIFICACIÓN DE SEGURIDAD (15 min)

### Paso 5.1: Probar RLS en SQL
- [ ] Ir a Supabase → SQL Editor
- [ ] Ejecutar SIN autenticación:
```sql
SELECT * FROM listas_oferta;
```
- [ ] ❌ **DEBE FALLAR** con error de permisos
- [ ] ✅ Si falla = RLS funciona

### Paso 5.2: Probar Storage Sin Auth
- [ ] Abrir terminal
- [ ] Intentar subir imagen directamente:
```bash
curl -X POST https://[proyecto].supabase.co/storage/v1/object/productos-imagenes/test.jpg \
  -H "Content-Type: image/jpeg" \
  --data-binary @test.jpg
```
- [ ] ❌ **DEBE FALLAR** con 401 Unauthorized
- [ ] ✅ Si falla = Storage protegido

### Paso 5.3: Verificar Auditoría
- [ ] Ir a Supabase → Table Editor → auth_logs
- [ ] ✅ Debe haber registros de tus logins
- [ ] ✅ Debe haber registro de logout
- [ ] ✅ Campos de IP y User Agent deben estar llenos

### Paso 5.4: Probar Cuenta Desactivada
- [ ] Mientras estás logueado
- [ ] En Supabase SQL Editor:
```sql
UPDATE administradores 
SET activo = false 
WHERE email = 'tu@email.com';
```
- [ ] Refrescar página en la app
- [ ] ✅ Debe mostrar "Cuenta Inactiva"
- [ ] ✅ Debe expulsar al login
- [ ] Reactivar cuenta:
```sql
UPDATE administradores 
SET activo = true 
WHERE email = 'tu@email.com';
```

---

## FASE 6: LIMPIEZA Y DOCUMENTACIÓN (10 min)

### Paso 6.1: Limpiar Datos de Prueba
- [ ] Eliminar listas/productos de prueba si es necesario
- [ ] Verificar que no haya datos basura en BD

### Paso 6.2: Commit de Cambios
- [ ] `git status` (ver todos los cambios)
- [ ] `git add .`
- [ ] `git commit -m "feat: implementar seguridad completa con RLS y autenticación

- Proteger todas las rutas admin con ProtectedRoute
- Agregar información de usuario en Layout
- Implementar campos de auditoría (creado_por, publicado_por)
- Habilitar RLS en todas las tablas
- Crear políticas de seguridad para BD y Storage
- Actualizar LoginPage con redirect si ya autenticado
- Mejorar ProtectedRoute con mensaje de sesión expirada
- Documentar proceso completo de implementación"`
- [ ] `git push`

### Paso 6.3: Actualizar Documentación
- [ ] Actualizar `CURRENT_STATUS.md`:
  - [ ] Marcar Módulo 03 como ✅ COMPLETADO
  - [ ] Marcar "RLS habilitado" como ✅
  - [ ] Marcar "Autenticación funcional" como ✅
  - [ ] Actualizar métricas del proyecto
- [ ] Crear entrada en `docs/prompts/`:
  - [ ] Nuevo archivo: `session-007-seguridad-completa.md`
  - [ ] Documentar todos los cambios realizados
  - [ ] Incluir resultados de pruebas

### Paso 6.4: Crear Nota de Versión
- [ ] Crear archivo `CHANGELOG.md` (si no existe)
- [ ] Agregar entrada:
```markdown
## [0.2.0] - 2025-11-03

### 🔒 Seguridad
- Implementada protección completa con autenticación
- Habilitado RLS en todas las tablas
- Creadas políticas de seguridad para BD y Storage
- Protegidas todas las rutas administrativas

### ✨ Mejoras
- Layout ahora muestra información del usuario
- Campos de auditoría (creado_por, publicado_por)
- Mensaje de sesión expirada
- Navegación mejorada entre secciones

### 🧪 Testing
- 8 pruebas funcionales completas
- Verificación de RLS
- Pruebas de Storage protegido
```

---

## FASE 7: PRUEBAS DE PRODUCCIÓN (Opcional, 15 min)

### Paso 7.1: Deploy a Staging
- [ ] Si tienes ambiente de staging
- [ ] Deploy del código actualizado
- [ ] Ejecutar `enable_rls_security.sql` en staging
- [ ] Repetir pruebas funcionales

### Paso 7.2: Monitoreo
- [ ] Verificar logs de Supabase
- [ ] Monitorear errores en frontend
- [ ] Verificar performance (no debería cambiar)

---

## ✅ VERIFICACIÓN FINAL

### Checklist de Funcionalidad
- [ ] ✅ Login funciona correctamente
- [ ] ✅ Logout funciona correctamente
- [ ] ✅ Rutas protegidas redirigen a login
- [ ] ✅ Usuario autenticado puede acceder a todo
- [ ] ✅ Información de usuario visible en header
- [ ] ✅ Navegación entre secciones funciona
- [ ] ✅ Crear lista llena campo creado_por
- [ ] ✅ Crear producto llena publicado_por (si aplica)
- [ ] ✅ Upload de imágenes funciona
- [ ] ✅ Sesión persiste al refrescar página

### Checklist de Seguridad
- [ ] ✅ RLS habilitado en 4 tablas
- [ ] ✅ Políticas creadas (mínimo 8)
- [ ] ✅ Storage protegido con políticas
- [ ] ✅ Sin acceso sin autenticación
- [ ] ✅ Auditoría registrando eventos
- [ ] ✅ Campos de auditoría funcionando

### Checklist de Código
- [ ] ✅ Código compila sin errores
- [ ] ✅ No hay warnings críticos
- [ ] ✅ Imports correctos
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Cliente Supabase único (sin duplicados)

### Checklist de Documentación
- [ ] ✅ CURRENT_STATUS.md actualizado
- [ ] ✅ Nueva sesión documentada
- [ ] ✅ CHANGELOG.md actualizado
- [ ] ✅ Commit realizado

---

## 🎉 RESULTADO ESPERADO

Al finalizar este checklist, deberías tener:

1. ✅ **Plataforma 100% protegida** - Solo accesible con login
2. ✅ **RLS habilitado** - Base de datos segura
3. ✅ **Auditoría completa** - Todos los eventos registrados
4. ✅ **UX mejorada** - Información de usuario visible
5. ✅ **Código documentado** - Cambios versionados en git
6. ✅ **Testing completo** - 8 pruebas funcionales pasadas

---

## 🆘 TROUBLESHOOTING

### Problema: "Cannot read properties of undefined (user)"
**Solución:** Verificar que AuthContext esté envolviendo toda la app

### Problema: Error 403 al crear lista
**Solución:** Verificar que auth_user_id esté correcto en tabla administradores

### Problema: Imágenes no se ven después de habilitar RLS
**Solución:** Verificar políticas de Storage, SELECT debe estar habilitado

### Problema: Loop infinito en LoginPage
**Solución:** Verificar que useEffect tenga array de dependencias correcto

### Problema: RLS bloquea todas las operaciones
**Solución:** Verificar que usuario esté en tabla administradores con activo=true

---

## 📞 SOPORTE

Si encuentras problemas:
1. Revisar sección de TROUBLESHOOTING
2. Ejecutar `verificar_seguridad.sql` para diagnosticar
3. Revisar logs en consola del navegador (F12)
4. Revisar logs en Supabase Dashboard

---

**Tiempo total estimado:** 2-3 horas  
**Prioridad:** 🔴 CRÍTICA  
**Estado:** PENDIENTE DE IMPLEMENTACIÓN

---

*Última actualización: 2025-11-03*
