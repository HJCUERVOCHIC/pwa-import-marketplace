import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { LoginCredentials, LoginResult } from '../types/auth.types';

interface UseLoginReturn {
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook personalizado para manejar el login
 */
export const useLogin = (): UseLoginReturn => {
  const { login: authLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authLogin(credentials);

      if (!result.success && result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMessage = 'Error inesperado durante el inicio de sesión';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        errorCode: 'NETWORK_ERROR',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    login,
    isLoading,
    error,
    clearError,
  };
};
