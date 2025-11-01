import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { authService } from '../services/authService';
import type {
  AuthContextData,
  AuthState,
  LoginCredentials,
  LoginResult,
  AdminRole,
} from '../types/auth.types';

/**
 * Contexto de autenticación
 */
const AuthContext = createContext<AuthContextData | undefined>(undefined);

/**
 * Props del provider de autenticación
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Provider de autenticación que gestiona el estado global de auth
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    initialized: false,
  });

  /**
   * Refresca el perfil del usuario desde la base de datos
   */
  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setState((prev) => ({
        ...prev,
        profile,
      }));
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  }, []);

  /**
   * Inicializa la sesión al cargar la aplicación
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Obtener sesión actual
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session && mounted) {
          // Obtener perfil del usuario
          const profile = await authService.getProfile();

          setState({
            user: session.user,
            session,
            profile,
            loading: false,
            initialized: true,
          });
        } else if (mounted) {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            initialized: true,
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            initialized: true,
          });
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Suscribirse a cambios en la autenticación
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && session) {
        const profile = await authService.getProfile();
        setState({
          user: session.user,
          session,
          profile,
          loading: false,
          initialized: true,
        });
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          session: null,
          profile: null,
          loading: false,
          initialized: true,
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setState((prev) => ({
          ...prev,
          user: session.user,
          session,
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Función de login
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const result = await authService.login(credentials);

      if (!result.success) {
        setState((prev) => ({ ...prev, loading: false }));
      }
      // Si el login es exitoso, el estado se actualizará automáticamente
      // a través del listener onAuthStateChange

      return result;
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  /**
   * Función de logout
   */
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      await authService.logout();
      // El estado se actualizará automáticamente a través del listener
    } catch (error) {
      console.error('Error during logout:', error);
      // Forzar limpieza del estado incluso si hay error
      setState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        initialized: true,
      });
    }
  }, []);

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const hasRole = useCallback(
    (role: AdminRole | AdminRole[]): boolean => {
      if (!state.profile) return false;

      if (Array.isArray(role)) {
        return role.includes(state.profile.role);
      }

      return state.profile.role === role;
    },
    [state.profile]
  );

  /**
   * Verifica si el usuario está autenticado
   */
  const isAuthenticated = Boolean(state.user && state.session && state.profile?.activo);

  const value: AuthContextData = {
    ...state,
    login,
    logout,
    refreshProfile,
    hasRole,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
