import { useState } from 'react'
import { CheckCircle, XCircle, Archive, Loader2 } from 'lucide-react'
import ModalConfirmacion from './ModalConfirmacion'
import { 
  publicarLista, 
  cerrarLista, 
  archivarLista,
  publicarProducto,
  ocultarProducto,
  getAccionesDisponiblesLista,
  getAccionesDisponiblesProducto
} from '../services/estadosService'

/**
 * Componente de Acciones de Lista
 * Muestra botones contextuales según el estado de la lista
 */
function AccionesLista({ lista, onActualizacion }) {
  const [modalActivo, setModalActivo] = useState(null)
  const [loading, setLoading] = useState(false)

  const acciones = getAccionesDisponiblesLista(lista.estado)

  if (acciones.length === 0) {
    return null
  }

  // Handlers para cada acción
  const handlePublicar = async () => {
    setLoading(true)
    try {
      const resultado = await publicarLista(lista.id)
      
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

  const handleCerrar = async () => {
    setLoading(true)
    try {
      const resultado = await cerrarLista(lista.id)
      
      if (resultado.success) {
        alert(`✓ ${resultado.mensaje}`)
        setModalActivo(null)
        if (onActualizacion) onActualizacion()
      } else {
        alert(`✗ Error: ${resultado.error}`)
      }
    } catch (error) {
      alert(`✗ Error al cerrar: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleArchivar = async () => {
    setLoading(true)
    try {
      const resultado = await archivarLista(lista.id)
      
      if (resultado.success) {
        alert(`✓ ${resultado.mensaje}`)
        setModalActivo(null)
        if (onActualizacion) onActualizacion()
      } else {
        alert(`✗ Error: ${resultado.error}`)
      }
    } catch (error) {
      alert(`✗ Error al archivar: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Configuración de modales
  const modalConfig = {
    publicar: {
      titulo: '¿Publicar lista?',
      mensaje: `Se publicará la lista "${lista.titulo}" y todos los productos listos para publicar se harán visibles en el catálogo público.`,
      textoConfirmar: 'Publicar Lista',
      tipo: 'info',
      onConfirm: handlePublicar
    },
    cerrar: {
      titulo: '¿Cerrar lista?',
      mensaje: `La lista "${lista.titulo}" seguirá visible pero no se podrán agregar ni modificar productos. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Cerrar Lista',
      tipo: 'warning',
      onConfirm: handleCerrar
    },
    archivar: {
      titulo: '¿Archivar lista?',
      mensaje: `La lista "${lista.titulo}" desaparecerá del catálogo público y no se podrán realizar más cambios. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Archivar Lista',
      tipo: 'danger',
      onConfirm: handleArchivar
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Botón Publicar */}
      {acciones.includes('publicar') && (
        <button
          onClick={() => setModalActivo('publicar')}
          className="btn btn-primary btn-md flex items-center gap-2"
          disabled={loading}
        >
          <CheckCircle className="w-4 h-4" />
          Publicar Lista
        </button>
      )}

      {/* Botón Cerrar */}
      {acciones.includes('cerrar') && (
        <button
          onClick={() => setModalActivo('cerrar')}
          className="btn btn-secondary btn-md flex items-center gap-2"
          disabled={loading}
        >
          <XCircle className="w-4 h-4" />
          Cerrar Lista
        </button>
      )}

      {/* Botón Archivar */}
      {acciones.includes('archivar') && (
        <button
          onClick={() => setModalActivo('archivar')}
          className="btn btn-outline btn-md flex items-center gap-2"
          disabled={loading}
        >
          <Archive className="w-4 h-4" />
          Archivar
        </button>
      )}

      {/* Loading indicator */}
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

export default AccionesLista
