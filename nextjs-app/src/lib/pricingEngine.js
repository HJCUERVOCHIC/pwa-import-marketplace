/**
 * MOTOR UNIFICADO DE CÁLCULO DE PRECIOS (Pricing Engine)
 * Proyecto: Chic Import USA (Next.js + Supabase)
 * Versión: 1.0
 * 
 * IMPORTANTE: Este módulo es la ÚNICA fuente de verdad para cálculos de precios.
 * NO crear cálculos duplicados en componentes, páginas o hooks.
 * SIEMPRE usar calculatePricing() para cualquier cálculo de precio/costo/ganancia.
 * 
 * Ubicación recomendada: src/lib/pricingEngine.js
 */

/**
 * @typedef {Object} PricingInput
 * @property {number} trm - Tasa Representativa del Mercado (debe ser > 0)
 * @property {number} tax_pct - Porcentaje de impuesto como decimal (ej: 0.10 = 10%)
 * @property {number} precio_base_usd - Precio base del producto en USD
 * @property {number} margen_pct - Margen de ganancia como decimal (ej: 0.25 = 25%, 1.00 = 100%)
 * @property {number} descuento_pct - Descuento como decimal (ej: 0.10 = 10%, debe estar entre 0 y 1)
 * @property {number|null} [precio_final_manual_cop] - Precio final manual en COP (opcional)
 */

/**
 * @typedef {Object} PricingOutput
 * @property {boolean} valid - Indica si el cálculo fue exitoso
 * @property {string|null} error - Mensaje de error si valid es false
 * @property {number} precio_con_tax_usd - Precio con impuesto en USD
 * @property {number} costo_total_usd - Costo total en USD (con descuento aplicado)
 * @property {number} costo_total_cop - Costo total en COP
 * @property {number} precio_sugerido_cop - Precio sugerido en COP (costo + margen)
 * @property {number} precio_final_cop - Precio final de venta en COP
 * @property {number} ganancia_cop - Ganancia estimada en COP
 * @property {number} valor_producto_cop - Valor del producto sin descuento (para mostrar tachado)
 * @property {number} descuento_cop - Valor del descuento en COP
 * @property {number|null} descuento_cop_vs_final - Descuento vs precio final manual (si aplica)
 * @property {boolean} tiene_precio_manual - Indica si se usó precio final manual
 * @property {boolean} tiene_descuento - Indica si hay descuento aplicado
 */

/**
 * Valida los inputs del motor de precios
 * @param {PricingInput} input 
 * @returns {{valid: boolean, error: string|null}}
 */
function validateInput(input) {
  const { trm, tax_pct, precio_base_usd, margen_pct, descuento_pct, precio_final_manual_cop } = input

  // Validar que los campos requeridos existan y sean numéricos
  if (trm === undefined || trm === null || typeof trm !== 'number' || isNaN(trm)) {
    return { valid: false, error: 'TRM es requerido y debe ser un número válido' }
  }
  if (precio_base_usd === undefined || precio_base_usd === null || typeof precio_base_usd !== 'number' || isNaN(precio_base_usd)) {
    return { valid: false, error: 'precio_base_usd es requerido y debe ser un número válido' }
  }
  if (tax_pct === undefined || tax_pct === null || typeof tax_pct !== 'number' || isNaN(tax_pct)) {
    return { valid: false, error: 'tax_pct es requerido y debe ser un número válido' }
  }
  if (margen_pct === undefined || margen_pct === null || typeof margen_pct !== 'number' || isNaN(margen_pct)) {
    return { valid: false, error: 'margen_pct es requerido y debe ser un número válido' }
  }
  if (descuento_pct === undefined || descuento_pct === null || typeof descuento_pct !== 'number' || isNaN(descuento_pct)) {
    return { valid: false, error: 'descuento_pct es requerido y debe ser un número válido' }
  }

  // Validar rangos
  if (trm <= 0) {
    return { valid: false, error: 'TRM debe ser mayor a 0' }
  }
  if (precio_base_usd < 0) {
    return { valid: false, error: 'precio_base_usd debe ser mayor o igual a 0' }
  }
  if (tax_pct < 0) {
    return { valid: false, error: 'tax_pct debe ser mayor o igual a 0' }
  }
  if (margen_pct < 0) {
    return { valid: false, error: 'margen_pct debe ser mayor o igual a 0' }
  }
  if (descuento_pct < 0 || descuento_pct > 1) {
    return { valid: false, error: 'descuento_pct debe estar entre 0 y 1' }
  }
  if (precio_final_manual_cop !== undefined && precio_final_manual_cop !== null) {
    if (typeof precio_final_manual_cop !== 'number' || isNaN(precio_final_manual_cop)) {
      return { valid: false, error: 'precio_final_manual_cop debe ser un número válido' }
    }
    if (precio_final_manual_cop < 0) {
      return { valid: false, error: 'precio_final_manual_cop debe ser mayor o igual a 0' }
    }
  }

  return { valid: true, error: null }
}

/**
 * Redondea un valor en USD a 2 decimales
 * @param {number} value 
 * @returns {number}
 */
function roundUSD(value) {
  return Math.round(value * 100) / 100
}

/**
 * Redondea un valor en COP a entero
 * @param {number} value 
 * @returns {number}
 */
function roundCOP(value) {
  return Math.round(value)
}

/**
 * FUNCIÓN PRINCIPAL DEL MOTOR DE PRECIOS
 * 
 * Calcula todos los valores de precio, costo, descuento y ganancia
 * según las fórmulas oficiales del Excel "Calculo de precios.xlsx"
 * 
 * @param {PricingInput} input - Inputs del cálculo
 * @returns {PricingOutput} - Resultados del cálculo
 * 
 * @example
 * // Ejemplo de uso básico
 * const resultado = calculatePricing({
 *   trm: 4000,
 *   tax_pct: 0.10,
 *   precio_base_usd: 100,
 *   margen_pct: 1.00,
 *   descuento_pct: 0.50
 * })
 * 
 * // Resultado esperado:
 * // precio_con_tax_usd: 110
 * // costo_total_usd: 55
 * // costo_total_cop: 220000
 * // precio_sugerido_cop: 440000
 * // precio_final_cop: 440000
 * // ganancia_cop: 220000
 * // valor_producto_cop: 880000
 * // descuento_cop: 440000
 */
export function calculatePricing(input) {
  // Validar inputs
  const validation = validateInput(input)
  if (!validation.valid) {
    return {
      valid: false,
      error: validation.error,
      precio_con_tax_usd: 0,
      costo_total_usd: 0,
      costo_total_cop: 0,
      precio_sugerido_cop: 0,
      precio_final_cop: 0,
      ganancia_cop: 0,
      valor_producto_cop: 0,
      descuento_cop: 0,
      descuento_cop_vs_final: null,
      tiene_precio_manual: false,
      tiene_descuento: false
    }
  }

  const { trm, tax_pct, precio_base_usd, margen_pct, descuento_pct, precio_final_manual_cop } = input

  // ========================================
  // FÓRMULAS OFICIALES (NO MODIFICAR)
  // Fuente: Excel "Calculo de precios.xlsx"
  // ========================================

  // 3.1 Cálculo de costo total USD
  // Paso 1: Precio con impuesto en USD
  // precio_con_tax_usd = precio_base_usd * (1 + tax_pct)
  const precio_con_tax_usd = roundUSD(precio_base_usd * (1 + tax_pct))

  // Paso 2: Costo total USD con descuento aplicado
  // costo_total_usd = precio_con_tax_usd * (1 - descuento_pct)
  const costo_total_usd = roundUSD(precio_con_tax_usd * (1 - descuento_pct))

  // 3.2 Cálculo de costo total COP
  // costo_total_cop = costo_total_usd * trm
  const costo_total_cop = roundCOP(costo_total_usd * trm)

  // 3.3 Cálculo de precio sugerido COP
  // precio_sugerido_cop = costo_total_cop * (1 + margen_pct)
  const precio_sugerido_cop = roundCOP(costo_total_cop * (1 + margen_pct))

  // 3.4 Precio final COP
  // Por defecto: precio_final_cop = precio_sugerido_cop
  // Si existe precio_final_manual_cop: precio_final_cop = precio_final_manual_cop
  const tiene_precio_manual = precio_final_manual_cop !== undefined && 
                               precio_final_manual_cop !== null && 
                               precio_final_manual_cop > 0
  const precio_final_cop = tiene_precio_manual 
    ? roundCOP(precio_final_manual_cop) 
    : precio_sugerido_cop

  // 3.5 Ganancia COP
  // ganancia_cop = precio_final_cop - costo_total_cop
  const ganancia_cop = roundCOP(precio_final_cop - costo_total_cop)

  // ========================================
  // CÁLCULOS PARA VISUALIZACIÓN (UI)
  // ========================================

  // 4.1 Valor del producto (sin descuento aplicado)
  // valor_producto_cop = precio_con_tax_usd * (1 + margen_pct) * trm
  // Es el "valor completo" del producto con impuesto y margen, SIN aplicar descuento
  const valor_producto_cop = roundCOP(precio_con_tax_usd * (1 + margen_pct) * trm)

  // 4.2 Descuento en COP
  // descuento_cop = valor_producto_cop - precio_sugerido_cop
  const descuento_cop = roundCOP(valor_producto_cop - precio_sugerido_cop)

  // Descuento vs precio final (si hay precio manual)
  // descuento_cop_vs_final = valor_producto_cop - precio_final_cop
  const descuento_cop_vs_final = tiene_precio_manual 
    ? roundCOP(valor_producto_cop - precio_final_cop) 
    : null

  // Flag para indicar si hay descuento
  const tiene_descuento = descuento_pct > 0

  return {
    valid: true,
    error: null,
    
    // Valores principales (para guardar en BD)
    precio_con_tax_usd,
    costo_total_usd,
    costo_total_cop,
    precio_sugerido_cop,
    precio_final_cop,
    ganancia_cop,
    
    // Valores para visualización (UI)
    valor_producto_cop,
    descuento_cop,
    descuento_cop_vs_final,
    
    // Flags útiles
    tiene_precio_manual,
    tiene_descuento
  }
}

/**
 * Convierte un porcentaje de la lista (tax_porcentaje_lista) a decimal
 * Ejemplo: 10 -> 0.10
 * @param {number} porcentaje - Porcentaje como número entero (ej: 10, 25)
 * @returns {number} - Porcentaje como decimal (ej: 0.10, 0.25)
 */
export function porcentajeADecimal(porcentaje) {
  if (porcentaje === null || porcentaje === undefined) return 0
  return porcentaje / 100
}

/**
 * Calcula el tax_pct basado en el modo de tax de la lista
 * @param {Object} lista - Objeto de la lista con tax_modo_lista, tax_porcentaje_lista, tax_usd_lista
 * @param {number} precio_base_usd - Precio base del producto
 * @returns {number} - Tax como decimal para usar en calculatePricing
 */
export function calcularTaxPct(lista, precio_base_usd) {
  if (!lista || !precio_base_usd || precio_base_usd <= 0) return 0
  
  if (lista.tax_modo_lista === 'porcentaje') {
    // Tax como porcentaje directo
    return porcentajeADecimal(lista.tax_porcentaje_lista)
  } else if (lista.tax_modo_lista === 'valor_fijo_usd') {
    // Tax fijo en USD - convertir a porcentaje equivalente
    // tax_usd = precio_base * tax_pct => tax_pct = tax_usd / precio_base
    const taxUSD = lista.tax_usd_lista || 0
    return taxUSD / precio_base_usd
  }
  
  return 0
}

/**
 * Helper para crear el input del motor desde datos de lista y formulario
 * @param {Object} params
 * @param {Object} params.lista - Objeto de la lista (trm_lista, tax_modo_lista, etc.)
 * @param {number} params.precio_base_usd - Precio base del producto
 * @param {number} params.margen_porcentaje - Margen como porcentaje (ej: 25 para 25%)
 * @param {number} params.descuento_porcentaje - Descuento como porcentaje (ej: 10 para 10%)
 * @param {number|null} [params.precio_final_manual_cop] - Precio final manual (opcional)
 * @returns {PricingInput}
 */
export function crearPricingInput({ lista, precio_base_usd, margen_porcentaje, descuento_porcentaje, precio_final_manual_cop = null }) {
  return {
    trm: lista?.trm_lista || 0,
    tax_pct: calcularTaxPct(lista, precio_base_usd),
    precio_base_usd: precio_base_usd || 0,
    margen_pct: porcentajeADecimal(margen_porcentaje),
    descuento_pct: porcentajeADecimal(descuento_porcentaje),
    precio_final_manual_cop
  }
}

/**
 * Formatea un valor en COP para mostrar en UI
 * @param {number} valor - Valor en COP
 * @returns {string} - Valor formateado (ej: "$1.234.567")
 */
export function formatearCOP(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return '$0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor)
}

/**
 * Formatea un valor en USD para mostrar en UI
 * @param {number} valor - Valor en USD
 * @returns {string} - Valor formateado (ej: "$123.45")
 */
export function formatearUSD(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor)
}

// ========================================
// TESTS DE VALIDACIÓN
// ========================================

/**
 * Ejecuta el test de validación con el ejemplo oficial del documento
 * @returns {boolean} - true si el test pasa, false si falla
 */
export function runValidationTest() {
  const testInput = {
    trm: 4000,
    tax_pct: 0.10,
    precio_base_usd: 100,
    margen_pct: 1.00,
    descuento_pct: 0.50
  }

  const expected = {
    precio_con_tax_usd: 110,
    costo_total_usd: 55,
    costo_total_cop: 220000,
    precio_sugerido_cop: 440000,
    precio_final_cop: 440000,
    ganancia_cop: 220000,
    valor_producto_cop: 880000,
    descuento_cop: 440000
  }

  const result = calculatePricing(testInput)

  const tests = [
    { field: 'precio_con_tax_usd', expected: expected.precio_con_tax_usd, actual: result.precio_con_tax_usd },
    { field: 'costo_total_usd', expected: expected.costo_total_usd, actual: result.costo_total_usd },
    { field: 'costo_total_cop', expected: expected.costo_total_cop, actual: result.costo_total_cop },
    { field: 'precio_sugerido_cop', expected: expected.precio_sugerido_cop, actual: result.precio_sugerido_cop },
    { field: 'precio_final_cop', expected: expected.precio_final_cop, actual: result.precio_final_cop },
    { field: 'ganancia_cop', expected: expected.ganancia_cop, actual: result.ganancia_cop },
    { field: 'valor_producto_cop', expected: expected.valor_producto_cop, actual: result.valor_producto_cop },
    { field: 'descuento_cop', expected: expected.descuento_cop, actual: result.descuento_cop }
  ]

  let allPassed = true
  console.log('=== PRICING ENGINE VALIDATION TEST ===')
  console.log('Input:', testInput)
  console.log('---')
  
  for (const test of tests) {
    const passed = test.expected === test.actual
    if (!passed) allPassed = false
    console.log(`${passed ? '✅' : '❌'} ${test.field}: esperado ${test.expected}, obtenido ${test.actual}`)
  }
  
  console.log('---')
  console.log(allPassed ? '✅ TODOS LOS TESTS PASARON' : '❌ ALGUNOS TESTS FALLARON')
  
  return allPassed
}

// Export default para facilitar import
export default {
  calculatePricing,
  crearPricingInput,
  calcularTaxPct,
  porcentajeADecimal,
  formatearCOP,
  formatearUSD,
  runValidationTest
}
