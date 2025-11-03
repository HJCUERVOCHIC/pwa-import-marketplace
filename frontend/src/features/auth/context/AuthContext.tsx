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

// ✅ NUEVO: Versión del storage para auto-limpieza en cambios importantes
const STORAGE_VERSION = '1.0';

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
   * ✅ MEJORADO: Con manejo robusto de errores y auto-recuperación
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // ✅ NUEVO: Verificar versión de localStorage
        const currentVersion = localStorage.getItem('app-version');
        
        if (currentVersion !== STORAGE_VERSION) {
          console.log('📦 Nueva versión detectada, limpiando localStorage...');
          localStorage.clear();
          localStorage.setItem('app-version', STORAGE_VERSION);
        }

        // Obtener sesión actual
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        // ✅ MEJORADO: Manejo explícito de errores
        if (sessionError) {
          console.error('❌ Error al obtener sesión:', sessionError);
          // Limpiar localStorage corrupto
          localStorage.clear();
          localStorage.setItem('app-version', STORAGE_VERSION);
          
          if (mounted) {
            setState({
              user: null,
              session: null,
              profile: null,
              loading: false,
              initialized: true,
            });
          }
          return;
        }

        if (session && mounted) {
          try {
            // Obtener perfil del usuario
            const profile = await authService.getProfile();

            setState({
              user: session.user,
              session,
              profile,
              loading: false,
              initialized: true,
            });
          } catch (profileError) {
            console.error('❌ Error al cargar perfil:', profileError);
            // Si falla el perfil, limpiar sesión
            await supabase.auth.signOut();
            
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
        console.error('❌ Error fatal en inicialización de auth:', error);
        
        // ✅ NUEVO: Auto-recuperación en caso de error fatal
        try {
          localStorage.clear();
          localStorage.setItem('app-version', STORAGE_VERSION);
          await supabase.auth.signOut();
        } catch (cleanupError) {
          console.error('Error en limpieza de emergencia:', cleanupError);
        }
        
        if (mounted) {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            initialized: true,
          });
        }
      } finally {
        // ✅ CRÍTICO: Asegurar que siempre se marque como inicializado
        if (mounted) {
          setState((prev) => ({
            ...prev,
            loading: false,
            initialized: true,
          }));
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
   * ✅ MEJORADO: Con manejo de errores mejorado
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);

      try {
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
        } else if (event === 'USER_UPDATED' && session) {
          // ✅ NUEVO: Manejar actualizaciones de usuario
          const profile = await authService.getProfile();
          setState((prev) => ({
            ...prev,
            user: session.user,
            session,
            profile,
          }));
        }
      } catch (error) {
        console.error('❌ Error en cambio de estado de auth:', error);
        // En caso de error, mantener el estado seguro
        setState({
          user: null,
          session: null,
          profile: null,
          loading: false,
          initialized: true,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Función de login
   * ✅ MEJORADO: Con manejo de errores mejorado
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
      console.error('❌ Error en login:', error);
      setState((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  /**
   * Función de logout
   * ✅ MEJORADO: Con limpieza más robusta
   */
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      await authService.logout();
      // El estado se actualizará automáticamente a través del listener
    } catch (error) {
      console.error('❌ Error durante logout:', error);
      
      // ✅ MEJORADO: Forzar limpieza completa incluso si hay error
      try {
        await supabase.auth.signOut();
        localStorage.removeItem('pwa-import-marketplace-auth');
      } catch (cleanupError) {
        console.error('Error en limpieza de logout:', cleanupError);
      }
      
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