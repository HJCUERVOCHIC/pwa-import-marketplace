export interface Database {
  public: {
    Tables: {
      administradores: {
        Row: {
          id_admin: string
          auth_user_id: string
          nombre: string
          email: string
          role: 'superadmin' | 'admin_full'
          activo: boolean
          created_at: string
          updated_at: string
        }
      }
      listas_oferta: {
        Row: {
          id: string
          titulo: string
          descripcion: string | null
          fecha_oferta: string
          estado: string
          created_at: string
        }
      }
      productos: {
        Row: {
          id: string
          id_lista: string
          titulo: string
          marca: string | null
          descripcion: string | null
          imagenes: string[] | null
          precio_final_cop: number
          estado: string
          created_at: string
        }
      }
    }
  }
}