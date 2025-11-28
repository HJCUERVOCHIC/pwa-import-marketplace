import { X, AlertTriangle } from 'lucide-react'

/**
 * Modal de Confirmación
 * Componente reutilizable para confirmar acciones críticas
 */
function ModalConfirmacion({ 
  isOpen, 
  onClose, 
  onConfirm, 
  titulo, 
  mensaje, 
  textoConfirmar = 'Confirmar',
  textoRechazar = 'Cancelar',
  tipo = 'warning', // 'warning' | 'danger' | 'info'
  loading = false
}) {
  if (!isOpen) return null

  const colorClasses = {
    warning: {
      icon: 'text-warning bg-yellow-100',
      button: 'btn-primary'
    },
    danger: {
      icon: 'text-danger bg-red-100',
      button: 'bg-danger text-white hover:bg-red-700'
    },
    info: {
      icon: 'text-info bg-blue-100',
      button: 'btn-primary'
    }
  }

  const colors = colorClasses[tipo] || colorClasses.warning

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-card rounded-lg shadow-lg max-w-md w-full p-6 transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-stone hover:text-neutral-charcoal transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className={`w-12 h-12 rounded-full ${colors.icon} flex items-center justify-center mb-4`}>
            <AlertTriangle className="w-6 h-6" />
          </div>

          {/* Content */}
          <div className="mb-6">
            <h3 className="text-xl font-display font-bold text-neutral-charcoal mb-2">
              {titulo}
            </h3>
            <p className="text-neutral-slate">
              {mensaje}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn btn-outline btn-md flex-1"
              disabled={loading}
            >
              {textoRechazar}
            </button>
            <button
              onClick={onConfirm}
              className={`btn ${colors.button} btn-md flex-1`}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Procesando...</span>
                </div>
              ) : (
                textoConfirmar
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalConfirmacion
