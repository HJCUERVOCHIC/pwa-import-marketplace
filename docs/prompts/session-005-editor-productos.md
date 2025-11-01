# Desde la raíz del proyecto
git add .
git commit -m "feat: módulo completo de gestión de productos con calculadora y Supabase Storage

- Editor de productos con dos columnas (info + calculadora)
- Calculadora de precios en tiempo real con redondeo a miles
- Modo manual/automático para precio final con checkbox
- Upload de imágenes a Supabase Storage (cámara y galería)
- Formato de moneda colombiana con Intl.NumberFormat
- Validaciones completas (precio >= costo, mínimo 1 imagen)
- Eliminación de campos innecesarios (origen, URL)
- Servicio de upload con manejo de múltiples imágenes
- Políticas RLS públicas para desarrollo
- Labels descriptivos en botones de cámara/galería"

git push origin main

Paso 2: Crear Documentación Completa
Crea el archivo docs/prompts/session-005-editor-productos.md:
markdown# Sesión 005 - Editor de Productos Completo

**Fecha:** 2025-10-30  
**Módulo:** 01 - Gestión de Productos y Cálculo de Precios  
**Estado:** ✅ Completado  

---

## Contexto

Desarrollo del editor completo de productos con calculadora de precios en tiempo real, gestión de imágenes mediante Supabase Storage, y todas las validaciones necesarias según el requerimiento del Módulo 01.

---

## Objetivo

Crear una interfaz completa que permita a los administradores:
1. Registrar productos importados de USA
2. Calcular automáticamente precios con TRM y TAX de la lista
3. Gestionar imágenes (tomar fotos o subir desde galería)
4. Visualizar cálculos económicos en tiempo real
5. Ajustar precios manualmente si es necesario

---

## Componentes Desarrollados

### 1. ModalEditorProducto.jsx

**Ubicación:** `frontend/src/components/ModalEditorProducto.jsx`

**Estructura:**
- Modal de dos columnas responsivo
- Columna izquierda: Información del producto
- Columna derecha: Calculadora de precios

**Campos del Formulario:**

**Información Básica:**
- Título (obligatorio, mín 3 caracteres)
- Marca (opcional)
- Categoría (selector, obligatorio)
- Descripción (textarea, opcional)
- Imágenes (mínimo 1, obligatorio)

**Calculadora:**
- Precio Base USD (obligatorio, > 0)
- Margen % (opcional, default 25%)
- Precio Final COP (automático o manual)

**Resultados Calculados:**
- TAX en USD
- Costo Total USD
- Costo Total COP (redondeado a miles)
- Precio Sugerido COP (redondeado a miles)
- Ganancia Esperada COP (redondeada a miles)

### 2. uploadService.js

**Ubicación:** `frontend/src/services/uploadService.js`

**Funciones:**
```javascript
uploadImage(file, folder)
// Sube una imagen a Supabase Storage
// Genera nombre único con timestamp
// Retorna URL pública

uploadMultipleImages(files, folder)
// Sube múltiples imágenes en paralelo
// Usa Promise.all para eficiencia
// Retorna array de URLs

deleteImage(imageUrl)
// Elimina imagen de Storage
// Extrae path desde URL
// Retorna boolean
```

---

## Flujo de Uso Completo

### 1. Abrir Editor
Usuario hace click en "Agregar Producto" → Modal se abre

### 2. Completar Información
- Ingresa título, marca, categoría, descripción
- Agrega imágenes (cámara o galería)
- Las imágenes se suben automáticamente a Storage

### 3. Configurar Precios
- Ingresa precio base en USD
- Ajusta margen de ganancia (opcional)
- La calculadora actualiza todos los valores automáticamente

### 4. Ajustar Precio Final (Opcional)
- Por defecto: se actualiza automáticamente con precio sugerido
- Si activa "Editar manualmente": puede ingresar valor custom
- La ganancia se recalcula al instante

### 5. Guardar Producto
- Validaciones se ejecutan
- Si pasa validaciones, se crea en Supabase
- Producto aparece en la lista sin refrescar
- Modal se cierra y formulario se resetea

---

## Funcionalidades Clave

### Calculadora de Precios en Tiempo Real

**Fórmulas implementadas:**
```javascript
// 1. TAX según modo de lista
if (tax_modo === 'porcentaje') {
  taxUsd = precio_base_usd * (tax_porcentaje / 100)
} else {
  taxUsd = tax_usd_fijo
}

// 2. Costo Total
costo_total_usd = precio_base_usd + taxUsd
costo_total_cop = redondearAMil(costo_total_usd * trm)

// 3. Precio Sugerido
precio_sugerido_cop = redondearAMil(
  costo_total_cop * (1 + margen / 100)
)

// 4. Ganancia
ganancia_cop = redondearAMil(
  precio_final_cop - costo_total_cop
)
```

**Redondeo a miles:**
```javascript
const redondearAMil = (valor) => {
  return Math.round(valor / 1000) * 1000
}
```

**Formato de moneda:**
```javascript
const formatearMonedaCOP = (valor) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor)
}
```

### Modo Manual/Automático para Precio Final

**Estado:** `precioManual` (boolean)

**Comportamiento automático (default):**
- Precio final = Precio sugerido
- Se actualiza al cambiar precio base o margen
- Campo bloqueado (fondo gris, readonly)

**Comportamiento manual (checkbox activado):**
- Usuario puede editar libremente
- Ganancia se recalcula al cambiar
- Campo desbloqueado (fondo blanco, editable)

**useEffect para recálculo:**
```javascript
useEffect(() => {
  if (formData.precio_base_usd && lista) {
    calcularValores()
  }
}, [formData.precio_base_usd, formData.margen_porcentaje, precioManual, lista])

useEffect(() => {
  if (precioManual && calculos && formData.precio_final_cop) {
    // Recalcular solo ganancia
  }
}, [formData.precio_final_cop, precioManual])
```

### Gestión de Imágenes con Supabase Storage

**Upload workflow:**
1. Usuario selecciona/toma foto(s)
2. `uploadingImages = true` (spinner visible)
3. Imágenes se suben a Storage en paralelo
4. Se obtienen URLs públicas
5. URLs se agregan a formData y preview
6. `uploadingImages = false`

**Delete workflow:**
1. Usuario hace click en X de imagen
2. Imagen se elimina de Storage (si no es Base64)
3. Se remueve de preview y formData

**Ventajas sobre Base64:**
- Base de datos más liviana (solo URLs)
- CDN de Supabase para carga rápida
- Caché optimizado
- Mejor performance general

---

## Ajustes Realizados Durante el Desarrollo

### 1. Eliminación de margen_default de lista

**Problema:** Margen estaba a nivel de lista en diseño inicial  
**Solución:** 
- Eliminado `margen_default_porcentaje` de tabla `listas_oferta`
- Actualizado trigger `calcular_valores_producto()`
- Margen ahora es solo por producto individual

**SQL ejecutado:**
```sql
ALTER TABLE listas_oferta DROP COLUMN margen_default_porcentaje;
```

### 2. Cambio de redondeo: decenas → miles

**Razón:** Precios en Colombia se manejan mejor en miles  
**Cambio:** `redondearADecena()` → `redondearAMil()`  
**Impacto:** Todos los valores COP terminan en 000

**Antes:** $449,350 COP  
**Ahora:** $449,000 COP

### 3. Formato de moneda colombiana

**Implementado:** `Intl.NumberFormat` con locale 'es-CO'  
**Resultado:** `$ 1.234.000` (con separadores y símbolo)  
**Aplicado a:** Todos los valores COP en el panel de resultados

### 4. Precio final con modo manual/automático

**Problema:** Al cambiar margen, precio final no se actualizaba  
**Solución:** Checkbox "Editar manualmente"
- Desactivado: se actualiza automáticamente (comportamiento default)
- Activado: usuario controla el valor

### 5. Eliminación de campos innecesarios

**Removidos:**
- Campo "Origen" (física/web)
- Campo "URL de Referencia"

**Razón:** No necesarios para el flujo del negocio

### 6. Cambio de URL a upload desde dispositivo

**Antes:** Agregar URL de imagen desde internet  
**Ahora:** Tomar foto o subir desde galería  
**Implementación:** Supabase Storage + botones nativos

### 7. Labels descriptivos en botones

**Problema:** Botón "Tomar Foto" no activaba cámara en PC  
**Causa:** `capture="environment"` solo funciona en móviles  
**Solución:** 
- Labels claros: "📷 Tomar Foto" y "🖼️ Desde Galería"
- Mensaje explicativo: "Tomar Foto abre la cámara en dispositivos móviles"

---

## Problemas Técnicos Resueltos

### 1. Order of Hooks Error

**Error:** 
```
React has detected a change in the order of Hooks
```

**Causa:** `if (!isOpen) return null` antes de los hooks

**Solución:** Mover todos los hooks antes del return condicional
```javascript
// ✅ Correcto
const [state] = useState()
useEffect(() => {})
if (!isOpen) return null

// ❌ Incorrecto
const [state] = useState()
if (!isOpen) return null
useEffect(() => {})
```

### 2. RLS bloqueando uploads

**Error:** 
```
StorageApiError: new row violates row-level security policy
```

**Causa:** Políticas RLS requerían autenticación

**Solución:** Políticas públicas con `TO public`
```sql
CREATE POLICY "Public can upload to productos-imagenes" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'productos-imagenes');

CREATE POLICY "Public can view productos-imagenes" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'productos-imagenes');

CREATE POLICY "Public can delete from productos-imagenes" 
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'productos-imagenes');
```

### 3. Precio final no se inicializaba

**Problema:** Campo quedaba vacío al calcular por primera vez

**Solución:** Mover `setFormData` al final de `calcularValores()`
```javascript
setCalculos({ ... })

// Inicializar precio_final si está vacío
if (!precioManual) {
  setFormData(prev => ({
    ...prev,
    precio_final_cop: precioSugeridoCop.toString()
  }))
}
```

---

## Validaciones Implementadas

### Cliente (Frontend)
```javascript
// Título
if (!titulo.trim() || titulo.length < 3) {
  error = "El título debe tener al menos 3 caracteres"
}

// Precio base
if (!precio_base_usd || precio_base_usd <= 0) {
  error = "El precio base debe ser mayor a 0"
}

// Margen
if (margen_porcentaje && margen_porcentaje < 0) {
  error = "El margen no puede ser negativo"
}

// Precio final vs costo
if (precio_final_cop < costo_total_cop) {
  error = "El precio no puede ser menor al costo"
}

// Imágenes
if (imagenes.length === 0) {
  error = "Agrega al menos una imagen"
}
```

### Base de Datos (Triggers)

Los triggers en PostgreSQL garantizan:
- Cálculos correctos automáticamente
- Redondeo consistente
- Valores no negativos
- Integridad referencial

---

## Configuración de Supabase

### Storage Bucket

**Nombre:** `productos-imagenes`  
**Público:** Sí  
**Estructura:**
```
productos-imagenes/
  └── productos/
      ├── 1730276543210-a3b4c5d.jpg
      ├── 1730276544115-x8y9z0a.png
      └── ...
```

### Políticas RLS (Desarrollo)
```sql
-- INSERT
CREATE POLICY "Public can upload to productos-imagenes" 
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'productos-imagenes');

-- SELECT
CREATE POLICY "Public can view productos-imagenes" 
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'productos-imagenes');

-- DELETE
CREATE POLICY "Public can delete from productos-imagenes" 
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'productos-imagenes');
```

**Nota:** En producción, estas políticas deben requerir autenticación.

---

## Archivos del Proyecto

### Nuevos
1. `frontend/src/components/ModalEditorProducto.jsx` - Editor completo
2. `frontend/src/services/uploadService.js` - Servicio de upload

### Modificados
3. `frontend/src/pages/ProductosPage.jsx` - Integración del modal
4. Base de datos: Políticas Storage, trigger actualizado

---

## Pruebas Realizadas

### Funcionales
✅ Abrir modal desde página de productos  
✅ Completar formulario con todos los campos  
✅ Calcular precios automáticamente  
✅ Verificar redondeo a miles  
✅ Verificar formato de moneda  
✅ Modo automático: precio final se actualiza con margen  
✅ Activar modo manual y editar precio final  
✅ Verificar recálculo de ganancia en tiempo real  
✅ Tomar foto con cámara (móvil)  
✅ Subir imagen desde galería  
✅ Subir múltiples imágenes simultáneamente  
✅ Ver preview de imágenes  
✅ Eliminar imagen del preview  
✅ Verificar upload a Supabase Storage  
✅ Verificar eliminación de Storage  
✅ Guardar producto completo  
✅ Producto aparece en lista sin refrescar  

### Validaciones
✅ Título obligatorio (error si vacío)  
✅ Título mínimo 3 caracteres (error si < 3)  
✅ Categoría obligatoria (siempre seleccionada)  
✅ Precio base obligatorio y > 0 (error si ≤ 0)  
✅ Margen no negativo (error si < 0)  
✅ Precio final >= costo (error si menor)  
✅ Mínimo 1 imagen (error si 0)  
✅ Mensajes de error específicos  

### UX/Performance
✅ Spinner durante upload de imágenes  
✅ Botones deshabilitados durante carga  
✅ Preview inmediato de imágenes  
✅ Cálculos instantáneos sin lag  
✅ Modal responsivo (mobile y desktop)  
✅ Labels descriptivos en botones  
✅ Mensaje explicativo sobre cámara  

---

## Métricas del Módulo

**Líneas de código:**
- ModalEditorProducto.jsx: ~700 líneas
- uploadService.js: ~95 líneas
- Total: ~800 líneas nuevas

**Tiempo de desarrollo:** 1 sesión (varias horas)

**Componentes creados:** 2

**Servicios creados:** 1

**Integraciones:** Supabase Storage

---

## Comandos SQL Completos
```sql
-- 1. Eliminar margen_default de listas
ALTER TABLE listas_oferta DROP COLUMN IF EXISTS margen_default_porcentaje;

-- 2. Actualizar trigger (sin margen_default)
CREATE OR REPLACE FUNCTION calcular_valores_producto()
RETURNS TRIGGER AS $$
DECLARE
  v_trm DECIMAL(10,2);
  v_tax_modo tax_modo;
  v_tax_porcentaje DECIMAL(5,2);
  v_tax_usd DECIMAL(10,2);
  v_tax_final DECIMAL(10,2);
  v_margen DECIMAL(5,2);
BEGIN
  SELECT trm_lista, tax_modo_lista, tax_porcentaje_lista, tax_usd_lista
  INTO v_trm, v_tax_modo, v_tax_porcentaje, v_tax_usd
  FROM listas_oferta WHERE id = NEW.id_lista;
  
  IF v_tax_modo = 'valor_fijo_usd' THEN
    v_tax_final := v_tax_usd;
  ELSIF v_tax_modo = 'porcentaje' THEN
    v_tax_final := NEW.precio_base_usd * (v_tax_porcentaje / 100);
  ELSE
    v_tax_final := 0;
  END IF;
  
  v_margen := COALESCE(NEW.margen_porcentaje, 0);
  
  NEW.costo_total_usd := NEW.precio_base_usd + v_tax_final;
  NEW.costo_total_cop := ROUND((NEW.costo_total_usd * v_trm) / 1000) * 1000;
  NEW.precio_sugerido_cop := ROUND((NEW.costo_total_cop * (1 + v_margen / 100)) / 1000) * 1000;
  
  IF NEW.precio_final_cop IS NULL THEN
    NEW.precio_final_cop := NEW.precio_sugerido_cop;
  END IF;
  
  NEW.ganancia_cop := ROUND((NEW.precio_final_cop - NEW.costo_total_cop) / 1000) * 1000;
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear bucket Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos-imagenes', 'productos-imagenes', true);

-- 4. Políticas Storage públicas
CREATE POLICY "Public can upload to productos-imagenes" 
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'productos-imagenes');

CREATE POLICY "Public can view productos-imagenes" 
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'productos-imagenes');

CREATE POLICY "Public can delete from productos-imagenes" 
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'productos-imagenes');
```

---

## Próximos Pasos

### Inmediatos
- [ ] Implementar autenticación de usuarios
- [ ] Actualizar políticas RLS para requerir autenticación
- [ ] Funcionalidad de edición de productos existentes
- [ ] Funcionalidad de publicación de productos

### Medio Plazo
- [ ] Vista pública del catálogo (sin login)
- [ ] Sistema de búsqueda y filtros
- [ ] Paginación de productos
- [ ] Optimización de imágenes (resize automático)

### Largo Plazo
- [ ] PWA capabilities completas (offline, notifications)
- [ ] Analytics de productos más vistos
- [ ] Sistema de favoritos
- [ ] Integración con pasarelas de pago

---

## Lecciones Aprendidas

1. **Hooks en React:** Siempre deben estar antes de cualquier return condicional
2. **Supabase Storage:** Políticas `TO public` permiten acceso sin autenticación en desarrollo
3. **UX de cámara:** `capture="environment"` solo funciona en móviles, necesita explicación
4. **Formato de moneda:** `Intl.NumberFormat` es mejor que formateo manual
5. **Estado de formularios:** Separar modo manual/automático mejora la experiencia

---

## Recursos Útiles

**Documentación:**
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [React useEffect](https://react.dev/reference/react/useEffect)
- [MDN: Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)

**Comandos útiles:**
```sql
-- Ver imágenes en Storage
SELECT * FROM storage.objects WHERE bucket_id = 'productos-imagenes';

-- Ver políticas activas
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- Ver productos creados
SELECT id, titulo, precio_base_usd, precio_final_cop, ganancia_cop 
FROM productos ORDER BY created_at DESC;
```

---

## Conclusión

Se completó exitosamente el **Módulo 01: Gestión de Productos y Cálculo de Precios** con todas las funcionalidades requeridas:

✅ Editor completo de productos  
✅ Calculadora de precios en tiempo real  
✅ Gestión de imágenes con Storage  
✅ Validaciones completas  
✅ UX optimizada  

El módulo está listo para uso en desarrollo. Pendiente implementar autenticación y actualizar políticas de seguridad para producción.

Guarda ese archivo:
bashgit add docs/prompts/session-005-editor-productos.md
git commit -m "docs: documentación completa sesión 005 - editor de productos"
git push origin main

¡Sesión Completada! 🎉
Has desarrollado exitosamente:

✅ Formulario de creación de listas
✅ Editor completo de productos
✅ Calculadora de precios en tiempo real
✅ Integración con Supabase Storage
✅ Sistema completo de validaciones

Todo el Módulo 01 está funcional y documentado.