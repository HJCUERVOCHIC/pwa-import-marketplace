'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const ESTADOS_LISTA = {
  borrador: { label: 'Borrador', color: 'bg-yellow-100 text-yellow-800' },
  publicada: { label: 'Publicada', color: 'bg-green-100 text-green-800' },
  cerrada: { label: 'Cerrada', color: 'bg-gray-100 text-gray-800' },
  archivada: { label: 'Archivada', color: 'bg-red-100 text-red-800' }
}

export default function ListasPage() {
  const router = useRouter()
  const [listas, setListas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
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

  useEffect(() => {
    checkAuth()
    cargarListas()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
    }
  }

  const cargarListas = async () => {
    try {
      const { data, error } = await supabase
        .from('listas_oferta')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setListas(data || [])
    } catch (error) {
      console.error('Error cargando listas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validarFormulario = () => {
    const newErrors = {}

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El titulo es obligatorio'
    } else if (formData.titulo.trim().length < 3) {
      newErrors.titulo = 'El titulo debe tener al menos 3 caracteres'
    }

    if (!formData.trm_lista || parseFloat(formData.trm_lista) <= 0) {
      newErrors.trm_lista = 'La TRM debe ser un valor positivo'
    }

    if (formData.tax_modo_lista === 'porcentaje') {
      if (!formData.tax_porcentaje_lista || parseFloat(formData.tax_porcentaje_lista) < 0) {
        newErrors.tax_porcentaje_lista = 'El porcentaje de TAX debe ser valido'
      }
    } else {
      if (!formData.tax_usd_lista || parseFloat(formData.tax_usd_lista) < 0) {
        newErrors.tax_usd_lista = 'El valor de TAX en USD debe ser valido'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


const handleSubmit = async (e) => {
  e.preventDefault()
  if (!validarFormulario()) return

  setActionLoading(true)
  try {
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('Error: No hay sesión activa. Por favor, vuelve a iniciar sesión.')
      return
    }

    const dataToInsert = {
      titulo: formData.titulo.trim(),
      descripcion: formData.descripcion.trim() || null,
      fecha_oferta: formData.fecha_oferta,
      trm_lista: parseFloat(formData.trm_lista),
      tax_modo_lista: formData.tax_modo_lista,
      tax_porcentaje_lista: formData.tax_modo_lista === 'porcentaje' 
        ? parseFloat(formData.tax_porcentaje_lista) : null,
      tax_usd_lista: formData.tax_modo_lista === 'valor_fijo_usd' 
        ? parseFloat(formData.tax_usd_lista) : null,
      estado: 'borrador',
      creado_por: user.id
    }

    const { data, error } = await supabase
      .from('listas_oferta')
      .insert([dataToInsert])
      .select()
      .single()

    if (error) throw error

    setListas(prev => [data, ...prev])
    setShowModal(false)
    resetForm()
    alert('Lista creada exitosamente')
  } catch (error) {
    console.error('Error creando lista:', error)
    alert('Error al crear la lista: ' + error.message)
  } finally {
    setActionLoading(false)
  }
}

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      fecha_oferta: new Date().toISOString().split('T')[0],
      trm_lista: '',
      tax_modo_lista: 'porcentaje',
      tax_porcentaje_lista: '7',
      tax_usd_lista: ''
    })
    setErrors({})
  }

  // Acciones de Lista
  const getAccionesDisponibles = (estado) => {
    const acciones = {
      borrador: ['publicar', 'archivar'],
      publicada: ['cerrar', 'archivar'],
      cerrada: ['archivar'],
      archivada: []
    }
    return acciones[estado] || []
  }

  const handlePublicarLista = async (lista) => {
    // Validar que tenga productos listos
    const { count, error: countError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true })
      .eq('id_lista', lista.id)
      .eq('estado', 'listo_para_publicar')

    if (countError) {
      alert('Error validando productos')
      return
    }

    if (count === 0) {
      alert('La lista debe tener al menos 1 producto listo para publicar')
      return
    }

    if (!confirm(`¿Publicar la lista "${lista.titulo}" con ${count} producto(s)?`)) return

    setActionLoading(true)
    try {
      // Actualizar lista
      const { error: listaError } = await supabase
        .from('listas_oferta')
        .update({ estado: 'publicada', updated_at: new Date().toISOString() })
        .eq('id', lista.id)

      if (listaError) throw listaError

      // Publicar productos listos
      const { error: productosError } = await supabase
        .from('productos')
        .update({ estado: 'publicado', updated_at: new Date().toISOString() })
        .eq('id_lista', lista.id)
        .eq('estado', 'listo_para_publicar')

      if (productosError) throw productosError

      alert(`Lista publicada con ${count} producto(s)`)
      cargarListas()
    } catch (error) {
      alert('Error al publicar: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCerrarLista = async (lista) => {
    if (!confirm(`¿Cerrar la lista "${lista.titulo}"? No se podran agregar mas productos.`)) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('listas_oferta')
        .update({ estado: 'cerrada', updated_at: new Date().toISOString() })
        .eq('id', lista.id)

      if (error) throw error
      alert('Lista cerrada exitosamente')
      cargarListas()
    } catch (error) {
      alert('Error al cerrar: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleArchivarLista = async (lista) => {
    if (!confirm(`¿Archivar la lista "${lista.titulo}"? Desaparecera del catalogo publico.`)) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('listas_oferta')
        .update({ estado: 'archivada', updated_at: new Date().toISOString() })
        .eq('id', lista.id)

      if (error) throw error
      alert('Lista archivada exitosamente')
      cargarListas()
    } catch (error) {
      alert('Error al archivar: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                ← Volver
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Listas de Oferta</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                + Nueva Lista
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {listas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">No hay listas de oferta</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Crear Primera Lista
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listas.map((lista) => {
              const acciones = getAccionesDisponibles(lista.estado)
              const estadoInfo = ESTADOS_LISTA[lista.estado] || ESTADOS_LISTA.borrador

              return (
                <div key={lista.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
                        {lista.titulo}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}>
                        {estadoInfo.label}
                      </span>
                    </div>

                    {lista.descripcion && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{lista.descripcion}</p>
                    )}

                    <div className="space-y-2 text-sm text-gray-600 border-t pt-4">
                      <div className="flex justify-between">
                        <span>Fecha:</span>
                        <span className="font-medium">
                          {new Date(lista.fecha_oferta).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>TRM:</span>
                        <span className="font-medium">${lista.trm_lista?.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TAX:</span>
                        <span className="font-medium">
                          {lista.tax_modo_lista === 'porcentaje'
                            ? `${lista.tax_porcentaje_lista}%`
                            : `$${lista.tax_usd_lista} USD`}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <Link
                        href={`/admin/listas/${lista.id}/productos`}
                        className="block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                      >
                        Ver Productos
                      </Link>

                      <div className="flex gap-2">
                        {acciones.includes('publicar') && (
                          <button
                            onClick={() => handlePublicarLista(lista)}
                            disabled={actionLoading}
                            className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            Publicar
                          </button>
                        )}
                        {acciones.includes('cerrar') && (
                          <button
                            onClick={() => handleCerrarLista(lista)}
                            disabled={actionLoading}
                            className="flex-1 bg-yellow-600 text-white px-3 py-1.5 rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                          >
                            Cerrar
                          </button>
                        )}
                        {acciones.includes('archivar') && (
                          <button
                            onClick={() => handleArchivarLista(lista)}
                            disabled={actionLoading}
                            className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            Archivar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal Crear Lista */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Nueva Lista de Oferta</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Informacion Basica */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Informacion Basica</h4>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titulo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors.titulo ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Ej: Ofertas Black Friday 2025"
                  />
                  {errors.titulo && <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="3"
                    placeholder="Descripcion opcional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Oferta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fecha_oferta"
                    value={formData.fecha_oferta}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Parametros Economicos */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Parametros Economicos</h4>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TRM (Tasa de Cambio) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="trm_lista"
                    value={formData.trm_lista}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors.trm_lista ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Ej: 4250.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.trm_lista && <p className="text-red-500 text-sm mt-1">{errors.trm_lista}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modo de Calculo de TAX <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tax_modo_lista: 'porcentaje' }))}
                      className={`p-4 border-2 rounded-lg ${formData.tax_modo_lista === 'porcentaje' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <div className="font-medium">Porcentaje</div>
                      <div className="text-xs text-gray-500">% sobre precio base</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tax_modo_lista: 'valor_fijo_usd' }))}
                      className={`p-4 border-2 rounded-lg ${formData.tax_modo_lista === 'valor_fijo_usd' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <div className="font-medium">Valor Fijo</div>
                      <div className="text-xs text-gray-500">Monto fijo en USD</div>
                    </button>
                  </div>
                </div>

                {formData.tax_modo_lista === 'porcentaje' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Porcentaje de TAX <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="tax_porcentaje_lista"
                      value={formData.tax_porcentaje_lista}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md ${errors.tax_porcentaje_lista ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Ej: 7"
                      step="0.01"
                      min="0"
                    />
                    {errors.tax_porcentaje_lista && <p className="text-red-500 text-sm mt-1">{errors.tax_porcentaje_lista}</p>}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor de TAX en USD <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="tax_usd_lista"
                      value={formData.tax_usd_lista}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md ${errors.tax_usd_lista ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Ej: 50.00"
                      step="0.01"
                      min="0"
                    />
                    {errors.tax_usd_lista && <p className="text-red-500 text-sm mt-1">{errors.tax_usd_lista}</p>}
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Creando...' : 'Crear Lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}