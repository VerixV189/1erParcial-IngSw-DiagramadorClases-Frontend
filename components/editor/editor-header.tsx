"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Download, Play, Zap, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { CodeGenerationDialog } from "./dialogs/code-generation-dialog"
import { ExportDialog } from "./dialogs/export-dialog"
import type { Project, UMLClass, UMLRelationship } from "@/lib/types"
import { FLASK_API_BASE_URL } from "@/lib/api"

interface EditorHeaderProps {
  project: Project
  classes?: UMLClass[]
  relationships?: UMLRelationship[]
  onSave?: () => void
}

const getAuthToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const cookieMatch = document.cookie.match(/(?:^|;)\s*access_token=([^;]*)/);
  return cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
};

export function EditorHeader({ project, classes = [], relationships = [], onSave }: EditorHeaderProps) {
  const router = useRouter()
  const [isCodeGenDialogOpen, setIsCodeGenDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [projectName, setProjectName] = useState(project.name);  

  const handleSave = async () => {
    // 1. Obtener el token de autenticación del cliente
    const token = getAuthToken();
    if (!token) {
      console.error("Error: Token de autenticación no encontrado. No se puede guardar.");
      // Podrías forzar un redirect al login aquí si es necesario
      return; 
    }

    setIsSaving(true)

    try {
      const response = await fetch(`${FLASK_API_BASE_URL}/projects/${project.id}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName,
          classes,
          relationships,
        }),
      })

      if (response.status === 401) {
        console.error("Error 401: Token inválido o expirado.");
        // Opcional: router.push("/auth/login");
        throw new Error("Unauthorized access. Please log in again.");
      }

      if (!response.ok) {
        throw new Error("Failed to save project")
      }

      // Call the onSave callback if provided
      onSave?.()
    } catch (error) {
      console.error("Error saving project:", error)
      // You could add a toast notification here
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-2">
              <Input
                defaultValue={project.name}
                className="text-lg font-semibold border-none bg-transparent px-0 focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* <Button variant="outline" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              AI Assistant
            </Button> */}

            <Button variant="outline" size="sm" onClick={() => setIsCodeGenDialogOpen(true)}>
              <Play className="h-4 w-4 mr-2" />
              Generate Code
            </Button>

            <Button variant="outline" size="sm" onClick={() => setIsExportDialogOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <ModeToggle />
          </div>
        </div>
      </header>

      <CodeGenerationDialog
        isOpen={isCodeGenDialogOpen}
        onClose={() => setIsCodeGenDialogOpen(false)}
        classes={classes}
        relationships={relationships}
      />

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        classes={classes}
        relationships={relationships}
      />
    </>
  )
}
