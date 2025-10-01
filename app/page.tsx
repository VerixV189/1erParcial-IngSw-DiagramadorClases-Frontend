import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

/**
 * Componente principal (Server Component) para la ruta raíz /.
 *
 * Su única responsabilidad es actuar como una puerta de enlace:
 * 1. Si el usuario tiene un token de acceso (está "logueado"), redirige a /dashboard.
 * 2. Si el usuario no tiene token, redirige a /auth/login.
 */
export default function HomePage() {
  // Usamos 'next/headers' para acceder a las cookies en el Server Component.
  const cookieStore = cookies()
  const token = cookieStore.get('access_token')

  if (token) {
    // Si el token existe (el usuario está logueado), redirigir al dashboard.
    // La validez del token se verificará al cargar los datos en /dashboard.
    redirect('/dashboard')
  } else {
    // Si no hay token, redirigir a la página de login.
    redirect('/auth/login')
  }
}