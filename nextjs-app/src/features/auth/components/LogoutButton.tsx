import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../hooks/useLogout';

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'text';
  className?: string;
  showIcon?: boolean;
}

/**
 * Componente de botón para cerrar sesión
 */
export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'text',
  className = '',
  showIcon = true,
}) => {
  const navigate = useNavigate();
  const { logout, isLoading } = useLogout();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'px-4 py-2 text-sm text-white bg-danger-600 hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500',
    secondary: 'px-4 py-2 text-sm text-danger-700 bg-danger-100 hover:bg-danger-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500',
    text: 'px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      type="button"
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Cerrando...
        </>
      ) : (
        <>
          {showIcon && (
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          )}
          Cerrar sesión
        </>
      )}
    </button>
  );
};
