-- =====================================================
-- MÓDULO 04: Gestión de Clientes y Toma de Pedidos
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. TABLA CLIENTES
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefono TEXT NOT NULL UNIQUE,
  nombres TEXT,
  apellidos TEXT,
  alias_whatsapp TEXT,
  canal_preferido TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_nombres ON clientes(nombres);
CREATE INDEX IF NOT EXISTS idx_clientes_alias ON clientes(alias_whatsapp);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. TABLA PEDIDOS
-- =====================================================
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_pedido TEXT UNIQUE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  estado_pedido TEXT NOT NULL DEFAULT 'nuevo',
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_probable_envio TIMESTAMPTZ,
  fecha_entrega TIMESTAMPTZ,
  lista_oferta_id UUID REFERENCES listas_oferta(id),
  canal_entrada TEXT,
  vendedor_user_id UUID,
  total_items INTEGER DEFAULT 0,
  total_venta_cop NUMERIC DEFAULT 0,
  total_costo_cop NUMERIC DEFAULT 0,
  total_ganancia_cop NUMERIC DEFAULT 0,
  notas_internas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo ON pedidos(codigo_pedido);

-- Trigger para updated_at
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. FUNCIÓN PARA GENERAR CÓDIGO DE PEDIDO
-- =====================================================
CREATE OR REPLACE FUNCTION generar_codigo_pedido()
RETURNS TRIGGER AS $$
DECLARE
  anio TEXT;
  secuencia INTEGER;
  nuevo_codigo TEXT;
BEGIN
  anio := to_char(now(), 'YYYY');
  
  -- Obtener el siguiente número de secuencia del año actual
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(codigo_pedido, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO secuencia
  FROM pedidos
  WHERE codigo_pedido LIKE 'P-' || anio || '-%';
  
  -- Formatear el código: P-2025-0001
  nuevo_codigo := 'P-' || anio || '-' || LPAD(secuencia::TEXT, 4, '0');
  
  NEW.codigo_pedido := nuevo_codigo;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_codigo_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  WHEN (NEW.codigo_pedido IS NULL)
  EXECUTE FUNCTION generar_codigo_pedido();

-- 4. TABLA PEDIDO_ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  lista_oferta_id UUID REFERENCES listas_oferta(id),
  titulo_articulo TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_venta_cop NUMERIC NOT NULL,
  costo_cop NUMERIC NOT NULL,
  ganancia_cop NUMERIC GENERATED ALWAYS AS (precio_venta_cop - costo_cop) STORED,
  fue_encontrado BOOLEAN NOT NULL DEFAULT false,
  talla TEXT,
  genero TEXT,
  descripcion_detallada TEXT,
  estado_item TEXT DEFAULT 'solicitado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_producto ON pedido_items(producto_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_estado ON pedido_items(estado_item);

-- Trigger para updated_at
CREATE TRIGGER update_pedido_items_updated_at
  BEFORE UPDATE ON pedido_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. FUNCIÓN PARA RECALCULAR TOTALES DEL PEDIDO
-- =====================================================
CREATE OR REPLACE FUNCTION recalcular_totales_pedido()
RETURNS TRIGGER AS $$
DECLARE
  pedido_uuid UUID;
BEGIN
  -- Determinar el pedido_id según la operación
  IF TG_OP = 'DELETE' THEN
    pedido_uuid := OLD.pedido_id;
  ELSE
    pedido_uuid := NEW.pedido_id;
  END IF;
  
  -- Recalcular totales
  UPDATE pedidos
  SET 
    total_items = (
      SELECT COALESCE(SUM(cantidad), 0)
      FROM pedido_items
      WHERE pedido_id = pedido_uuid
    ),
    total_venta_cop = (
      SELECT COALESCE(SUM(precio_venta_cop * cantidad), 0)
      FROM pedido_items
      WHERE pedido_id = pedido_uuid
    ),
    total_costo_cop = (
      SELECT COALESCE(SUM(costo_cop * cantidad), 0)
      FROM pedido_items
      WHERE pedido_id = pedido_uuid
    ),
    total_ganancia_cop = (
      SELECT COALESCE(SUM((precio_venta_cop - costo_cop) * cantidad), 0)
      FROM pedido_items
      WHERE pedido_id = pedido_uuid
    ),
    updated_at = now()
  WHERE id = pedido_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para recalcular totales
CREATE TRIGGER trigger_recalcular_totales_insert
  AFTER INSERT ON pedido_items
  FOR EACH ROW
  EXECUTE FUNCTION recalcular_totales_pedido();

CREATE TRIGGER trigger_recalcular_totales_update
  AFTER UPDATE ON pedido_items
  FOR EACH ROW
  EXECUTE FUNCTION recalcular_totales_pedido();

CREATE TRIGGER trigger_recalcular_totales_delete
  AFTER DELETE ON pedido_items
  FOR EACH ROW
  EXECUTE FUNCTION recalcular_totales_pedido();

-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;

-- Políticas para CLIENTES (solo admins autenticados)
CREATE POLICY "admins_can_view_clientes" ON clientes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE administradores.id_admin = auth.uid()
      AND administradores.activo = true
    )
  );

CREATE POLICY "admins_can_insert_clientes" ON clientes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE administradores.id_admin = auth.uid()
      AND administradores.activo = true
    )
  );

CREATE POLICY "admins_can_update_clientes" ON clientes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE administradores.id_admin = auth.uid()
      AND administradores.activo = true
    )
  );

CREATE POLICY "admins_can_delete_clientes" ON clientes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE administradores.id_admin = auth.uid()
      AND administradores.activo = true
    )
  );

-- Políticas para PEDIDOS (solo admins autenticados)
CREATE POLICY "admins_can_view_pedidos" ON pedidos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE administradores.id_admin = auth.uid()
      AND administradores.activo = true
    )
  );

CREATE POLICY "admins_can_insert_pedidos" ON pedidos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE administradores.id_admin = auth.uid()
      AND administradores.activo = true
    )
  );

CREATE POLICY "admins_can_update_pedidos" ON pedidos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE administradores.id_admin = auth.uid()
      AND administradores.activo = true
    )
  );

CREATE POLICY "admins_can_delete_pedidos" ON pedidos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE administradores.id_admin = auth.uid()
      AND administradores.activo = true
    )
  );

-- Políticas para PEDIDO_ITEMS (solo admins autenticados)
CREATE POLICY "admins_can_view_pedido_items" ON pedido_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE administradores.id_admin = auth.uid()
      AND administradores.activo = true
    )
  );

CREATE POLICY "admins_can_insert_pedido_items" ON pedido_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE administradores.id_admin = auth.uid()
      AND administradores.activo = true
    )
  );

CREATE POLICY "admins_can_update_pedido_items" ON pedido_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE administradores.id_admin = auth.uid()
      AND administradores.activo = true
    )
  );

CREATE POLICY "admins_can_delete_pedido_items" ON pedido_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE administradores.id_admin = auth.uid()
      AND administradores.activo = true
    )
  );

-- =====================================================
-- FIN DEL SCRIPT SQL
-- =====================================================