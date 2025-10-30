-- =====================================================
-- PWA Import Marketplace - Modelo de Datos
-- Módulo 01: Gestión de Productos y Cálculo de Precios
-- =====================================================

-- Enums
CREATE TYPE estado_lista AS ENUM ('borrador', 'publicada', 'cerrada', 'archivada');
CREATE TYPE estado_producto AS ENUM ('borrador', 'listo_para_publicar', 'publicado', 'oculto');
CREATE TYPE tax_modo AS ENUM ('porcentaje', 'valor_fijo_usd');
CREATE TYPE categoria_producto AS ENUM (
  'calzado', 
  'ropa', 
  'tecnologia', 
  'hogar', 
  'deportes', 
  'belleza', 
  'juguetes',
  'otros'
);

-- =====================================================
-- Tabla: listas_oferta
-- Contiene las ofertas/catálogos con TRM y TAX únicos
-- =====================================================
CREATE TABLE listas_oferta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información básica
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha_oferta DATE NOT NULL DEFAULT CURRENT_DATE,
  estado estado_lista NOT NULL DEFAULT 'borrador',
  
  -- Parámetros económicos (aplican a todos los productos)
  trm_lista DECIMAL(10,2) NOT NULL,
  tax_modo_lista tax_modo NOT NULL,
  tax_porcentaje_lista DECIMAL(5,2), -- Requerido si tax_modo = 'porcentaje'
  tax_usd_lista DECIMAL(10,2),       -- Requerido si tax_modo = 'valor_fijo_usd'
  
  -- Margen por defecto para productos de esta lista (opcional)
  margen_default_porcentaje DECIMAL(5,2) DEFAULT 25.00,
  
  -- Metadatos
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  publicado_por UUID REFERENCES auth.users(id),
  publicado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT trm_positiva CHECK (trm_lista > 0),
  CONSTRAINT tax_porcentaje_valido CHECK (
    (tax_modo_lista = 'porcentaje' AND tax_porcentaje_lista IS NOT NULL AND tax_porcentaje_lista >= 0)
    OR tax_modo_lista != 'porcentaje'
  ),
  CONSTRAINT tax_usd_valido CHECK (
    (tax_modo_lista = 'valor_fijo_usd' AND tax_usd_lista IS NOT NULL AND tax_usd_lista >= 0)
    OR tax_modo_lista != 'valor_fijo_usd'
  )
);

-- Índices para listas
CREATE INDEX idx_listas_estado ON listas_oferta(estado);
CREATE INDEX idx_listas_fecha ON listas_oferta(fecha_oferta DESC);
CREATE INDEX idx_listas_creado_por ON listas_oferta(creado_por);

-- =====================================================
-- Tabla: productos
-- Productos individuales dentro de una lista de oferta
-- =====================================================
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación con lista
  id_lista UUID NOT NULL REFERENCES listas_oferta(id) ON DELETE CASCADE,
  
  -- Información básica
  titulo VARCHAR(255) NOT NULL,
  marca VARCHAR(100),
  categoria categoria_producto NOT NULL,
  descripcion TEXT,
  imagenes TEXT[] NOT NULL DEFAULT '{}', -- Array de URLs
  origen VARCHAR(50), -- 'fisica' o 'web'
  url_referencia TEXT, -- Si es de una tienda online
  
  -- Valores base
  precio_base_usd DECIMAL(10,2) NOT NULL,
  margen_porcentaje DECIMAL(5,2), -- Margen específico del producto
  
  -- Valores calculados (actualizados automáticamente)
  costo_total_usd DECIMAL(10,2),
  costo_total_cop DECIMAL(12,0), -- Redondeado a decena
  precio_sugerido_cop DECIMAL(12,0), -- Redondeado a decena
  precio_final_cop DECIMAL(12,0), -- Editable antes de publicar
  ganancia_cop DECIMAL(12,0), -- Redondeado a decena
  
  -- Estado
  estado estado_producto NOT NULL DEFAULT 'borrador',
  
  -- Snapshot al publicar (valores congelados)
  publicado_at TIMESTAMPTZ,
  publicado_por UUID REFERENCES auth.users(id),
  trm_usada_publicacion DECIMAL(10,2),
  tax_usado_publicacion DECIMAL(10,2),
  margen_usado_publicacion DECIMAL(5,2),
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT precio_base_positivo CHECK (precio_base_usd > 0),
  CONSTRAINT margen_no_negativo CHECK (margen_porcentaje IS NULL OR margen_porcentaje >= 0),
  CONSTRAINT precio_mayor_o_igual_costo CHECK (
    precio_final_cop IS NULL OR 
    costo_total_cop IS NULL OR 
    precio_final_cop >= costo_total_cop
  ),
  CONSTRAINT imagenes_minimo_una CHECK (array_length(imagenes, 1) >= 1 OR estado != 'publicado'),
  CONSTRAINT titulo_unico_por_lista UNIQUE(id_lista, titulo)
);

-- Índices para productos
CREATE INDEX idx_productos_lista ON productos(id_lista);
CREATE INDEX idx_productos_estado ON productos(estado);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_publicado_at ON productos(publicado_at DESC) WHERE estado = 'publicado';

-- =====================================================
-- Función: Redondear a decena
-- =====================================================
CREATE OR REPLACE FUNCTION redondear_a_decena(valor DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(valor / 10) * 10;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Función: Calcular valores de producto
-- Calcula automáticamente los valores económicos
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_valores_producto()
RETURNS TRIGGER AS $$
DECLARE
  v_trm DECIMAL(10,2);
  v_tax_modo tax_modo;
  v_tax_porcentaje DECIMAL(5,2);
  v_tax_usd DECIMAL(10,2);
  v_tax_final DECIMAL(10,2);
  v_margen DECIMAL(5,2);
  v_margen_default DECIMAL(5,2);
BEGIN
  -- Obtener valores de la lista
  SELECT 
    trm_lista, 
    tax_modo_lista, 
    tax_porcentaje_lista, 
    tax_usd_lista,
    margen_default_porcentaje
  INTO 
    v_trm, 
    v_tax_modo, 
    v_tax_porcentaje, 
    v_tax_usd,
    v_margen_default
  FROM listas_oferta
  WHERE id = NEW.id_lista;
  
  -- Calcular TAX según modo
  IF v_tax_modo = 'valor_fijo_usd' THEN
    v_tax_final := v_tax_usd;
  ELSIF v_tax_modo = 'porcentaje' THEN
    v_tax_final := NEW.precio_base_usd * (v_tax_porcentaje / 100);
  ELSE
    v_tax_final := 0;
  END IF;
  
  -- Determinar margen a usar
  v_margen := COALESCE(NEW.margen_porcentaje, v_margen_default, 0);
  
  -- Calcular valores
  NEW.costo_total_usd := NEW.precio_base_usd + v_tax_final;
  NEW.costo_total_cop := redondear_a_decena(NEW.costo_total_usd * v_trm);
  NEW.precio_sugerido_cop := redondear_a_decena(NEW.costo_total_cop * (1 + v_margen / 100));
  
  -- Si no hay precio_final_cop, usar el sugerido
  IF NEW.precio_final_cop IS NULL THEN
    NEW.precio_final_cop := NEW.precio_sugerido_cop;
  END IF;
  
  -- Calcular ganancia
  NEW.ganancia_cop := redondear_a_decena(NEW.precio_final_cop - NEW.costo_total_cop);
  
  -- Actualizar timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular valores antes de insert/update
CREATE TRIGGER trigger_calcular_valores_producto
  BEFORE INSERT OR UPDATE OF precio_base_usd, margen_porcentaje, precio_final_cop
  ON productos
  FOR EACH ROW
  EXECUTE FUNCTION calcular_valores_producto();

-- =====================================================
-- Función: Congelar snapshot al publicar
-- =====================================================
CREATE OR REPLACE FUNCTION congelar_snapshot_publicacion()
RETURNS TRIGGER AS $$
DECLARE
  v_trm DECIMAL(10,2);
  v_tax_modo tax_modo;
  v_tax_porcentaje DECIMAL(5,2);
  v_tax_usd DECIMAL(10,2);
  v_tax_final DECIMAL(10,2);
  v_margen DECIMAL(5,2);
  v_margen_default DECIMAL(5,2);
BEGIN
  -- Solo actuar cuando cambia a estado 'publicado'
  IF NEW.estado = 'publicado' AND (OLD.estado IS NULL OR OLD.estado != 'publicado') THEN
    -- Obtener valores actuales de la lista
    SELECT 
      trm_lista, 
      tax_modo_lista, 
      tax_porcentaje_lista, 
      tax_usd_lista,
      margen_default_porcentaje
    INTO 
      v_trm, 
      v_tax_modo, 
      v_tax_porcentaje, 
      v_tax_usd,
      v_margen_default
    FROM listas_oferta
    WHERE id = NEW.id_lista;
    
    -- Calcular TAX usado
    IF v_tax_modo = 'valor_fijo_usd' THEN
      v_tax_final := v_tax_usd;
    ELSIF v_tax_modo = 'porcentaje' THEN
      v_tax_final := NEW.precio_base_usd * (v_tax_porcentaje / 100);
    ELSE
      v_tax_final := 0;
    END IF;
    
    -- Determinar margen usado
    v_margen := COALESCE(NEW.margen_porcentaje, v_margen_default, 0);
    
    -- Congelar snapshot
    NEW.publicado_at := NOW();
    NEW.trm_usada_publicacion := v_trm;
    NEW.tax_usado_publicacion := v_tax_final;
    NEW.margen_usado_publicacion := v_margen;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para congelar snapshot
CREATE TRIGGER trigger_congelar_snapshot
  BEFORE UPDATE OF estado
  ON productos
  FOR EACH ROW
  EXECUTE FUNCTION congelar_snapshot_publicacion();

-- =====================================================
-- Función: Recalcular productos en borrador
-- Cuando cambia TRM o TAX de la lista
-- =====================================================
CREATE OR REPLACE FUNCTION recalcular_productos_borrador()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo recalcular si cambiaron TRM o TAX
  IF (OLD.trm_lista IS DISTINCT FROM NEW.trm_lista) OR
     (OLD.tax_modo_lista IS DISTINCT FROM NEW.tax_modo_lista) OR
     (OLD.tax_porcentaje_lista IS DISTINCT FROM NEW.tax_porcentaje_lista) OR
     (OLD.tax_usd_lista IS DISTINCT FROM NEW.tax_usd_lista) THEN
    
    -- Forzar recálculo de productos en borrador
    UPDATE productos
    SET updated_at = NOW() -- Esto dispara el trigger de cálculo
    WHERE id_lista = NEW.id
      AND estado IN ('borrador', 'listo_para_publicar');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular productos
CREATE TRIGGER trigger_recalcular_productos
  AFTER UPDATE OF trm_lista, tax_modo_lista, tax_porcentaje_lista, tax_usd_lista
  ON listas_oferta
  FOR EACH ROW
  EXECUTE FUNCTION recalcular_productos_borrador();

-- =====================================================
-- Políticas RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE listas_oferta ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Políticas para listas_oferta (todos los admins pueden ver y editar)
CREATE POLICY "Admins pueden ver todas las listas"
  ON listas_oferta FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins pueden crear listas"
  ON listas_oferta FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins pueden actualizar listas"
  ON listas_oferta FOR UPDATE
  TO authenticated
  USING (true);

-- Políticas para productos (todos los admins pueden ver y editar)
CREATE POLICY "Admins pueden ver todos los productos"
  ON productos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins pueden crear productos"
  ON productos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins pueden actualizar productos"
  ON productos FOR UPDATE
  TO authenticated
  USING (true);

-- =====================================================
-- Comentarios en tablas
-- =====================================================
COMMENT ON TABLE listas_oferta IS 'Listas de ofertas con TRM y TAX únicos que aplican a todos sus productos';
COMMENT ON TABLE productos IS 'Productos individuales asociados a una lista de oferta';
COMMENT ON COLUMN productos.costo_total_cop IS 'Costo en COP redondeado a decena';
COMMENT ON COLUMN productos.precio_final_cop IS 'Precio editable antes de publicar, debe ser >= costo';
COMMENT ON COLUMN productos.ganancia_cop IS 'Ganancia esperada redondeada a decena';