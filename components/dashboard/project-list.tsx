"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Plus, FileText, Calendar, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Project } from "@/lib/types"
import { FLASK_API_BASE_URL } from "@/lib/api"
import Cookies from 'js-cookie';

interface ProjectListProps {
  projects: Project[]
}

export function ProjectList({ projects }: ProjectListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCreateProject = async () => {
    if (!projectName.trim()) return

    setIsCreating(true)
    setError(null)
    const token = Cookies.get('access_token')

    if (!token) {
        // En un caso real, esto no debería pasar si el DashboardPage funciona
        console.error("Token no encontrado. Redireccionando a login.")
        router.push("/auth/login")
        return
    }

    try {
      const response = await fetch(`${FLASK_API_BASE_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Incluimos el token JWT
        },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDescription.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Manejo de errores de Flask (e.g., validación 400, o error interno 500)
        const errorMessage = data.message || (data.errors ? JSON.stringify(data.errors) : "Error al crear proyecto")
        throw new Error(errorMessage)
      }
      
      // La respuesta exitosa contiene los datos del proyecto creado (incluyendo el ID)
      const project = data
      
      setIsCreateDialogOpen(false)
      setProjectName("")
      setProjectDescription("")
      
      // Redirigir al editor con el ID devuelto por el backend
      router.push(`/editor/${project.id}`)
      
    } catch (error) {
      console.error("Error creating project:", error)
      setError(`Failed to create project: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenProject = (projectId: string) => {
    router.push(`/editor/${projectId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span className="text-sm text-muted-foreground">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </span>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new UML class diagram project. You can always edit these details later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="My UML Project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={!projectName.trim() || isCreating}>
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No projects yet</CardTitle>
            <CardDescription className="mb-4">
              Create your first UML class diagram project to get started.
            </CardDescription>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOpenProject(project.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); /* Más opciones... */ }}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {project.updated_At ? (
                      <span>
                        {formatDistanceToNow(new Date(project.updated_At), { addSuffix: true })}
                      </span>
                    ) : (
                      <span>No updates yet</span>
                    )}
                  </div>
                  <Button size="sm" onClick={() => handleOpenProject(project.id)}>
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
