"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, ChevronRight, Box, GitBranch, Database, Zap, ArrowRight, Diamond } from "lucide-react"
import { AIGenerationDialog } from "./dialogs/ai-generation-dialog"
import type { UMLClass, UMLRelationship } from "@/lib/types"

// Definimos los tipos de relación disponibles para el selector
const RELATIONSHIP_TYPES = [
    { value: "inheritance", label: "Inheritance (Herencia)" },
    { value: "composition", label: "Composition (Composición)" },
    { value: "aggregation", label: "Aggregation (Agregación)" },
    { value: "association", label: "Association (Asociación)" },
    { value: "realization", label: "Realization (Realización)" },
    // Puedes añadir más tipos aquí si es necesario
]

interface EditorSidebarProps {
  isOpen: boolean
  onToggle: () => void
  onAIGenerate?: (classes: UMLClass[], relationships: UMLRelationship[]) => void
  // NUEVAS PROPS: Lista de clases para los combobox y función para crear la relación
  umlClasses: UMLClass[]
  onCreateRelationship: (sourceId: string, targetId: string, type: string) => void
}

export function EditorSidebar({ isOpen, onToggle, onAIGenerate, umlClasses, onCreateRelationship  }: EditorSidebarProps) {
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)
  const [sourceClassId, setSourceClassId] = useState<string>('')
  const [targetClassId, setTargetClassId] = useState<string>('')
  const [relationshipType, setRelationshipType] = useState<string>('')

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  const onRelationshipDragStart = (event: React.DragEvent, relationshipType: string) => {
    event.dataTransfer.setData("application/reactflow", `relationship-${relationshipType}`)
    event.dataTransfer.effectAllowed = "move"
  }

  const handleAIGenerate = (classes: UMLClass[], relationships: UMLRelationship[]) => {
    onAIGenerate?.(classes, relationships)
  }

  const handleCreateRelationship = () => {
    if (sourceClassId && targetClassId && relationshipType) {
      if (sourceClassId === targetClassId) {
        console.warn("Source and Target classes cannot be the same.")
        // En un entorno real, mostrarías un mensaje de error al usuario
        return
      }
      // Llama a la función proporcionada por el componente padre
      onCreateRelationship(sourceClassId, targetClassId, relationshipType)
      
      // Resetear los selectores después de crear
      setSourceClassId('')
      setTargetClassId('')
      setRelationshipType('')
    } else {
      console.warn("Missing selection for relationship creation.")
    }
  }

  if (!isOpen) {
    return (
      <div className="w-12 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-2">
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }
    
  // Función de utilidad para renderizar los selectores
  const renderClassSelector = (
    id: string, 
    label: string, 
    value: string, 
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
    excludeId?: string // Para evitar seleccionar la misma clase como origen y destino
  ) => (
    <div className="space-y-1" key={id}>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <select
        id={id}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        value={value}
        onChange={onChange}
        disabled={umlClasses.length < 2} // Deshabilitar si hay menos de 2 clases para conectar
      >
        <option value="" disabled>{umlClasses.length === 0 ? "No hay clases en el lienzo" : "Selecciona una clase..."}</option>
        {umlClasses
          .filter(cls => !excludeId || cls.id !== excludeId) // Filtra la clase opuesta
          .map(cls => (
          <option key={cls.id} value={cls.id}>
            {cls.name || `Unnamed Class (${cls.id.substring(0, 4)}...)`}
          </option>
        ))}
      </select>
      {umlClasses.length < 2 && (
          <p className="text-xs text-red-500">Necesitas al menos 2 clases para crear una relación.</p>
      )}
    </div>
  )

  return (
    <div className="w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">Toolbox</h2>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-73px)]">
        <div className="p-4 space-y-6">

          {/* UML Elements */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">UML Elements</h3>
            <Card
              className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
              draggable
              onDragStart={(e) => onDragStart(e, "umlClass")}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  <CardTitle className="text-sm">Class</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">Standard UML class with attributes and methods</CardDescription>
              </CardContent>
            </Card>

            <Card
              className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
              draggable
              onDragStart={(e) => onDragStart(e, "interface")}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <CardTitle className="text-sm">Interface</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">Interface definition with method signatures</CardDescription>
              </CardContent>
            </Card>

            <Card
              className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
              draggable
              onDragStart={(e) => onDragStart(e, "abstract")}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <CardTitle className="text-sm">Abstract Class</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">Abstract class with abstract methods</CardDescription>
              </CardContent>
            </Card>
          </div>
          <Separator />
          {/* Manual Relationship Creator (NUEVA SECCIÓN) */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Manual Relationship</h3>
            {/* <div className="space-y-4 p-3 border rounded-lg bg-card text-card-foreground shadow-lg"> */}
              {/* Selector de Clase Origen */}
              {renderClassSelector(
                "source-class",
                "Source Class (Inicio)",
                sourceClassId,
                (e) => setSourceClassId(e.target.value),
                targetClassId
              )}
              {/* Selector de Clase Destino */}
              {renderClassSelector(
                "target-class",
                "Target Class (Objetivo)",
                targetClassId,
                (e) => setTargetClassId(e.target.value),
                sourceClassId
              )}
              {/* Selector de Tipo de Relación */}
              <div className="space-y-1">
                <label htmlFor="relationship-type" className="text-sm font-medium">3. Relationship Type</label>
                <select
                  id="relationship-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  disabled={umlClasses.length < 2}
                >
                  <option value="" disabled>Selecciona un tipo...</option>
                  {RELATIONSHIP_TYPES.map(rel => (
                    <option key={rel.value} value={rel.value}>
                      {rel.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Botón de Creación */}
              <Button
                  variant="outline"
                  className="w-full justify-center bg-transparent"
                  size="sm"
                  onClick={handleCreateRelationship}
                  disabled={!sourceClassId || !targetClassId || !relationshipType || sourceClassId === targetClassId || umlClasses.length < 2}
              >
                <Zap className="h-4 w-4 mr-2" />
                Create Relationship
              </Button>
            {/* </div> */}
          </div>

          <Separator />

          {/* Relationship Types - Now draggable */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Relationships</h3>
            <p className="text-xs text-muted-foreground">Drag to canvas or connect nodes directly</p>

            <div className="grid grid-cols-2 gap-2">
              <Card
                className="p-2 text-center cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                draggable
                onDragStart={(e) => onRelationshipDragStart(e, "inheritance")}
              >
                <div className="flex items-center justify-center gap-1 text-xs">
                  <ArrowRight className="h-3 w-3" />
                  <span>Inheritance</span>
                </div>
              </Card>

              <Card
                className="p-2 text-center cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                draggable
                onDragStart={(e) => onRelationshipDragStart(e, "composition")}
              >
                <div className="flex items-center justify-center gap-1 text-xs">
                  <Diamond className="h-3 w-3" />
                  <span>Composition</span>
                </div>
              </Card>

              <Card
                className="p-2 text-center cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                draggable
                onDragStart={(e) => onRelationshipDragStart(e, "aggregation")}
              >
                <div className="flex items-center justify-center gap-1 text-xs">
                  <Diamond className="h-3 w-3" />
                  <span>Aggregation</span>
                </div>
              </Card>

              <Card
                className="p-2 text-center cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                draggable
                onDragStart={(e) => onRelationshipDragStart(e, "association")}
              >
                <div className="flex items-center justify-center gap-1 text-xs">
                  <ArrowRight className="h-3 w-3" />
                  <span>Association</span>
                </div>
              </Card>
            </div>
          </div>

          <Separator />

          {/* AI Tools */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">AI Tools</h3>

            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              size="sm"
              onClick={() => setIsAIDialogOpen(true)}
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate from Text
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              size="sm"
              onClick={() => setIsAIDialogOpen(true)}
            >
              <Zap className="h-4 w-4 mr-2" />
              Voice Input
            </Button>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>

            <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
              Auto Layout
            </Button>

            <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
              Validate Diagram
            </Button>
          </div>
        </div>
      </ScrollArea>

      <AIGenerationDialog
        isOpen={isAIDialogOpen}
        onClose={() => setIsAIDialogOpen(false)}
        onGenerate={handleAIGenerate}
      />
    </div>
  )
}