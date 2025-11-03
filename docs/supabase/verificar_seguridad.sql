-- ================================================
-- SCRIPT DE VERIFICACIÓN DE SEGURIDAD
-- PWA Import Marketplace
-- Ejecutar en Supabase SQL Editor
-- ================================================

-- ================================================
-- SECCIÓN 1: VERIFICAR RLS HABILITADO
-- ================================================

SELECT 
  '🔒 RLS Status' as "Verificación",
  tablename as "Tabla",
  CASE 
    WHEN rowsecurity THEN '✅ Habilitado'
    ELSE '❌ DESHABILITADO'
  END as "Estado"
FROM pg_tables
WHERE tablename IN ('listas_oferta', 'productos', 'administradores', 'auth_logs')
ORDER BY tablename;

-- ================================================
-- SECCIÓN 2: CONTAR POLÍTICAS POR TABLA
-- ================================================

SELECT 
  '📋 Políticas' as "Verificación",
  tablename as "Tabla",
  COUNT(*) as "Total Políticas",
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ OK'
    WHEN COUNT(*) > 0 THEN '⚠️ Pocas'
    ELSE '❌ SIN POLÍTICAS'
  END as "Estado"
FROM pg_policies
WHERE tablename IN ('listas_oferta', 'productos', 'administradores', 'auth_logs')
GROUP BY tablename
ORDER BY tablename;

-- ================================================
-- SECCIÓN 3: DETALLE DE POLÍTICAS LISTAS_OFERTA
-- ================================================

SELECT 
  '📄 Listas - Políticas' as "Verificación",
  policyname as "Nombre Política",
  cmd as "Operación",
  CASE 
    WHEN cmd = 'SELECT' THEN '✅'
    WHEN cmd = 'INSERT' THEN '✅'
    WHEN cmd = 'UPDATE' THEN '✅'
    WHEN cmd = 'DELETE' THEN '✅'
    ELSE '⚠️'
  END as "Estado"
FROM pg_policies
WHERE tablename = 'listas_oferta'
ORDER BY cmd;

-- ================================================
-- SECCIÓN 4: DETALLE DE POLÍTICAS PRODUCTOS
-- ================================================

SELECT 
  '📦 Productos - Políticas' as "Verificación",
  policyname as "Nombre Política",
  cmd as "Operación",
  CASE 
    WHEN cmd = 'SELECT' THEN '✅'
    WHEN cmd = 'INSERT' THEN '✅'
    WHEN cmd = 'UPDATE' THEN '✅'
    WHEN cmd = 'DELETE' THEN '✅'
    ELSE '⚠️'
  END as "Estado"
FROM pg_policies
WHERE tablename = 'productos'
ORDER BY cmd;

-- ================================================
-- SECCIÓN 5: POLÍTICAS DE STORAGE
-- ================================================

SELECT 
  '🖼️ Storage - Políticas' as "Verificación",
  policyname as "Nombre Política",
  cmd as "Operación",
  CASE 
    WHEN policyname ILIKE '%authenticated%' THEN '✅ Protegido'
    WHEN policyname ILIKE '%public%' THEN '⚠️ Público'
    ELSE '❓ Verificar'
  END as "Estado"
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname ILIKE '%productos%'
ORDER BY cmd;

-- ================================================
-- SECCIÓN 6: VERIFICAR USUARIOS ADMIN
-- ================================================

SELECT 
  '👤 Administradores' as "Verificación",
  COUNT(*) as "Total Admins",
  COUNT(*) FILTER (WHERE activo = true) as "Activos",
  COUNT(*) FILTER (WHERE role = 'superadmin') as "Superadmins",
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ OK'
    ELSE '❌ SIN USUARIOS'
  END as "Estado"
FROM administradores;

-- ================================================
-- SECCIÓN 7: VERIFICAR VINCULACIÓN AUTH
-- ================================================

SELECT 
  '🔗 Vinculación Auth' as "Verificación",
  a.email,
  a.nombre,
  a.role,
  CASE 
    WHEN a.auth_user_id IS NOT NULL THEN '✅ Vinculado'
    ELSE '❌ SIN VINCULAR'
  END as "Estado Auth"
FROM administradores a
ORDER BY a.created_at DESC;

-- ================================================
-- SECCIÓN 8: AUDITORÍA - ÚLTIMOS EVENTOS
-- ================================================

SELECT 
  '📊 Últimos Eventos' as "Verificación",
  al.evento,
  al.email_intento,
  a.nombre as "Usuario",
  al.created_at,
  CASE 
    WHEN al.evento = 'login_success' THEN '✅'
    WHEN al.evento = 'login_failed' THEN '⚠️'
    WHEN al.evento = 'logout' THEN '📤'
    WHEN al.evento = 'account_blocked' THEN '🔒'
    ELSE '❓'
  END as "Tipo"
FROM auth_logs al
LEFT JOIN administradores a ON a.id_admin = al.admin_id
ORDER BY al.created_at DESC
LIMIT 10;

-- ================================================
-- SECCIÓN 9: VERIFICAR INTEGRIDAD DE DATOS
-- ================================================

-- Listas sin creador
SELECT 
  '⚠️ Listas sin creador' as "Verificación",
  COUNT(*) as "Total",
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todas OK'
    ELSE '❌ Requiere corrección'
  END as "Estado"
FROM listas_oferta
WHERE creado_por IS NULL;

-- Productos publicados sin publicador
SELECT 
  '⚠️ Productos publicados sin publicador' as "Verificación",
  COUNT(*) as "Total",
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todos OK'
    ELSE '❌ Requiere corrección'
  END as "Estado"
FROM productos
WHERE estado IN ('publicado', 'listo_para_publicar')
AND publicado_por IS NULL;

-- ================================================
-- SECCIÓN 10: RESUMEN EJECUTIVO
-- ================================================

WITH security_checks AS (
  SELECT 
    -- RLS habilitado
    (SELECT COUNT(*) FROM pg_tables 
     WHERE tablename IN ('listas_oferta', 'productos', 'administradores', 'auth_logs')
     AND rowsecurity = true) as rls_enabled,
    
    -- Total de políticas
    (SELECT COUNT(*) FROM pg_policies 
     WHERE tablename IN ('listas_oferta', 'productos')) as total_policies,
    
    -- Admins activos
    (SELECT COUNT(*) FROM administradores WHERE activo = true) as active_admins,
    
    -- Admins vinculados
    (SELECT COUNT(*) FROM administradores WHERE auth_user_id IS NOT NULL) as linked_admins,
    
    -- Listas sin creador
    (SELECT COUNT(*) FROM listas_oferta WHERE creado_por IS NULL) as orphan_lists,
    
    -- Productos sin publicador
    (SELECT COUNT(*) FROM productos 
     WHERE estado IN ('publicado', 'listo_para_publicar') 
     AND publicado_por IS NULL) as orphan_products
)
SELECT 
  '🎯 RESUMEN EJECUTIVO' as "Verificación",
  CASE 
    WHEN rls_enabled = 4 THEN '✅'
    ELSE '❌'
  END || ' RLS: ' || rls_enabled || '/4 tablas' as "RLS",
  
  CASE 
    WHEN total_policies >= 8 THEN '✅'
    WHEN total_policies >= 6 THEN '⚠️'
    ELSE '❌'
  END || ' Políticas: ' || total_policies as "Políticas",
  
  CASE 
    WHEN active_admins > 0 THEN '✅'
    ELSE '❌'
  END || ' Admins: ' || active_admins as "Usuarios",
  
  CASE 
    WHEN linked_admins = active_admins AND active_admins > 0 THEN '✅'
    WHEN linked_admins > 0 THEN '⚠️'
    ELSE '❌'
  END || ' Vinculados: ' || linked_admins || '/' || active_admins as "Auth",
  
  CASE 
    WHEN orphan_lists = 0 THEN '✅'
    ELSE '⚠️'
  END || ' Listas huérfanas: ' || orphan_lists as "Datos",
  
  CASE 
    WHEN orphan_products = 0 THEN '✅'
    ELSE '⚠️'
  END || ' Productos huérfanos: ' || orphan_products as "Auditoría"
FROM security_checks;

-- ================================================
-- SECCIÓN 11: RECOMENDACIONES
-- ================================================

DO $$
DECLARE
  rls_count INTEGER;
  policy_count INTEGER;
  admin_count INTEGER;
BEGIN
  -- Contar RLS
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE tablename IN ('listas_oferta', 'productos', 'administradores', 'auth_logs')
  AND rowsecurity = true;
  
  -- Contar políticas
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename IN ('listas_oferta', 'productos');
  
  -- Contar admins
  SELECT COUNT(*) INTO admin_count
  FROM administradores
  WHERE activo = true AND auth_user_id IS NOT NULL;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '📋 RECOMENDACIONES DE SEGURIDAD';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  
  IF rls_count < 4 THEN
    RAISE NOTICE '❌ CRÍTICO: RLS no habilitado en todas las tablas';
    RAISE NOTICE '   → Ejecutar: enable_rls_security.sql';
  ELSE
    RAISE NOTICE '✅ RLS habilitado correctamente';
  END IF;
  
  IF policy_count < 8 THEN
    RAISE NOTICE '⚠️ MEDIO: Faltan políticas de seguridad';
    RAISE NOTICE '   → Ejecutar: enable_rls_security.sql';
  ELSE
    RAISE NOTICE '✅ Políticas configuradas correctamente';
  END IF;
  
  IF admin_count = 0 THEN
    RAISE NOTICE '❌ CRÍTICO: No hay administradores activos vinculados';
    RAISE NOTICE '   → Crear usuario en Supabase Auth';
    RAISE NOTICE '   → Vincular en tabla administradores';
  ELSE
    RAISE NOTICE '✅ Administradores configurados correctamente';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
END $$;

-- ================================================
-- FIN DE VERIFICACIÓN
-- ================================================

-- Mensaje final
SELECT 
  '🎉 Verificación completada' as "Resultado",
  NOW() as "Fecha/Hora";
