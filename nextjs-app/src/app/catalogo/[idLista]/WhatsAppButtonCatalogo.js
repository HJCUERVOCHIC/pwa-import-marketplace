'use client'

import { useState } from 'react'

function formatearPrecioCOP(precio) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(precio)
}

export default function WhatsAppButtonCatalogo({ producto, idLista }) {
  const [loading, setLoading] = useState(false)

  // Función para generar imagen tipo ficha del producto
  const generarImagenProducto = async () => {
    const precio = formatearPrecioCOP(producto.precio_final_cop)
    
    return new Promise(async (resolve, reject) => {
      try {
        // Crear canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Dimensiones de la imagen final
        const anchoCanvas = 800
        const altoImagen = 600
        const altoBloque = producto.descripcion ? 280 : 220
        const altoCanvas = altoImagen + altoBloque
        
        canvas.width = anchoCanvas
        canvas.height = altoCanvas
        
        // Fondo blanco por defecto
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, anchoCanvas, altoCanvas)
        
        // Cargar imagen del producto
        if (producto.imagenes?.[0]) {
          const img = new window.Image()
          img.crossOrigin = 'anonymous'
          
          img.onload = () => {
            // Calcular proporciones para centrar y cubrir
            const imgRatio = img.width / img.height
            const canvasRatio = anchoCanvas / altoImagen
            
            let drawWidth, drawHeight, drawX, drawY
            
            if (imgRatio > canvasRatio) {
              drawHeight = altoImagen
              drawWidth = img.width * (altoImagen / img.height)
              drawX = (anchoCanvas - drawWidth) / 2
              drawY = 0
            } else {
              drawWidth = anchoCanvas
              drawHeight = img.height * (anchoCanvas / img.width)
              drawX = 0
              drawY = (altoImagen - drawHeight) / 2
            }
            
            // Fondo gris claro para la zona de imagen
            ctx.fillStyle = '#F3F4F6'
            ctx.fillRect(0, 0, anchoCanvas, altoImagen)
            
            // Dibujar imagen
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
            
            // Bloque blanco inferior
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, altoImagen, anchoCanvas, altoBloque)
            
            // Línea separadora sutil
            ctx.strokeStyle = '#E5E7EB'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(0, altoImagen)
            ctx.lineTo(anchoCanvas, altoImagen)
            ctx.stroke()
            
            // Textos
            const padding = 30
            let yPos = altoImagen + 40
            
            // Título del producto
            ctx.fillStyle = '#111827'
            ctx.font = 'bold 30px Arial, sans-serif'
            const titulo = producto.titulo.length > 40 
              ? producto.titulo.substring(0, 40) + '...' 
              : producto.titulo
            ctx.fillText(titulo, padding, yPos)
            
            // Marca
            if (producto.marca) {
              yPos += 38
              ctx.fillStyle = '#6B7280'
              ctx.font = '22px Arial, sans-serif'
              ctx.fillText(`Marca: ${producto.marca}`, padding, yPos)
            }
            
            // Descripción
            if (producto.descripcion) {
              yPos += 35
              ctx.fillStyle = '#4B5563'
              ctx.font = '18px Arial, sans-serif'
              const descripcion = producto.descripcion.length > 80 
                ? producto.descripcion.substring(0, 80) + '...' 
                : producto.descripcion
              ctx.fillText(descripcion, padding, yPos)
            }
            
            // Precio destacado
            yPos += 50
            ctx.fillStyle = '#D4AF37' // Dorado
            ctx.font = 'bold 44px Arial, sans-serif'
            ctx.fillText(precio, padding, yPos)
            
            // Nombre de la tienda
            yPos += 38
            ctx.fillStyle = '#9CA3AF'
            ctx.font = 'italic 18px Arial, sans-serif'
            ctx.fillText('Chic Import USA', padding, yPos)
            
            // Convertir a blob
            canvas.toBlob((blob) => {
              resolve(blob)
            }, 'image/jpeg', 0.9)
          }
          
          img.onerror = () => {
            reject(new Error('No se pudo cargar la imagen'))
          }
          
          img.src = producto.imagenes[0]
        } else {
          // Sin imagen - solo texto
          ctx.fillStyle = '#F3F4F6'
          ctx.fillRect(0, 0, anchoCanvas, altoImagen)
          
          // Icono placeholder
          ctx.fillStyle = '#D1D5DB'
          ctx.font = '120px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('📦', anchoCanvas / 2, altoImagen / 2 + 40)
          ctx.textAlign = 'left'
          
          // Bloque blanco inferior
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, altoImagen, anchoCanvas, altoBloque)
          
          // Textos
          const padding = 30
          let yPos = altoImagen + 40
          
          ctx.fillStyle = '#111827'
          ctx.font = 'bold 30px Arial, sans-serif'
          ctx.fillText(producto.titulo, padding, yPos)
          
          if (producto.marca) {
            yPos += 38
            ctx.fillStyle = '#6B7280'
            ctx.font = '22px Arial, sans-serif'
            ctx.fillText(`Marca: ${producto.marca}`, padding, yPos)
          }
          
          // Descripción
          if (producto.descripcion) {
            yPos += 35
            ctx.fillStyle = '#4B5563'
            ctx.font = '18px Arial, sans-serif'
            const descripcion = producto.descripcion.length > 80 
              ? producto.descripcion.substring(0, 80) + '...' 
              : producto.descripcion
            ctx.fillText(descripcion, padding, yPos)
          }
          
          yPos += 50
          ctx.fillStyle = '#D4AF37'
          ctx.font = 'bold 44px Arial, sans-serif'
          ctx.fillText(precio, padding, yPos)
          
          yPos += 38
          ctx.fillStyle = '#9CA3AF'
          ctx.font = 'italic 18px Arial, sans-serif'
          ctx.fillText('Chic Import USA', padding, yPos)
          
          canvas.toBlob((blob) => {
            resolve(blob)
          }, 'image/jpeg', 0.9)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  const handleClick = async (e) => {
    e.stopPropagation()
    
    try {
      setLoading(true)
      
      // Generar imagen tipo ficha
      const imagenBlob = await generarImagenProducto()
      const file = new File([imagenBlob], `${producto.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`, { type: 'image/jpeg' })
      
      // Verificar si el navegador soporta compartir archivos
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file]
        })
      } else {
        // Fallback: descargar imagen
        const url = URL.createObjectURL(imagenBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${producto.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        alert('Imagen descargada. Puedes compartirla manualmente en WhatsApp.')
      }
    } catch (error) {
      console.log('Error compartiendo:', error)
      // Si el usuario cancela, no mostrar error
      if (error.name !== 'AbortError') {
        alert('Error al generar imagen: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-70"
      style={{ 
        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'
      }}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      )}
      {loading ? 'Generando...' : 'Compartir'}
    </button>
  )
}