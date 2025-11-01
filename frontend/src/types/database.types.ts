/**
 * Tipos generados para la base de datos de Supabase
 * Estos tipos deben actualizarse ejecutando: npx supabase gen types typescript
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      administradores: {
        Row: {
          id_admin: string;
          email: string;
          nombre: string;
          role: 'superadmin' | 'admin_full';
          activo: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
          intentos_fallidos: number;
          bloqueado_hasta: string | null;
          auth_user_id: string | null;
        };
        Insert: {
          id_admin?: string;
          email: string;
          nombre: string;
          role: 'superadmin' | 'admin_full';
          activo?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
          intentos_fallidos?: number;
          bloqueado_hasta?: string | null;
          auth_user_id?: string | null;
        };
        Update: {
          id_admin?: string;
          email?: string;
          nombre?: string;
          role?: 'superadmin' | 'admin_full';
          activo?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
          intentos_fallidos?: number;
          bloqueado_hasta?: string | null;
          auth_user_id?: string | null;
        };
      };
      auth_logs: {
        Row: {
          id_log: number;
          admin_id: string | null;
          evento: 'login_success' | 'login_failed' | 'logout' | 'account_blocked' | 'password_reset';
          email_intento: string | null;
          ip_address: string | null;
          user_agent: string | null;
          detalles: Json | null;
          created_at: string;
        };
        Insert: {
          id_log?: number;
          admin_id?: string | null;
          evento: 'login_success' | 'login_failed' | 'logout' | 'account_blocked' | 'password_reset';
          email_intento?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          detalles?: Json | null;
          created_at?: string;
        };
        Update: {
          id_log?: number;
          admin_id?: string | null;
          evento?: 'login_success' | 'login_failed' | 'logout' | 'account_blocked' | 'password_reset';
          email_intento?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          detalles?: Json | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      handle_successful_login: {
        Args: {
          p_admin_id: string;
          p_ip_address?: string;
          p_user_agent?: string;
        };
        Returns: void;
      };
      handle_failed_login: {
        Args: {
          p_email: string;
          p_ip_address?: string;
          p_user_agent?: string;
        };
        Returns: {
          bloqueado: boolean;
          intentos: number;
        };
      };
      check_admin_can_login: {
        Args: {
          p_email: string;
        };
        Returns: {
          can_login: boolean;
          activo: boolean;
          bloqueado: boolean;
          bloqueado_hasta: string | null;
          role: string;
          admin_id: string;
        };
      };
      handle_logout: {
        Args: {
          p_admin_id: string;
          p_ip_address?: string;
          p_user_agent?: string;
        };
        Returns: void;
      };
    };
  };
}
