'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

// =====================================================
// CONSTANTES
// =====================================================

const ESTADOS_PAGO = {
  confirmado: { label: 'Confirmado', color: 'bg-green-100 text-green-800', icon: '✓' },
  pendiente_validacion: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  anulado: { label: 'Anulado', color: 'bg-red-100 text-red-800', icon: '✗' }
}

// =====================================================
// UTILIDADES
// =====================================================

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

const EstadoBadge = ({ estado }) => {
  const config = ESTADOS_PAGO[estado] || ESTADOS_PAGO.pendiente_validacion
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}

// =====================================================
// MODAL REGISTRAR PAGO
// =====================================================

const ModalRegistrarPago = ({ isOpen, onClose, pedido, onPagoRegistrado }) => {
  const [formData, setFormData] = useState({
    monto_cop: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    referencia: '',
    notas: '',
    estado: 'confirmado'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Estado para evidencia
  const [evidenciaFile, setEvidenciaFile] = useState(null)
  const [evidenciaPreview, setEvidenciaPreview] = useState(null)
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false)
  const inputFileRef = useRef(null)

  // Resetear formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setFormData({
        monto_cop: '',
        fecha_pago: new Date().toISOString().split('T')[0],
        referencia: '',
        notas: '',
        estado: 'confirmado'
      })
      setError(null)
      setEvidenciaFile(null)
      setEvidenciaPreview(null)
    }
  }, [isOpen])

  const saldoDisponible = pedido?.saldo_cop ?? pedido?.total_venta_cop ?? 0

  // Manejar selección de archivo
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar 10MB')
      return
    }

    setEvidenciaFile(file)
    
    // Crear preview si es imagen
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setEvidenciaPreview(e.target.result)
      reader.readAsDataURL(file)
    } else {
      setEvidenciaPreview(null)
    }
  }

  // Eliminar evidencia seleccionada
  const eliminarEvidencia = () => {
    setEvidenciaFile(null)
    setEvidenciaPreview(null)
    if (inputFileRef.current) {
      inputFileRef.current.value = ''
    }
  }

  // Subir evidencia a Supabase Storage
  const subirEvidencia = async () => {
    if (!evidenciaFile) return null

    setSubiendoEvidencia(true)
    try {
      const fileExt = evidenciaFile.name.split('.').pop()
      const fileName = `${pedido.id}/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('comprobantes-pago')
        .upload(fileName, evidenciaFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('comprobantes-pago')
        .getPublicUrl(fileName)

      return urlData.publicUrl
    } catch (err) {
      console.error('Error subiendo evidencia:', err)
      throw new Error('Error al subir la evidencia')
    } finally {
      setSubiendoEvidencia(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const monto = parseFloat(formData.monto_cop)

    // Validaciones
    if (!monto || monto <= 0) {
      setError('El monto debe ser mayor a 0')
      setLoading(false)
      return
    }

    if (monto > saldoDisponible) {
      setError(`El monto excede el saldo pendiente (${formatCurrency(saldoDisponible)})`)
      setLoading(false)
      return
    }

    try {
      // Subir evidencia si existe
      let comprobanteUrl = null
      if (evidenciaFile) {
        comprobanteUrl = await subirEvidencia()
      }

      const { data, error: insertError } = await supabase
        .from('pedido_pagos')
        .insert({
          pedido_id: pedido.id,
          cliente_id: pedido.cliente_id,
          monto_cop: monto,
          fecha_pago: formData.fecha_pago,
          metodo_pago: 'otro', // Valor por defecto ya que eliminamos la selección
          referencia: formData.referencia || null,
          comprobante_url: comprobanteUrl,
          notas: formData.notas || null,
          estado: formData.estado
        })
        .select()
        .single()

      if (insertError) throw insertError

      onPagoRegistrado(data)
      onClose()
    } catch (err) {
      console.error('Error registrando pago:', err)
      setError(err.message || 'Error al registrar el pago')
    } finally {
      setLoading(false)
    }
  }

  const pagarTodo = () => {
    setFormData(prev => ({
      ...prev,
      monto_cop: saldoDisponible.toString()
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header - Fijo */}
        <div className="p-6 border-b border-neutrals-grayBorder flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold text-neutrals-black">
              Registrar Pago
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutrals-grayBg rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-neutrals-graySoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Info del pedido */}
          <div className="mt-4 p-4 bg-neutrals-grayBg rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutrals-graySoft">Pedido</span>
              <span className="font-medium text-neutrals-black">{pedido.codigo_pedido}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutrals-graySoft">Total</span>
              <span className="font-medium text-neutrals-black">{formatCurrency(pedido.total_venta_cop)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutrals-graySoft">Abonado</span>
              <span className="font-medium text-green-600">{formatCurrency(pedido.total_abonado_cop || 0)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-neutrals-grayBorder">
              <span className="text-sm font-medium text-neutrals-black">Saldo pendiente</span>
              <span className="font-bold text-lg text-blue-elegant">{formatCurrency(saldoDisponible)}</span>
            </div>
          </div>
        </div>

        {/* Form - Scrolleable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-neutrals-black mb-2">
                Monto a abonar *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutrals-graySoft">$</span>
                <input
                  type="number"
                  value={formData.monto_cop}
                  onChange={(e) => setFormData({ ...formData, monto_cop: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-neutrals-grayBorder rounded-xl focus:ring-2 focus:ring-blue-elegant focus:border-transparent"
                  placeholder="0"
                  min="1"
                  max={saldoDisponible}
                  required
                />
              </div>
              {saldoDisponible > 0 && (
                <button
                  type="button"
                  onClick={pagarTodo}
                  className="mt-2 text-sm text-blue-elegant hover:underline"
                >
                  Pagar todo el saldo ({formatCurrency(saldoDisponible)})
                </button>
              )}
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-neutrals-black mb-2">
                Fecha del pago *
              </label>
              <input
                type="date"
                value={formData.fecha_pago}
                onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
                className="w-full px-4 py-3 border border-neutrals-grayBorder rounded-xl focus:ring-2 focus:ring-blue-elegant focus:border-transparent"
                required
              />
            </div>

            {/* Referencia */}
            <div>
              <label className="block text-sm font-medium text-neutrals-black mb-2">
                Referencia / Número de transacción
              </label>
              <input
                type="text"
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                className="w-full px-4 py-3 border border-neutrals-grayBorder rounded-xl focus:ring-2 focus:ring-blue-elegant focus:border-transparent"
                placeholder="Ej: Número de transferencia, recibo, etc."
              />
            </div>

            {/* Evidencia / Comprobante */}
            <div>
              <label className="block text-sm font-medium text-neutrals-black mb-2">
                Evidencia de pago (opcional)
              </label>
              
              {/* Preview de archivo seleccionado */}
              {evidenciaFile && (
                <div className="mb-3 p-3 bg-neutrals-grayBg rounded-xl">
                  <div className="flex items-center gap-3">
                    {evidenciaPreview ? (
                      <img 
                        src={evidenciaPreview} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutrals-black truncate">
                        {evidenciaFile.name}
                      </p>
                      <p className="text-xs text-neutrals-graySoft">
                        {(evidenciaFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={eliminarEvidencia}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Botón de carga */}
              {!evidenciaFile && (
                <>
                  <input
                    ref={inputFileRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="input-evidencia"
                  />
                  <label
                    htmlFor="input-evidencia"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-neutrals-grayBorder rounded-xl cursor-pointer hover:border-blue-elegant hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-6 h-6 text-neutrals-graySoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-neutrals-graySoft">
                      Subir foto o archivo
                    </span>
                  </label>
                  <p className="text-xs text-neutrals-graySoft text-center mt-2">
                    Formatos: JPG, PNG, PDF, DOC • Máx: 10MB
                  </p>
                </>
              )}
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-neutrals-black mb-2">
                Notas
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="w-full px-4 py-3 border border-neutrals-grayBorder rounded-xl focus:ring-2 focus:ring-blue-elegant focus:border-transparent resize-none"
                rows={2}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>

          {/* Footer con botones - Siempre visible */}
          <div className="p-6 border-t border-neutrals-grayBorder bg-white flex-shrink-0">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || subiendoEvidencia}
                className="flex-1 btn-primary"
              >
                {loading || subiendoEvidencia ? 'Guardando...' : 'Guardar Pago'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTE PRINCIPAL: GESTIÓN DE PAGOS
// =====================================================

export default function GestionPagos({ pedido, onPedidoActualizado }) {
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showConfirmAnular, setShowConfirmAnular] = useState(null)

  // Cargar pagos del pedido
  const cargarPagos = async () => {
    try {
      const { data, error } = await supabase
        .from('pedido_pagos')
        .select('*')
        .eq('pedido_id', pedido.id)
        .order('fecha_pago', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setPagos(data || [])
    } catch (err) {
      console.error('Error cargando pagos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pedido?.id) {
      cargarPagos()
    }
  }, [pedido?.id])

  // Recargar pedido después de un pago
  const recargarPedido = async () => {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedido.id)
      .single()
    
    if (data && onPedidoActualizado) {
      onPedidoActualizado(data)
    }
  }

  // Manejar pago registrado
  const handlePagoRegistrado = async () => {
    await cargarPagos()
    await recargarPedido()
  }

  // Anular pago
  const handleAnularPago = async (pagoId) => {
    try {
      const { error } = await supabase
        .from('pedido_pagos')
        .update({ estado: 'anulado' })
        .eq('id', pagoId)

      if (error) throw error

      setShowConfirmAnular(null)
      await handlePagoRegistrado()
    } catch (err) {
      console.error('Error anulando pago:', err)
    }
  }

  // Confirmar pago pendiente
  const handleConfirmarPago = async (pagoId) => {
    try {
      const { error } = await supabase
        .from('pedido_pagos')
        .update({ estado: 'confirmado' })
        .eq('id', pagoId)

      if (error) throw error
      await handlePagoRegistrado()
    } catch (err) {
      console.error('Error confirmando pago:', err)
    }
  }

  // Calcular valores - asegurar que sean números
  const totalVenta = parseFloat(pedido?.total_venta_cop) || 0
  const totalAbonado = parseFloat(pedido?.total_abonado_cop) || 0
  const saldoPendiente = parseFloat(pedido?.saldo_cop) || (totalVenta - totalAbonado)
  const porcentajePagado = totalVenta > 0 
    ? Math.round((totalAbonado / totalVenta) * 100) 
    : 0

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header con resumen */}
      <div className="p-6 border-b border-neutrals-grayBorder">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-neutrals-black flex items-center gap-2">
            <span>💳</span> Pagos y Saldos
          </h3>
        </div>

        {/* Botón Registrar Pago - Prominente */}
        {saldoPendiente > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full btn-primary mb-4 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Registrar Pago
          </button>
        )}

        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutrals-graySoft">Progreso de pago</span>
            <span className="font-medium text-neutrals-black">{porcentajePagado}%</span>
          </div>
          <div className="h-3 bg-neutrals-grayBg rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                porcentajePagado >= 100 ? 'bg-green-500' : 'bg-blue-elegant'
              }`}
              style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
            />
          </div>
        </div>

        {/* Resumen de valores */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-neutrals-grayBg rounded-xl">
            <div className="text-xs text-neutrals-graySoft mb-1">Total</div>
            <div className="font-bold text-neutrals-black">{formatCurrency(totalVenta)}</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <div className="text-xs text-green-600 mb-1">Abonado</div>
            <div className="font-bold text-green-700">{formatCurrency(totalAbonado)}</div>
          </div>
          <div className={`text-center p-3 rounded-xl ${saldoPendiente > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
            <div className={`text-xs mb-1 ${saldoPendiente > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              Saldo
            </div>
            <div className={`font-bold ${saldoPendiente > 0 ? 'text-amber-700' : 'text-green-700'}`}>
              {formatCurrency(saldoPendiente)}
            </div>
          </div>
        </div>

        {/* Estado de pago completo */}
        {saldoPendiente <= 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
            <span className="text-green-600 text-xl">✓</span>
            <span className="text-green-700 font-medium">Pedido pagado completamente</span>
          </div>
        )}

        {/* Info de período (si existe) */}
        {pedido?.periodo_venta && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-600">📅</span>
              <span className="text-blue-700">
                Período de venta: <strong>{pedido.periodo_venta}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lista de pagos */}
      <div className="p-6">
        <h4 className="font-medium text-neutrals-black mb-4">
          Historial de pagos ({pagos.length})
        </h4>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-elegant"></div>
          </div>
        ) : pagos.length === 0 ? (
          <div className="text-center py-8 text-neutrals-graySoft">
            <span className="text-4xl mb-2 block">💸</span>
            <p>No hay pagos registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pagos.map((pago) => (
              <div 
                key={pago.id}
                className={`p-4 rounded-xl border transition-all ${
                  pago.estado === 'anulado' 
                    ? 'bg-red-50/50 border-red-200 opacity-60' 
                    : pago.estado === 'pendiente_validacion'
                    ? 'bg-yellow-50/50 border-yellow-200'
                    : 'bg-neutrals-grayBg border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💵</span>
                    <div>
                      <div className="font-bold text-neutrals-black text-lg">
                        {formatCurrency(pago.monto_cop)}
                      </div>
                      <div className="text-sm text-neutrals-graySoft">
                        {formatDate(pago.fecha_pago)}
                      </div>
                      {pago.referencia && (
                        <div className="text-xs text-neutrals-graySoft mt-1">
                          Ref: {pago.referencia}
                        </div>
                      )}
                      {pago.notas && (
                        <div className="text-xs text-neutrals-graySoft mt-1 italic">
                          {pago.notas}
                        </div>
                      )}
                      {/* Enlace a comprobante si existe */}
                      {pago.comprobante_url && (
                        <a 
                          href={pago.comprobante_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-elegant hover:underline mt-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Ver evidencia
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <EstadoBadge estado={pago.estado} />
                    
                    {/* Acciones según estado */}
                    {pago.estado === 'pendiente_validacion' && (
                      <button
                        onClick={() => handleConfirmarPago(pago.id)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Confirmar pago"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    
                    {pago.estado !== 'anulado' && (
                      <button
                        onClick={() => setShowConfirmAnular(pago.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Anular pago"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirmación de anular */}
                {showConfirmAnular === pago.id && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 mb-3">
                      ¿Anular este pago? El saldo del pedido se ajustará automáticamente.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowConfirmAnular(null)}
                        className="px-3 py-1 text-sm border border-neutrals-grayBorder rounded-lg hover:bg-white"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleAnularPago(pago.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Sí, anular
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal registrar pago */}
      <ModalRegistrarPago
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        pedido={pedido}
        onPagoRegistrado={handlePagoRegistrado}
      />
    </div>
  )
}
