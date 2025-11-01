import { supabase } from '@/lib/supabase';
import type {
  LoginCredentials,
  LoginResult,
  AdminProfile,
  LoginValidationResult,
} from '../types/auth.types';

/**
 * Servicio de autenticación que interactúa con Supabase
 */
export const authService = {
  /**
   * Verifica si el usuario puede iniciar sesión
   */
  async checkCanLogin(email: string): Promise<LoginValidationResult | null> {
    try {
      const { data, error } = await supabase.rpc('check_admin_can_login', {
        p_email: email,
      });

      if (error) {
        console.error('Error checking login eligibility:', error);
        return null;
      }

      return data as LoginValidationResult;
    } catch (error) {
      console.error('Unexpected error in checkCanLogin:', error);
      return null;
    }
  },

  /**
   * Inicia sesión con email y contraseña
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      // Primero verificar si la cuenta puede iniciar sesión
      const canLogin = await this.checkCanLogin(credentials.email);

      if (!canLogin) {
        // Usuario no encontrado o error
        await this.handleFailedLogin(credentials.email);
        return {
          success: false,
          error: 'Correo o contraseña incorrectos',
          errorCode: 'INVALID_CREDENTIALS',
        };
      }

      // Verificar si la cuenta está activa
      if (!canLogin.activo) {
        return {
          success: false,
          error: 'Tu cuenta ha sido desactivada, contacta al administrador',
          errorCode: 'ACCOUNT_INACTIVE',
        };
      }

      // Verificar si la cuenta está bloqueada
      if (canLogin.bloqueado) {
        return {
          success: false,
          error: `Tu cuenta ha sido bloqueada temporalmente hasta ${new Date(
            canLogin.bloqueado_hasta!
          ).toLocaleTimeString('es-CO')}`,
          errorCode: 'ACCOUNT_BLOCKED',
          blockedUntil: canLogin.bloqueado_hasta!,
        };
      }

      // Intentar autenticar con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('Supabase Auth error:', error);
        // Registrar intento fallido
        await this.handleFailedLogin(credentials.email);

        return {
          success: false,
          error: 'Correo o contraseña incorrectos',
          errorCode: 'INVALID_CREDENTIALS',
        };
      }

      // Login exitoso - registrar en la base de datos
      await this.handleSuccessfulLogin(canLogin.admin_id);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Unexpected error during login:', error);
      return {
        success: false,
        error: 'No se pudo conectar al servicio de autenticación, intenta nuevamente',
        errorCode: 'NETWORK_ERROR',
      };
    }
  },

  /**
   * Cierra la sesión del usuario
   */
  async logout(): Promise<void> {
    try {
      // Obtener admin_id antes de cerrar sesión
      const profile = await this.getProfile();

      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error during logout:', error);
      }

      // Registrar logout en logs
      if (profile?.id_admin) {
        await this.handleLogout(profile.id_admin);
      }

      // Limpiar localStorage
      localStorage.removeItem('chicimportusa-auth');
    } catch (error) {
      console.error('Unexpected error during logout:', error);
    }
  },

  /**
   * Obtiene el perfil del administrador actual
   */
  async getProfile(): Promise<AdminProfile | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('administradores')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return null;
    }
  },

  /**
   * Obtiene la sesión actual
   */
  async getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  },

  /**
   * Registra un login exitoso
   */
  async handleSuccessfulLogin(adminId: string): Promise<void> {
    try {
      const userAgent = navigator.userAgent;
      const ipAddress = await this.getClientIP();

      await supabase.rpc('handle_successful_login', {
        p_admin_id: adminId,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
      });
    } catch (error) {
      console.error('Error handling successful login:', error);
    }
  },

  /**
   * Registra un intento de login fallido
   */
  async handleFailedLogin(email: string): Promise<void> {
    try {
      const userAgent = navigator.userAgent;
      const ipAddress = await this.getClientIP();

      await supabase.rpc('handle_failed_login', {
        p_email: email,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
      });
    } catch (error) {
      console.error('Error handling failed login:', error);
    }
  },

  /**
   * Registra un logout
   */
  async handleLogout(adminId: string): Promise<void> {
    try {
      const userAgent = navigator.userAgent;
      const ipAddress = await this.getClientIP();

      await supabase.rpc('handle_logout', {
        p_admin_id: adminId,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
      });
    } catch (error) {
      console.error('Error handling logout:', error);
    }
  },

  /**
   * Obtiene la IP del cliente (simulada, en producción usar un servicio real)
   */
  async getClientIP(): Promise<string | null> {
    try {
      // En producción, usar un servicio como ipapi.co o incluir en headers
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error fetching client IP:', error);
      return null;
    }
  },

  /**
   * Verifica si el token está expirado
   */
  isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt * 1000;
  },
};
