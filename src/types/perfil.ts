export type Perfil = {
  id: string
  nombre: string
  telefono: string
  email?: string
  created_at: string
  is_admin?: boolean
  avatar_url?: string | null
}
