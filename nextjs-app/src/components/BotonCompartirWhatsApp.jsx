// Componente reutilizable para boton de compartir por WhatsApp
// Sesion 011 - Chic Import USA

import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';

/**
 * Boton para compartir por WhatsApp
 * @param {Object} props
 * @param {Function} props.onClick - Funcion a ejecutar al hacer click
 * @param {string} props.variant - Variante del boton: 'default' | 'compact' | 'icon'
 * @param {boolean} props.disabled - Si el boton esta deshabilitado
 * @param {string} props.className - Clases CSS adicionales
 */
const BotonCompartirWhatsApp = ({ 
  onClick, 
  variant = 'default',
  disabled = false,
  className = '' 
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || loading) return;
    
    setLoading(true);
    try {
      await onClick();
    } catch (error) {
      console.error('Error al compartir:', error);
    } finally {
      setLoading(false);
    }
  };

  // Estilos base (verde WhatsApp)
  const baseStyles = "inline-flex items-center justify-center gap-2 transition-all duration-200 font-medium";
  const whatsappGreen = "bg-[#25D366] hover:bg-[#20BA5A] text-white";
  const disabledStyles = "opacity-50 cursor-not-allowed";
  
  // Variantes
  const variants = {
    default: `${baseStyles} ${whatsappGreen} px-4 py-2 rounded-lg shadow-sm hover:shadow-md`,
    compact: `${baseStyles} ${whatsappGreen} px-3 py-1.5 text-sm rounded-md`,
    icon: `${baseStyles} ${whatsappGreen} p-2 rounded-full shadow-sm hover:shadow-md`,
  };

  const buttonClasses = `
    ${variants[variant]} 
    ${disabled || loading ? disabledStyles : ''} 
    ${className}
  `.trim();

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={buttonClasses}
      title="Compartir por WhatsApp"
    >
      <MessageCircle className={variant === 'icon' ? 'w-5 h-5' : 'w-4 h-4'} />
      {variant !== 'icon' && (
        <span>{loading ? 'Compartiendo...' : 'Compartir por WhatsApp'}</span>
      )}
    </button>
  );
};

export default BotonCompartirWhatsApp;
