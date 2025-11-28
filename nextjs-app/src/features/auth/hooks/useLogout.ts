import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface UseLogoutReturn {
  logout: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook personalizado para manejar el logout
 */
export const useLogout = (): UseLogoutReturn => {
  const { logout: authLogout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    setIsLoading(true);

    try {
      await authLogout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    logout,
    isLoading,
  };
};
