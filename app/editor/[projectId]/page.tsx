import { redirect } from "next/navigation"
import { DiagramEditor } from "@/components/editor/diagram-editor"
import { cookies } from "next/headers" 
import type { Project, UMLClass, UMLRelationship } from "@/lib/types" 
import { FLASK_API_BASE_URL } from "@/lib/api"

interface EditorPageProps {
  params: { projectId: string }
}

async function fetchWithAuth(path: string, token: string): Promise<Project> {
  const response = await fetch(`${FLASK_API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    // Server Components necesitan esto para no cachear la data
    cache: 'no-store', 
  })

  if (response.status === 401) {
    redirect("/auth/login")
  }
  
  if (!response.ok) {
    console.error(`Error al obtener datos de ${path}:`, response.status, response.statusText)
    if (response.status === 404 || response.status === 403) {
      redirect("/dashboard")
    }
    throw new Error(`Failed to fetch data from ${path}`)
  }
  
  // El API de proyectos devuelve el objeto Project completo con clases y relaciones anidadas
  return response.json()
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { projectId } = params

  const token = cookies().get("access_token")?.value || "" 

  if (!token) {
    redirect("/auth/login")
  }

  try {
    // 1. OBTENER TODO EN UNA SOLA LLAMADA: GET /api/projects/{projectId}
    // El objeto 'project' ya contiene las listas de clases y relaciones completas.
    const project: Project = await fetchWithAuth(`/projects/${projectId}`, token)
    
    // 2. EXTRAER las clases y relaciones directamente del objeto Project
    const initialClasses: UMLClass[] = (project as any).classes || [] // Usamos 'as any' para acceder a la lista anidada si no está en el tipo 'Project'
    const initialRelationships: UMLRelationship[] = (project as any).relationships || []

    return (
      <div className="h-screen bg-background">
        <DiagramEditor 
          project={project} 
          initialClasses={initialClasses} 
          initialRelationships={initialRelationships} 
        />
      </div>
    )

  } catch (error) {
    console.error("Critical error in EditorPage:", error)
    redirect("/dashboard")
  }
}
