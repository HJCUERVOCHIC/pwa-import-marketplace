-- ============================================
-- CHICIMPORTUSA - SCHEMA DE AUTENTICACIÓN
-- Base de datos: PostgreSQL (Supabase)
-- Versión: 1.0.0
-- ============================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: administradores
-- ============================================

CREATE TABLE IF NOT EXISTS public.administradores (
  id_admin UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'admin_full')),
  activo BOOLEAN DEFAULT true NOT NULL,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  intentos_fallidos INTEGER DEFAULT 0 NOT NULL,
  bloqueado_hasta TIMESTAMPTZ,
  
  -- Relación con Supabase Auth
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Comentarios de documentación
COMMENT ON TABLE administradores IS 'Tabla de administradores del sistema con roles y control de acceso';
COMMENT ON COLUMN administradores.id_admin IS 'Identificador único del administrador';
COMMENT ON COLUMN administradores.email IS 'Email único del administrador (usado para login)';
COMMENT ON COLUMN administradores.nombre IS 'Nombre completo del administrador';
COMMENT ON COLUMN administradores.role IS 'Rol del usuario: superadmin o admin_full';
COMMENT ON COLUMN administradores.activo IS 'Estado de la cuenta (solo activos pueden acceder)';
COMMENT ON COLUMN administradores.intentos_fallidos IS 'Contador de intentos de login fallidos';
COMMENT ON COLUMN administradores.bloqueado_hasta IS 'Fecha/hora hasta la que la cuenta está bloqueada';
COMMENT ON COLUMN administradores.auth_user_id IS 'Referencia al usuario en auth.users de Supabase';

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_administradores_email ON administradores(email);
CREATE INDEX idx_administradores_auth_user_id ON administradores(auth_user_id);
CREATE INDEX idx_administradores_activo ON administradores(activo);
CREATE INDEX idx_administradores_role ON administradores(role);
CREATE INDEX idx_administradores_bloqueado ON administradores(bloqueado_hasta) WHERE bloqueado_hasta IS NOT NULL;

-- ============================================
-- TABLA: auth_logs (Auditoría)
-- ============================================

CREATE TABLE IF NOT EXISTS public.auth_logs (
  id_log BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES administradores(id_admin) ON DELETE SET NULL,
  evento VARCHAR(50) NOT NULL CHECK (evento IN ('login_success', 'login_failed', 'logout', 'account_blocked', 'password_reset')),
  email_intento VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  detalles JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE auth_logs IS 'Registro de auditoría de eventos de autenticación';
COMMENT ON COLUMN auth_logs.evento IS 'Tipo de evento: login_success, login_failed, logout, account_blocked, password_reset';
COMMENT ON COLUMN auth_logs.email_intento IS 'Email usado en el intento (útil para login_failed)';
COMMENT ON COLUMN auth_logs.detalles IS 'Información adicional en formato JSON';

-- Índices para auth_logs
CREATE INDEX idx_auth_logs_admin_id ON auth_logs(admin_id);
CREATE INDEX idx_auth_logs_evento ON auth_logs(evento);
CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at DESC);
CREATE INDEX idx_auth_logs_email ON auth_logs(email_intento);

-- ============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para administradores
CREATE TRIGGER trigger_administradores_updated_at
  BEFORE UPDATE ON administradores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCIÓN: Registrar login exitoso
-- ============================================

CREATE OR REPLACE FUNCTION handle_successful_login(
  p_admin_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Actualizar last_login_at y resetear intentos fallidos
  UPDATE administradores
  SET 
    last_login_at = NOW(),
    intentos_fallidos = 0,
    bloqueado_hasta = NULL
  WHERE id_admin = p_admin_id;
  
  -- Registrar en logs
  INSERT INTO auth_logs (admin_id, evento, ip_address, user_agent)
  VALUES (p_admin_id, 'login_success', p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Registrar login fallido
-- ============================================

CREATE OR REPLACE FUNCTION handle_failed_login(
  p_email VARCHAR(255),
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID;
  v_intentos INTEGER;
  v_bloqueado BOOLEAN := false;
BEGIN
  -- Buscar el admin por email
  SELECT id_admin, intentos_fallidos 
  INTO v_admin_id, v_intentos
  FROM administradores
  WHERE email = p_email;
  
  IF v_admin_id IS NOT NULL THEN
    -- Incrementar intentos fallidos
    v_intentos := v_intentos + 1;
    
    -- Si alcanza 5 intentos, bloquear por 10 minutos
    IF v_intentos >= 5 THEN
      UPDATE administradores
      SET 
        intentos_fallidos = v_intentos,
        bloqueado_hasta = NOW() + INTERVAL '10 minutes'
      WHERE id_admin = v_admin_id;
      
      v_bloqueado := true;
      
      -- Registrar bloqueo
      INSERT INTO auth_logs (admin_id, evento, ip_address, user_agent, detalles)
      VALUES (
        v_admin_id, 
        'account_blocked', 
        p_ip_address, 
        p_user_agent,
        jsonb_build_object('intentos', v_intentos)
      );
    ELSE
      UPDATE administradores
      SET intentos_fallidos = v_intentos
      WHERE id_admin = v_admin_id;
    END IF;
    
    -- Registrar intento fallido
    INSERT INTO auth_logs (admin_id, evento, email_intento, ip_address, user_agent)
    VALUES (v_admin_id, 'login_failed', p_email, p_ip_address, p_user_agent);
  ELSE
    -- Email no existe, registrar intento con email
    INSERT INTO auth_logs (evento, email_intento, ip_address, user_agent)
    VALUES ('login_failed', p_email, p_ip_address, p_user_agent);
  END IF;
  
  RETURN jsonb_build_object(
    'bloqueado', v_bloqueado,
    'intentos', v_intentos
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Verificar si cuenta está activa y no bloqueada
-- ============================================

CREATE OR REPLACE FUNCTION check_admin_can_login(p_email VARCHAR(255))
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'can_login', (activo = true AND (bloqueado_hasta IS NULL OR bloqueado_hasta < NOW())),
    'activo', activo,
    'bloqueado', (bloqueado_hasta IS NOT NULL AND bloqueado_hasta > NOW()),
    'bloqueado_hasta', bloqueado_hasta,
    'role', role,
    'admin_id', id_admin
  )
  INTO v_result
  FROM administradores
  WHERE email = p_email;
  
  RETURN COALESCE(v_result, jsonb_build_object('can_login', false));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Registrar logout
-- ============================================

CREATE OR REPLACE FUNCTION handle_logout(
  p_admin_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO auth_logs (admin_id, evento, ip_address, user_agent)
  VALUES (p_admin_id, 'logout', p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Política: Los admins solo pueden leer sus propios datos
CREATE POLICY "Los admins pueden leer sus propios datos"
  ON administradores FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Política: Los superadmins pueden leer todos los datos
CREATE POLICY "Los superadmins pueden leer todo"
  ON administradores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE auth_user_id = auth.uid()
      AND role = 'superadmin'
      AND activo = true
    )
  );

-- Política: Solo superadmins pueden insertar nuevos admins
CREATE POLICY "Solo superadmins pueden crear admins"
  ON administradores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE auth_user_id = auth.uid()
      AND role = 'superadmin'
      AND activo = true
    )
  );

-- Política: Solo superadmins pueden actualizar admins
CREATE POLICY "Solo superadmins pueden actualizar admins"
  ON administradores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE auth_user_id = auth.uid()
      AND role = 'superadmin'
      AND activo = true
    )
  );

-- Política: Los logs solo son legibles por superadmins
CREATE POLICY "Solo superadmins pueden leer logs"
  ON auth_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE auth_user_id = auth.uid()
      AND role = 'superadmin'
      AND activo = true
    )
  );

-- ============================================
-- DATOS DE PRUEBA (SOLO DESARROLLO)
-- ============================================

-- NOTA: Primero crear el usuario en Supabase Auth Dashboard
-- Luego ejecutar este INSERT con el UUID correcto

-- Ejemplo (reemplazar con UUIDs reales):
/*
INSERT INTO administradores (email, nombre, role, activo, auth_user_id)
VALUES 
  ('superadmin@chicimportusa.com', 'Super Administrador', 'superadmin', true, 'UUID_DE_SUPABASE_AUTH'),
  ('admin@chicimportusa.com', 'Administrador Full', 'admin_full', true, 'UUID_DE_SUPABASE_AUTH');
*/

-- ============================================
-- GRANTS (Permisos)
-- ============================================

-- Dar permisos a usuarios autenticados
GRANT SELECT, INSERT, UPDATE ON administradores TO authenticated;
GRANT SELECT, INSERT ON auth_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE auth_logs_id_log_seq TO authenticated;

-- Dar permisos a las funciones
GRANT EXECUTE ON FUNCTION handle_successful_login TO authenticated;
GRANT EXECUTE ON FUNCTION handle_failed_login TO authenticated;
GRANT EXECUTE ON FUNCTION check_admin_can_login TO authenticated;
GRANT EXECUTE ON FUNCTION handle_logout TO authenticated;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
