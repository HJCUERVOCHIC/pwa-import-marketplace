import { useState } from 'react'
import { Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react'
import ModalConfirmacion from './ModalConfirmacion'
import {
  marcarListoParaPublicar,
  publicarProducto,
  ocultarProducto,
  getAccionesDisponiblesProducto
} from '../services/estadosService'

/**
 * Componente de Acciones de Producto
 * Muestra botones contextuales según el estado del producto y su lista
 */
function AccionesProducto({ producto, estadoLista, onActualizacion, variante = 'normal' }) {
  const [modalActivo, setModalActivo] = useState(null)
  const [loading, setLoading] = useState(false)

  const acciones = getAccionesDisponiblesProducto(producto.estado, estadoLista)

  if (acciones.length === 0) {
    return null
  }

  // Handlers para cada acción
  const handleMarcarListo = async () => {
    setLoading(true)
    try {
      const resultado = await marcarListoParaPublicar(producto.id)
      
      if (resultado.success) {
        alert(`✓ ${resultado.mensaje}`)
        setModalActivo(null)
        if (onActualizacion) onActualizacion()
      } else {
        alert(`✗ Error: ${resultado.error}`)
      }
    } catch (error) {
      alert(`✗ Error al marcar producto: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePublicar = async () => {
    setLoading(true)
    try {
      const resultado = await publicarProducto(producto.id)
      
      if (resultado.success) {
        alert(`✓ ${resultado.mensaje}`)
        setModalActivo(null)
        if (onActualizacion) onActualizacion()
      } else {
        alert(`✗ Error: ${resultado.error}`)
      }
    } catch (error) {
      alert(`✗ Error al publicar: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleOcultar = async () => {
    setLoading(true)
    try {
      const resultado = await ocultarProducto(producto.id)
      
      if (resultado.success) {
        alert(`✓ ${resultado.mensaje}`)
        setModalActivo(null)
        if (onActualizacion) onActualizacion()
      } else {
        alert(`✗ Error: ${resultado.error}`)
      }
    } catch (error) {
      alert(`✗ Error al ocultar: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Configuración de modales
  const modalConfig = {
    marcar_listo: {
      titulo: '¿Marcar como listo?',
      mensaje: `El producto "${producto.titulo}" quedará listo para ser publicado junto con la lista.`,
      textoConfirmar: 'Marcar como Listo',
      tipo: 'info',
      onConfirm: handleMarcarListo
    },
    publicar: {
      titulo: '¿Publicar producto?',
      mensaje: `El producto "${producto.titulo}" se hará visible en el catálogo público.`,
      textoConfirmar: 'Publicar Producto',
      tipo: 'info',
      onConfirm: handlePublicar
    },
    ocultar: {
      titulo: '¿Ocultar producto?',
      mensaje: `El producto "${producto.titulo}" dejará de ser visible en el catálogo público. Podrás volver a publicarlo después.`,
      textoConfirmar: 'Ocultar Producto',
      tipo: 'warning',
      onConfirm: handleOcultar
    }
  }

  // Variante compacta (para usar dentro de cards)
  if (variante === 'compacto') {
    return (
      <div className="flex items-center gap-2">
        {acciones.includes('marcar_listo') && (
          <button
            onClick={() => setModalActivo('marcar_listo')}
            className="btn btn-secondary btn-sm flex items-center gap-1"
            disabled={loading}
          >
            <CheckCircle className="w-3 h-3" />
            Marcar Listo
          </button>
        )}

        {acciones.includes('publicar') && (
          <button
            onClick={() => setModalActivo('publicar')}
            className="btn btn-primary btn-sm flex items-center gap-1"
            disabled={loading}
          >
            <Eye className="w-3 h-3" />
            Publicar
          </button>
        )}

        {acciones.includes('ocultar') && (
          <button
            onClick={() => setModalActivo('ocultar')}
            className="btn btn-outline btn-sm flex items-center gap-1"
            disabled={loading}
          >
            <EyeOff className="w-3 h-3" />
            Ocultar
          </button>
        )}

        {loading && (
          <Loader2 className="w-4 h-4 text-gold-600 animate-spin" />
        )}

        {/* Modales */}
        {modalActivo && (
          <ModalConfirmacion
            isOpen={true}
            onClose={() => setModalActivo(null)}
            {...modalConfig[modalActivo]}
            loading={loading}
          />
        )}
      </div>
    )
  }

  // Variante normal (botones grandes)
  return (
    <div className="flex items-center gap-3">
      {acciones.includes('marcar_listo') && (
        <button
          onClick={() => setModalActivo('marcar_listo')}
          className="btn btn-secondary btn-md flex items-center gap-2"
          disabled={loading}
        >
          <CheckCircle className="w-4 h-4" />
          Marcar como Listo
        </button>
      )}

      {acciones.includes('publicar') && (
        <button
          onClick={() => setModalActivo('publicar')}
          className="btn btn-primary btn-md flex items-center gap-2"
          disabled={loading}
        >
          <Eye className="w-4 h-4" />
          Publicar Producto
        </button>
      )}

      {acciones.includes('ocultar') && (
        <button
          onClick={() => setModalActivo('ocultar')}
          className="btn btn-outline btn-md flex items-center gap-2"
          disabled={loading}
        >
          <EyeOff className="w-4 h-4" />
          Ocultar Producto
        </button>
      )}

      {loading && (
        <Loader2 className="w-5 h-5 text-gold-600 animate-spin" />
      )}

      {/* Modales de confirmación */}
      {modalActivo && (
        <ModalConfirmacion
          isOpen={true}
          onClose={() => setModalActivo(null)}
          {...modalConfig[modalActivo]}
          loading={loading}
        />
      )}
    </div>
  )
}

export default AccionesProducto
