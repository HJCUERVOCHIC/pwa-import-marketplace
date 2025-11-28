import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Tipo para el rol de administrador
 */
export type AdminRole = 'superadmin' | 'admin_full';

/**
 * Tipo para el perfil completo del administrador
 */
export type AdminProfile = Database['public']['Tables']['administradores']['Row'];

/**
 * Tipo para el estado de autenticación
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: AdminProfile | null;
  loading: boolean;
  initialized: boolean;
}

/**
 * Credenciales de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Resultado del login
 */
export interface LoginResult {
  success: boolean;
  error?: string;
  errorCode?: 'INVALID_CREDENTIALS' | 'ACCOUNT_INACTIVE' | 'ACCOUNT_BLOCKED' | 'NETWORK_ERROR';
  blockedUntil?: string;
}

/**
 * Resultado de validación de login
 */
export interface LoginValidationResult {
  can_login: boolean;
  activo: boolean;
  bloqueado: boolean;
  bloqueado_hasta: string | null;
  role: AdminRole;
  admin_id: string;
}

/**
 * Datos del contexto de autenticación
 */
export interface AuthContextData extends AuthState {
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: AdminRole | AdminRole[]) => boolean;
  isAuthenticated: boolean;
}

/**
 * Errores de autenticación
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos',
  ACCOUNT_INACTIVE: 'Tu cuenta ha sido desactivada, contacta al administrador',
  ACCOUNT_BLOCKED: 'Tu cuenta ha sido bloqueada temporalmente. Intenta nuevamente en ',
  NETWORK_ERROR: 'No se pudo conectar al servicio de autenticación, intenta nuevamente',
  SESSION_EXPIRED: 'Tu sesión ha expirado, por favor inicia sesión nuevamente',
  UNAUTHORIZED: 'No tienes permisos para acceder a este recurso',
} as const;
