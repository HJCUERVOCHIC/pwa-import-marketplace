-- ================================================
-- SCRIPT DE SEGURIDAD - HABILITAR RLS Y POLÍTICAS
-- PWA Import Marketplace
-- Fecha: 2025-11-03
-- ================================================

-- IMPORTANTE: Ejecutar este script en Supabase SQL Editor
-- después de tener usuarios creados y autenticación funcionando

-- ================================================
-- PASO 1: HABILITAR RLS EN TODAS LAS TABLAS
-- ================================================

ALTER TABLE listas_oferta ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- ================================================
-- PASO 2: LIMPIAR POLÍTICAS EXISTENTES
-- ================================================

-- Listas
DROP POLICY IF EXISTS "enable_read_for_authenticated" ON listas_oferta;
DROP POLICY IF EXISTS "enable_insert_for_authenticated" ON listas_oferta;
DROP POLICY IF EXISTS "enable_update_for_authenticated" ON listas_oferta;
DROP POLICY IF EXISTS "enable_delete_for_superadmins" ON listas_oferta;
DROP POLICY IF EXISTS "Public can read all" ON listas_oferta;
DROP POLICY IF EXISTS "Public can insert" ON listas_oferta;
DROP POLICY IF EXISTS "Public can update" ON listas_oferta;

-- Productos
DROP POLICY IF EXISTS "enable_read_for_authenticated" ON productos;
DROP POLICY IF EXISTS "enable_insert_for_authenticated" ON productos;
DROP POLICY IF EXISTS "enable_update_for_authenticated" ON productos;
DROP POLICY IF EXISTS "enable_delete_for_authenticated" ON productos;
DROP POLICY IF EXISTS "Public can read all" ON productos;
DROP POLICY IF EXISTS "Public can insert" ON productos;
DROP POLICY IF EXISTS "Public can update" ON productos;

-- ================================================
-- PASO 3: POLÍTICAS PARA LISTAS_OFERTA
-- ================================================

-- Lectura: Todos los autenticados pueden leer
CREATE POLICY "enable_read_for_authenticated"
ON listas_oferta FOR SELECT TO authenticated
USING (true);

-- Inserción: Solo admins activos
CREATE POLICY "enable_insert_for_authenticated"
ON listas_oferta FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id 
    FROM administradores 
    WHERE activo = true
  )
);

-- Actualización: Solo admins activos
CREATE POLICY "enable_update_for_authenticated"
ON listas_oferta FOR UPDATE TO authenticated
USING (
  auth.uid() IN (
    SELECT auth_user_id 
    FROM administradores 
    WHERE activo = true
  )
);

-- Eliminación: Solo superadmins
CREATE POLICY "enable_delete_for_superadmins"
ON listas_oferta FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM administradores 
    WHERE auth_user_id = auth.uid() 
    AND role = 'superadmin' 
    AND activo = true
  )
);

-- ================================================
-- PASO 4: POLÍTICAS PARA PRODUCTOS
-- ================================================

-- Lectura: Todos los autenticados pueden leer
CREATE POLICY "enable_read_for_authenticated"
ON productos FOR SELECT TO authenticated
USING (true);

-- Inserción: Solo admins activos
CREATE POLICY "enable_insert_for_authenticated"
ON productos FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id 
    FROM administradores 
    WHERE activo = true
  )
);

-- Actualización: Solo admins activos
CREATE POLICY "enable_update_for_authenticated"
ON productos FOR UPDATE TO authenticated
USING (
  auth.uid() IN (
    SELECT auth_user_id 
    FROM administradores 
    WHERE activo = true
  )
);

-- Eliminación: Solo admins activos y solo borradores
CREATE POLICY "enable_delete_for_authenticated"
ON productos FOR DELETE TO authenticated
USING (
  auth.uid() IN (
    SELECT auth_user_id 
    FROM administradores 
    WHERE activo = true
  )
  AND estado = 'borrador'
);

-- ================================================
-- PASO 5: POLÍTICAS DE STORAGE
-- ================================================

-- Limpiar políticas públicas antiguas
DROP POLICY IF EXISTS "Public can upload" ON storage.objects;
DROP POLICY IF EXISTS "Public can view" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public insert access" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access" ON storage.objects;

-- Upload: Solo admins autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'productos-imagenes' AND
  auth.uid() IN (
    SELECT auth_user_id 
    FROM administradores 
    WHERE activo = true
  )
);

-- Lectura: Todos los autenticados (necesario para ver imágenes)
CREATE POLICY "Authenticated users can view"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'productos-imagenes');

-- Delete: Solo admins autenticados
CREATE POLICY "Authenticated users can delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'productos-imagenes' AND
  auth.uid() IN (
    SELECT auth_user_id 
    FROM administradores 
    WHERE activo = true
  )
);

-- ================================================
-- PASO 6: VERIFICACIÓN
-- ================================================

-- Ver todas las políticas de listas_oferta
SELECT 
  policyname as "Política",
  cmd as "Comando",
  roles as "Roles",
  permissive as "Permisiva"
FROM pg_policies
WHERE tablename = 'listas_oferta'
ORDER BY policyname;

-- Ver todas las políticas de productos
SELECT 
  policyname as "Política",
  cmd as "Comando",
  roles as "Roles",
  permissive as "Permisiva"
FROM pg_policies
WHERE tablename = 'productos'
ORDER BY policyname;

-- Ver todas las políticas de storage
SELECT 
  policyname as "Política",
  cmd as "Comando",
  roles as "Roles"
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;

-- Ver estado de RLS en todas las tablas
SELECT 
  schemaname as "Schema",
  tablename as "Tabla",
  rowsecurity as "RLS Habilitado"
FROM pg_tables
WHERE tablename IN ('listas_oferta', 'productos', 'administradores', 'auth_logs')
ORDER BY tablename;

-- ================================================
-- PASO 7: PRUEBAS BÁSICAS
-- ================================================

-- TEST 1: Intentar leer listas (debe funcionar si estás autenticado)
-- SELECT * FROM listas_oferta LIMIT 5;

-- TEST 2: Intentar insertar lista sin creado_por (debe fallar)
-- INSERT INTO listas_oferta (titulo, trm_lista, tax_modo_lista) 
-- VALUES ('Test', 4200, 'porcentaje');

-- TEST 3: Ver tus permisos actuales
-- SELECT current_user, session_user;

-- ================================================
-- ROLLBACK DE EMERGENCIA (si algo falla)
-- ================================================

-- Si necesitas revertir y deshabilitar RLS temporalmente:
-- ALTER TABLE listas_oferta DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE productos DISABLE ROW LEVEL SECURITY;

-- ================================================
-- NOTAS IMPORTANTES
-- ================================================

/*
1. Este script DEBE ejecutarse DESPUÉS de:
   - Crear usuarios en Supabase Auth
   - Insertar registros en tabla administradores
   - Verificar que auth_user_id esté correctamente vinculado

2. Para testing en desarrollo, puedes:
   - Deshabilitar RLS temporalmente
   - Usar políticas más permisivas
   - Siempre volver a habilitar antes de producción

3. En producción:
   - RLS debe estar SIEMPRE habilitado
   - Nunca exponer credenciales de anon key
   - Monitorear logs de autenticación

4. Si encuentras errores 403 o "permission denied":
   - Verificar que el usuario existe en administradores
   - Verificar que auth_user_id esté correcto
   - Verificar que la cuenta esté activa
   - Revisar políticas con la query de verificación

5. Bucket de Storage:
   - Debe existir bucket 'productos-imagenes'
   - Debe estar marcado como público en configuración
   - Las políticas RLS controlan el acceso real
*/

-- ================================================
-- FIN DEL SCRIPT
-- ================================================

-- Resultado esperado:
-- ✅ RLS habilitado en 4 tablas
-- ✅ 4 políticas en listas_oferta
-- ✅ 4 políticas en productos
-- ✅ 3 políticas en storage.objects
-- ✅ Sistema completamente protegido

SELECT '✅ Script ejecutado correctamente. Verificar políticas arriba.' as resultado;
