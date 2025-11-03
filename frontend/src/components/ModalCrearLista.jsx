import { useState } from 'react'
import { X, DollarSign, Percent } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../features/auth/context/AuthContext' // ✅ CAMBIO 1: Import agregado

function ModalCrearLista({ isOpen, onClose, onListaCreada }) {
  const { user } = useAuth() // ✅ CAMBIO 2: Hook agregado
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_oferta: new Date().toISOString().split('T')[0],
    trm_lista: '',
    tax_modo_lista: 'porcentaje',
    tax_porcentaje_lista: '7',
    tax_usd_lista: ''
  })
  const [errors, setErrors] = useState({})

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const validarFormulario = () => {
    const newErrors = {}

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio'
    } else if (formData.titulo.trim().length < 3) {
      newErrors.titulo = 'El título debe tener al menos 3 caracteres'
    }

    if (!formData.trm_lista || parseFloat(formData.trm_lista) <= 0) {
      newErrors.trm_lista = 'La TRM debe ser un valor positivo'
    }

    if (formData.tax_modo_lista === 'porcentaje') {
      if (!formData.tax_porcentaje_lista || parseFloat(formData.tax_porcentaje_lista) < 0) {
        newErrors.tax_porcentaje_lista = 'El porcentaje de TAX debe ser un valor válido'
      }
    } else {
      if (!formData.tax_usd_lista || parseFloat(formData.tax_usd_lista) < 0) {
        newErrors.tax_usd_lista = 'El valor de TAX en USD debe ser válido'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validarFormulario()) {
      return
    }

    // Validación de seguridad: verificar que haya usuario
    if (!user?.id) {
      alert('Error: No hay sesión activa. Por favor, vuelve a iniciar sesión.')
      return
    }

    setLoading(true)

    try {
      const dataToInsert = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim() || null,
        fecha_oferta: formData.fecha_oferta,
        trm_lista: parseFloat(formData.trm_lista),
        tax_modo_lista: formData.tax_modo_lista,
        tax_porcentaje_lista: formData.tax_modo_lista === 'porcentaje' 
          ? parseFloat(formData.tax_porcentaje_lista) 
          : null,
        tax_usd_lista: formData.tax_modo_lista === 'valor_fijo_usd' 
          ? parseFloat(formData.tax_usd_lista) 
          : null,
        estado: 'borrador',
        creado_por: user.id // ✅ CAMBIO 3: Campo de auditoría agregado
      }

      const { data, error } = await supabase
        .from('listas_oferta')
        .insert([dataToInsert])
        .select()
        .single()

      if (error) throw error

      // Llamar callback para notificar que se creó la lista
      if (onListaCreada) {
        onListaCreada(data)
      }

      // Cerrar modal
      onClose()

      // Resetear formulario
      setFormData({
        titulo: '',
        descripcion: '',
        fecha_oferta: new Date().toISOString().split('T')[0],
        trm_lista: '',
        tax_modo_lista: 'porcentaje',
        tax_porcentaje_lista: '7',
        tax_usd_lista: ''
      })

      alert('Lista creada exitosamente')
    } catch (error) {
      console.error('Error creando lista:', error)
      alert('Error al crear la lista: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Nueva Lista de Oferta</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Información Básica</h4>
            
            {/* Título */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className={`input-field ${errors.titulo ? 'border-red-500' : ''}`}
                placeholder="Ej: Ofertas Black Friday 2025"
                disabled={loading}
              />
              {errors.titulo && (
                <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>
              )}
            </div>

            {/* Descripción */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="input-field"
                rows="3"
                placeholder="Descripción opcional de la lista de oferta"
                disabled={loading}
              />
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Oferta <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="fecha_oferta"
                value={formData.fecha_oferta}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          {/* Parámetros Económicos */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Parámetros Económicos</h4>
            
            {/* TRM */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TRM (Tasa de Cambio) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  name="trm_lista"
                  value={formData.trm_lista}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.trm_lista ? 'border-red-500' : ''}`}
                  placeholder="Ej: 4250.00"
                  step="0.01"
                  min="0"
                  disabled={loading}
                />
              </div>
              {errors.trm_lista && (
                <p className="text-red-500 text-sm mt-1">{errors.trm_lista}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Tasa de cambio USD a COP que se aplicará a todos los productos
              </p>
            </div>

            {/* Modo TAX */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modo de Cálculo de TAX <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tax_modo_lista: 'porcentaje' }))}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.tax_modo_lista === 'porcentaje'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <Percent className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                  <div className="font-medium">Porcentaje</div>
                  <div className="text-xs text-gray-500">% sobre precio base</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tax_modo_lista: 'valor_fijo_usd' }))}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.tax_modo_lista === 'valor_fijo_usd'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                  <div className="font-medium">Valor Fijo</div>
                  <div className="text-xs text-gray-500">Monto fijo en USD</div>
                </button>
              </div>
            </div>

            {/* TAX Porcentaje o Valor Fijo */}
            {formData.tax_modo_lista === 'porcentaje' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de TAX <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="tax_porcentaje_lista"
                    value={formData.tax_porcentaje_lista}
                    onChange={handleChange}
                    className={`input-field pl-10 ${errors.tax_porcentaje_lista ? 'border-red-500' : ''}`}
                    placeholder="Ej: 7"
                    step="0.01"
                    min="0"
                    disabled={loading}
                  />
                </div>
                {errors.tax_porcentaje_lista && (
                  <p className="text-red-500 text-sm mt-1">{errors.tax_porcentaje_lista}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  Se aplicará este porcentaje sobre el precio base de cada producto
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor de TAX en USD <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="tax_usd_lista"
                    value={formData.tax_usd_lista}
                    onChange={handleChange}
                    className={`input-field pl-10 ${errors.tax_usd_lista ? 'border-red-500' : ''}`}
                    placeholder="Ej: 50.00"
                    step="0.01"
                    min="0"
                    disabled={loading}
                  />
                </div>
                {errors.tax_usd_lista && (
                  <p className="text-red-500 text-sm mt-1">{errors.tax_usd_lista}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  Se sumará este valor fijo a cada producto
                </p>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
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

export default ModalCrearLista