# Modificaciones para Agregar Campos de Auditoría

## ModalCrearLista.jsx

### Cambio 1: Importar useAuth

```jsx
// Al inicio del archivo, agregar:
import { useAuth } from '@/features/auth/context/AuthContext'
```

### Cambio 2: Usar el hook en el componente

```jsx
export default function ModalCrearLista({ isOpen, onClose, onListaCreada }) {
  // Agregar esta línea después de las declaraciones de estado:
  const { user } = useAuth()
  
  // ... resto del código
```

### Cambio 3: Incluir creado_por al crear lista

```jsx
const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  
  try {
    const { data, error } = await supabase
      .from('listas_oferta')
      .insert([{
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        fecha_oferta: formData.fecha_oferta,
        trm_lista: formData.trm_lista,
        tax_modo_lista: formData.tax_modo,
        tax_porcentaje_lista: formData.tax_modo === 'porcentaje' ? formData.tax_valor : null,
        tax_usd_lista: formData.tax_modo === 'fijo' ? formData.tax_valor : null,
        creado_por: user?.id  // ✅ AGREGAR ESTA LÍNEA
      }])
      .select()
      .single()
    
    if (error) throw error
    
    onListaCreada(data)
    onClose()
    resetForm()
  } catch (error) {
    console.error('Error al crear lista:', error)
    alert('Error al crear la lista: ' + error.message)
  } finally {
    setLoading(false)
  }
}
```

---

## ModalEditorProducto.jsx

### Cambio 1: Importar useAuth

```jsx
// Al inicio del archivo, agregar:
import { useAuth } from '@/features/auth/context/AuthContext'
```

### Cambio 2: Usar el hook en el componente

```jsx
export default function ModalEditorProducto({ isOpen, onClose, lista, onProductoCreado }) {
  // Agregar esta línea después de las declaraciones de estado:
  const { user } = useAuth()
  
  // ... resto del código
```

### Cambio 3: Incluir publicado_por al crear producto

```jsx
const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  
  try {
    // Subir imágenes primero (código existente)
    const imagenesUrls = await Promise.all(
      imagenes.map(img => uploadImage(img.file, 'productos'))
    )
    
    // Determinar si debe llenar publicado_por
    const publicadoPor = ['listo_para_publicar', 'publicado'].includes(formData.estado)
      ? user?.id
      : null
    
    // Crear producto
    const { data, error } = await supabase
      .from('productos')
      .insert([{
        id_lista: lista.id,
        titulo: formData.titulo,
        marca: formData.marca,
        categoria: formData.categoria,
        descripcion: formData.descripcion,
        imagenes: imagenesUrls,
        precio_base_usd: formData.precio_base_usd,
        margen_porcentaje: formData.margen_porcentaje,
        precio_final_cop: formData.precio_final_cop,
        estado: formData.estado || 'borrador',
        publicado_por: publicadoPor  // ✅ AGREGAR ESTA LÍNEA
      }])
      .select()
      .single()
    
    if (error) throw error
    
    onProductoCreado(data)
    onClose()
    resetForm()
  } catch (error) {
    console.error('Error al crear producto:', error)
    alert('Error al crear el producto: ' + error.message)
  } finally {
    setLoading(false)
  }
}
```

### Cambio 4: Al actualizar estado de producto (si implementas edición)

```jsx
const handlePublicarProducto = async (productoId) => {
  try {
    const { error } = await supabase
      .from('productos')
      .update({
        estado: 'publicado',
        publicado_por: user?.id,  // ✅ Agregar user al publicar
        publicado_at: new Date().toISOString()
      })
      .eq('id', productoId)
    
    if (error) throw error
    
    alert('Producto publicado exitosamente')
  } catch (error) {
    console.error('Error al publicar:', error)
    alert('Error al publicar el producto')
  }
}
```

---

## Verificación

Después de implementar estos cambios:

1. **Crear una lista nueva**
   - Debe llenar automáticamente `creado_por`

2. **Crear un producto**
   - Si es borrador: `publicado_por` debe ser `null`
   - Si es "listo para publicar" o "publicado": `publicado_por` debe tener el user ID

3. **Verificar en Supabase:**

```sql
-- Ver últimas listas creadas con usuario
SELECT 
  l.titulo,
  l.creado_por,
  a.nombre as creado_por_nombre,
  l.created_at
FROM listas_oferta l
LEFT JOIN administradores a ON a.auth_user_id = l.creado_por
ORDER BY l.created_at DESC
LIMIT 5;

-- Ver últimos productos con usuario
SELECT 
  p.titulo,
  p.estado,
  p.publicado_por,
  a.nombre as publicado_por_nombre,
  p.publicado_at
FROM productos p
LEFT JOIN administradores a ON a.auth_user_id = p.publicado_por
ORDER BY p.created_at DESC
LIMIT 5;
```

---

## Manejo de Errores

Si `user` es `null`:
- La inserción fallará con RLS habilitado
- Debe mostrar error al usuario
- Verificar que AuthContext esté funcionando

### Agregar validación preventiva:

```jsx
const handleSubmit = async (e) => {
  e.preventDefault()
  
  // Validar que haya usuario autenticado
  if (!user?.id) {
    alert('Error: No hay sesión activa. Por favor, vuelve a iniciar sesión.')
    return
  }
  
  setLoading(true)
  
  // ... resto del código
}
```

---

## Código Completo de Ejemplo

### ModalCrearLista.jsx (versión completa)

```jsx
import { useState } from 'react'
import { supabase } from '@/services/supabaseClient'
import { useAuth } from '@/features/auth/context/AuthContext'

export default function ModalCrearLista({ isOpen, onClose, onListaCreada }) {
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_oferta: '',
    trm_lista: '',
    tax_modo: 'porcentaje',
    tax_valor: ''
  })
  
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar usuario
    if (!user?.id) {
      alert('Error: No hay sesión activa. Por favor, vuelve a iniciar sesión.')
      return
    }
    
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('listas_oferta')
        .insert([{
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          fecha_oferta: formData.fecha_oferta,
          trm_lista: parseFloat(formData.trm_lista),
          tax_modo_lista: formData.tax_modo,
          tax_porcentaje_lista: formData.tax_modo === 'porcentaje' 
            ? parseFloat(formData.tax_valor) 
            : null,
          tax_usd_lista: formData.tax_modo === 'fijo' 
            ? parseFloat(formData.tax_valor) 
            : null,
          creado_por: user.id
        }])
        .select()
        .single()
      
      if (error) throw error
      
      onListaCreada(data)
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error al crear lista:', error)
      alert('Error al crear la lista: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      fecha_oferta: '',
      trm_lista: '',
      tax_modo: 'porcentaje',
      tax_valor: ''
    })
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Nueva Lista de Oferta</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campos del formulario... */}
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Lista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

---

## Resumen de Cambios

| Archivo | Líneas agregadas | Cambios |
|---------|-----------------|---------|
| ModalCrearLista.jsx | 2-3 | Import useAuth + usar user.id |
| ModalEditorProducto.jsx | 3-5 | Import useAuth + lógica publicado_por |

**Impacto:** Mínimo, no rompe funcionalidad existente
**Testing:** Requerido después de implementar
**Prioridad:** 🔴 Alta (necesario para auditoría)
