"use client"

import { redirect } from "next/navigation"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" 
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProjectList } from "@/components/dashboard/project-list"
import { UserData } from "@/types/shared-types"
import { FLASK_API_BASE_URL } from "@/lib/api"
import Cookies from "js-cookie"

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  // NUEVA FUNCIÓN: Implementa el cierre de sesión eliminando la cookie y redirigiendo.
  const handleSignOut = () => {
    // 1. Eliminar el token de acceso de las cookies
    Cookies.remove("access_token") 
    // 2. Redirigir al usuario a la página de inicio de sesión
    router.push("/auth/login")
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Obtener el token de autenticación
      const token = Cookies.get("access_token")

      if (!token) {
        router.push("/auth/login")
        return
      }

      try {
        // 1. Obtener la información del usuario
        const userResponse = await fetch(`${FLASK_API_BASE_URL}/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        })

        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            // FIX 3: Eliminar la cookie y redirigir
            Cookies.remove("access_token") // <-- CORREGIDO
            router.push("/auth/login") // <-- CORREGIDO
            return // Detener la ejecución
          }
          throw new Error("Failed to fetch user data.")
        }
        const userData = await userResponse.json()
        
        // Formatear los datos para que coincidan con la interfaz de DashboardHeader
        const formattedUser = {
          id: userData.id,
          email: userData.email,
          user_metadata: {
            full_name: userData.name,
            // Aquí no tenemos la URL del avatar, así que lo dejamos nulo
            avatar_url: userData.avatar_url, 
          },
        }
        setUser(formattedUser as UserData)

        // 2. Obtener la lista de proyectos del usuario
        const projectsResponse = await fetch(`${FLASK_API_BASE_URL}/projects/list`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        })

        if (!projectsResponse.ok) {
          if (projectsResponse.status === 401) {
            // FIX 3: Eliminar la cookie y redirigir
            Cookies.remove("access_token") // <-- CORREGIDO
            router.push("/auth/login") // <-- CORREGIDO
            return // Detener la ejecución
          }
          throw new Error("Failed to fetch projects.")
        }
        const projectsData = await projectsResponse.json()
        setProjects(projectsData)

      } catch (err) {
        setError("An error occurred while fetching dashboard data.")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Loading projects...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  // Asegúrate de que el usuario no es nulo antes de pasar la prop
  return (
    <div className="min-h-screen bg-background">
      {user && <DashboardHeader user={user} onSignOut={handleSignOut}/>}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Your UML Projects</h1>
          <p className="text-muted-foreground mt-2">Create and manage your class diagrams</p>
        </div>
        <ProjectList projects={projects || []} />
      </main>
    </div>
  )
}
