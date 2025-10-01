"use client"

import type React from "react"

import { useCallback, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import ReactFlow, {
  type Node,
  type Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type Connection,
  ReactFlowProvider,
} from "reactflow"
import "reactflow/dist/style.css"
import { fetchWithAuthClient } from "@/lib/client-utils/auth-fetch"
import { EditorHeader } from "./editor-header"
import { EditorSidebar } from "./editor-sidebar"
import { UMLClassNode } from "./nodes/uml-class-node"
import { UMLInterfaceNode } from "./nodes/uml-interface-node"
import { UMLAbstractNode } from "./nodes/uml-abstract-node"
import { UMLRelationshipEdge } from "./edges/uml-relationship-edge"
// import { EditClassDialog } from "./dialogs/edit-class-dialog"
import { UMLContextMenu } from "./context-menu"
import type { Project, UMLClass, UMLRelationship } from "@/lib/types"

interface ContextMenuState {
  x: number
  y: number
  nodeId?: string
  edgeId?: string
  clickedElement?: string
}

const nodeTypes = {
  umlClass: UMLClassNode,
  umlInterface: UMLInterfaceNode,
  umlAbstract: UMLAbstractNode,
}

const edgeTypes = {
  umlRelationship: UMLRelationshipEdge,
}

interface DiagramEditorProps {
  project: Project
  initialClasses: any[]
  initialRelationships: any[]
}

export function DiagramEditor({ project, initialClasses, initialRelationships }: DiagramEditorProps) {
  const router = useRouter()
  const initializedProjectId = useRef<string | null>(null) 
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [editingClass, setEditingClass] = useState<UMLClass | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const umlClasses = (): UMLClass[] => {
    return nodes.map((node) => ({
      id: node.id,
      name: node.data.name,
      stereotype: node.data.stereotype,
      attributes: node.data.attributes || [],
      methods: node.data.methods || [],
      position: node.position,
    }))
  }

  const getUMLRelationships = (): UMLRelationship[] => {
    return edges.map((edge) => ({
      id: edge.id,
      sourceClassId: edge.source,
      targetClassId: edge.target,
      relationshipType: edge.data?.relationshipType || "association",
      sourceMultiplicity: edge.data?.sourceMultiplicity,
      targetMultiplicity: edge.data?.targetMultiplicity,
      label: edge.data?.label as string,
    }))
  }

  const autoSave = useCallback(async () => {
    if (!hasUnsavedChanges) return

    try {
      const response = await fetchWithAuthClient(`/api/projects/${project.id}/save`, {
        method: "POST",
        body: JSON.stringify({
          classes: nodes.map((node) => ({
            id: node.id,
            name: node.data.name,
            stereotype: node.data.stereotype,
            attributes: node.data.attributes || [],
            methods: node.data.methods || [],
            position: node.position,
          })),
          relationships: edges.map((edge) => ({
            id: edge.id,
            sourceClassId: edge.source,
            targetClassId: edge.target,
            relationshipType: edge.data?.relationshipType || "association",
            sourceMultiplicity: edge.data?.sourceMultiplicity,
            targetMultiplicity: edge.data?.targetMultiplicity,
            label: edge.data?.label as string,
          })),
        }),
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        setLastSaved(new Date())
      }
    } catch (error) {
      console.error("Auto-save failed:", error)
    }
  }, [hasUnsavedChanges, project.id, nodes, edges])

  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        autoSave()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [hasUnsavedChanges, autoSave])

  const handleNodeUpdate = useCallback(
    (nodeId: string, updatedData: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: updatedData,
            }
          }
          return node
        }),
      )
      setHasUnsavedChanges(true)
    },
    [setNodes],
  )

  const handleEdgeUpdate = useCallback(
    (edgeId: string, updatedData: any) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            return {
              ...edge,
              data: updatedData,
            }
          }
          return edge
        }),
      )
      setHasUnsavedChanges(true)
    },
    [setEdges],
  )

  // --- NUEVA LÓGICA DE INICIALIZACIÓN ---
  // Combinamos los dos efectos en uno y usamos una guardia.
  useEffect(() => {
    // Si el proyecto ya fue inicializado Y el ID del proyecto es el mismo,
    // prevenimos la re-ejecución debido a cambios de referencia en las props.
    if (initializedProjectId.current === project.id) {
      return
    }

    console.log("Initializing ReactFlow state for project:", project.id)

    // Función auxiliar para obtener datos de un nodo específico
    const getNodeData = (cls: any) => ({
        name: cls.name,
        stereotype: cls.stereotype,
        attributes: cls.attributes || [],
        methods: cls.methods || [],
        onUpdate: (updatedData: any) => handleNodeUpdate(cls.id, updatedData),
    })

    // Mapeo de Nodos
    const flowNodes: Node[] = initialClasses.map((cls) => ({
      id: cls.id,
      type: cls.stereotype === "interface" ? "umlInterface" : cls.stereotype === "abstract" ? "umlAbstract" : "umlClass",
      position: cls.position || { x: 100, y: 100 },
      data: getNodeData(cls),
    }))

    // Mapeo de Aristas
    const flowEdges: Edge[] = initialRelationships.map((rel) => ({
      id: rel.id,
      source: rel.source_class_id,
      target: rel.target_class_id,
      type: "umlRelationship",
      label: rel.label,
      data: {
        relationshipType: rel.relationship_type,
        sourceMultiplicity: rel.source_multiplicity,
        targetMultiplicity: rel.target_multiplicity,
        label: rel.label,
        onUpdate: (updatedData: any) => handleEdgeUpdate(rel.id, updatedData),
      },
    }))

    setNodes(flowNodes)
    setEdges(flowEdges)
    
    // Marcamos el proyecto como inicializado
    initializedProjectId.current = project.id

  // Dependencias clave: project.id para forzar la inicialización si cambiamos de proyecto,
  // y los setters y handlers para cumplir con `useCallback`.
  }, [initialClasses, initialRelationships, project.id, setNodes, setEdges, handleNodeUpdate, handleEdgeUpdate])

  // --- FIN DE LA NUEVA LÓGICA DE INICIALIZACIÓN ---
  
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes)
      setHasUnsavedChanges(true)
    },
    [onNodesChange],
  )

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes)
      setHasUnsavedChanges(true)
    },
    [onEdgesChange],
  )

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) {
        return
      }
      const newEdge: Edge = {
        id: `edge-${Date.now()}`,
        type: "umlRelationship",
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        data: {
          relationshipType: "association",
          sourceMultiplicity: "",
          targetMultiplicity: "",
          label: "relation",
        },
      }
      setEdges((eds) => addEdge(newEdge, eds))
      setHasUnsavedChanges(true)
    },
    [setEdges, handleEdgeUpdate],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData("application/reactflow")
      if (typeof type === "undefined" || !type) {
        return
      }

      const position = {
        x: event.clientX - 250,
        y: event.clientY - 100,
      }

      let nodeType = "umlClass"
      let nodeData: any = {
        name: "NewClass",
        stereotype: "",
        attributes: [
          {
            name: "id",
            type: "Long",
            visibility: "private",
            isStatic: false,
          },
        ],
        methods: [
          {
            name: "getId",
            returnType: "Long",
            parameters: [],
            visibility: "public",
            isStatic: false,
            isAbstract: false,
          },
        ],
      }

      if (type === "interface") {
        nodeType = "umlInterface"
        nodeData = {
          name: "NewInterface",
          methods: [
            {
              name: "doSomething",
              returnType: "void",
              parameters: [],
              visibility: "public",
            },
          ],
        }
      } else if (type === "abstract") {
        nodeType = "umlAbstract"
        nodeData = {
          name: "AbstractClass",
          attributes: [],
          methods: [
            {
              name: "abstractMethod",
              returnType: "void",
              parameters: [],
              visibility: "public",
              isStatic: false,
              isAbstract: true,
            },
          ],
        }
      }

      // Asignar la función onUpdate al nodo recién creado
      const newNodeId = `${Date.now()}`
      nodeData.onUpdate = (updatedData: any) => handleNodeUpdate(newNodeId, updatedData)

      const newNode: Node = {
        id: newNodeId,
        type: nodeType,
        position,
        data: nodeData,
      }

      setNodes((nds) => nds.concat(newNode))
      setHasUnsavedChanges(true)
    },
    [setNodes, handleNodeUpdate, handleEdgeUpdate],
  )

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    const classData: UMLClass = {
      id: node.id,
      name: node.data.name,
      stereotype: node.data.stereotype,
      attributes: node.data.attributes || [],
      methods: node.data.methods || [],
      position: node.position,
    }
    setEditingClass(classData)
  }, [])

  const onCreateRelationship = useCallback((sourceId: string, targetId: string, type: string) => {
    // 1. Verificar si la arista ya existe (opcional, para evitar duplicados exactos)
    const edgeExists = edges.some(edge => 
      (edge.source === sourceId && edge.target === targetId && edge.type === type)
    )
    if (edgeExists) {
      console.warn(`La relación de tipo ${type} entre ${sourceId} y ${targetId} ya existe.`)
      return
    }

    // 2. Generar un ID único para la nueva arista
    // const newEdgeId = `e-${sourceId}-${targetId}-${type}-${Date.now()}`

    const newEdge: Edge = {
      id: `edge-${Date.now()}`,
      type: "umlRelationship",
      source: sourceId,
      target: targetId,
      sourceHandle: null,
      targetHandle: null,
      data: {
        relationshipType: type,
        sourceMultiplicity: "",
        targetMultiplicity: "",
        label: "relation",
      },
    }

    // 3. Usar setEdges para añadir la nueva arista al diagrama
    setEdges((eds) => addEdge(newEdge, eds))

    console.log(`Relación Creada: ${type} de ${sourceId} a ${targetId}`)

  }, [setEdges, handleEdgeUpdate])

  const handleSaveClass = useCallback(
    (updatedClass: UMLClass) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === updatedClass.id) {
            return {
              ...node,
              data: {
                name: updatedClass.name,
                stereotype: updatedClass.stereotype,
                attributes: updatedClass.attributes,
                methods: updatedClass.methods,
              },
            }
          }
          return node
        }),
      )
      setHasUnsavedChanges(true)
    },
    [setNodes],
  )

  const handleAIGenerate = useCallback(
    (classes: UMLClass[], relationships: UMLRelationship[]) => {
      // Convert AI-generated classes to React Flow nodes
      const flowNodes: Node[] = classes.map((cls) => ({
        id: cls.id,
        type:
          cls.stereotype === "interface" ? "umlInterface" : cls.stereotype === "abstract" ? "umlAbstract" : "umlClass",
        position: cls.position || { x: 100, y: 100 },
        data: {
          name: cls.name,
          stereotype: cls.stereotype,
          attributes: cls.attributes || [],
          methods: cls.methods || [],
        },
      }))

      // Convert AI-generated relationships to React Flow edges
      const flowEdges: Edge[] = relationships.map((rel) => ({
        id: rel.id,
        source: rel.sourceClassId,
        target: rel.targetClassId,
        type: "umlRelationship",
        label: rel.label,
        data: {
          relationshipType: rel.relationshipType,
          sourceMultiplicity: rel.sourceMultiplicity,
          targetMultiplicity: rel.targetMultiplicity,
        },
      }))

      // Add to existing nodes and edges instead of replacing
      setNodes((nds) => [...nds, ...flowNodes])
      setEdges((eds) => [...eds, ...flowEdges])
      setHasUnsavedChanges(true)
    },
    [setNodes, setEdges],
  )

  const handleManualSave = useCallback(async () => {
    await autoSave()
  }, [autoSave])

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId))
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
      setHasUnsavedChanges(true)
    },
    [setNodes, setEdges],
  )

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId))
      setHasUnsavedChanges(true)
    },
    [setEdges],
  )

  const handleAddAttribute = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const newAttribute = {
              name: "newAttribute",
              type: "String",
              visibility: "private" as const,
              isStatic: false,
            }
            return {
              ...node,
              data: {
                ...node.data,
                attributes: [...(node.data.attributes || []), newAttribute],
              },
            }
          }
          return node
        }),
      )
      setContextMenu(null)
      setHasUnsavedChanges(true)
    },
    [setNodes],
  )

  const handleAddMethod = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const newMethod = {
              name: "newMethod",
              returnType: "void",
              parameters: [],
              visibility: "public" as const,
              isStatic: false,
              isAbstract: false,
            }
            return {
              ...node,
              data: {
                ...node.data,
                methods: [...(node.data.methods || []), newMethod],
              },
            }
          }
          return node
        }),
      )
      setHasUnsavedChanges(true)
    },
    [setNodes],
  )

  const handleCopyNode = useCallback(
    (nodeId: string) => {
      const nodeToCopy = nodes.find((node) => node.id === nodeId)
      if (nodeToCopy) {
        const newNode = {
          ...nodeToCopy,
          id: `${Date.now()}`,
          position: {
            x: nodeToCopy.position.x + 50,
            y: nodeToCopy.position.y + 50,
          },
          data: {
            ...nodeToCopy.data,
            name: `${nodeToCopy.data.name}Copy`,
          },
        }
        setNodes((nds) => [...nds, newNode])
        setHasUnsavedChanges(true)
      }
    },
    [nodes, setNodes],
  )

  const handleDeleteAttribute = useCallback(
    (nodeId: string, index: number) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const newAttributes = [...(node.data.attributes || [])]
            newAttributes.splice(index, 1)
            return {
              ...node,
              data: {
                ...node.data,
                attributes: newAttributes,
              },
            }
          }
          return node
        }),
      )
      setHasUnsavedChanges(true)
    },
    [setNodes],
  )
  
  const handleDeleteMethod = useCallback(
    (nodeId: string, index: number) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const newMethods = [...(node.data.methods || [])]
            newMethods.splice(index, 1)
            return {
              ...node,
              data: {
                ...node.data,
                methods: newMethods,
              },
            }
          }
          return node
        }),
      )
      setContextMenu(null)
      setHasUnsavedChanges(true)
    },
    [setNodes],
  )

  // --- HANDLERS CORREGIDOS: Capturan posición y datos ---
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault() // Evita el menú del navegador, esencial para React Flow
      // Guardamos las coordenadas del ratón y el ID del nodo
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        edgeId: undefined,
        clickedElement: undefined,
      })
    },
    [],
  )

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault()
      // Guardamos las coordenadas del ratón y el ID de la arista
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        edgeId: edge.id,
        nodeId: undefined,
        clickedElement: undefined,
      })
    },
    [],
  )
  
  // Función auxiliar para cerrar el menú, usada por el ContextMenu
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])
  
  // Usamos onPaneClick para cerrar el menú si se hace clic en el fondo
  const onPaneClick = useCallback(() => {
    setContextMenu(null)
  }, [])
  
  // Usamos onPaneContextMenu para evitar que el clic derecho en el fondo abra el menú nativo
  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenu(null) 
  }, [])
  // --- FIN HANDLERS CORREGIDOS ---

  return (
    <div className="h-full flex">
      <EditorSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onAIGenerate={handleAIGenerate}
        umlClasses={umlClasses()}
        onCreateRelationship={onCreateRelationship}
        // getUMLClasses={getUMLClasses}
        // getUMLRelationships={getUMLRelationships}
      />

      <div className="flex-1 flex flex-col">
        <EditorHeader
          project={project}
          classes={nodes.map((node) => ({
            id: node.id,
            name: node.data.name,
            stereotype: node.data.stereotype,
            attributes: node.data.attributes || [],
            methods: node.data.methods || [],
            position: node.position,
          }))}
          relationships={edges.map((edge) => ({
            id: edge.id,
            sourceClassId: edge.source,
            targetClassId: edge.target,
            relationshipType: edge.data?.relationshipType || "association",
            sourceMultiplicity: edge.data?.sourceMultiplicity,
            targetMultiplicity: edge.data?.targetMultiplicity,
            label: edge.data?.label as string,
          }))}
          onSave={handleManualSave}
        />

        <div className="flex-1 relative">
          <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeDoubleClick={onNodeDoubleClick}

                onNodeContextMenu={onNodeContextMenu}
                onEdgeContextMenu={onEdgeContextMenu}
                onPaneClick={onPaneClick}

                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                className="bg-background"
              >
                <Controls />
                <MiniMap />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

              </ReactFlow>
              {contextMenu && (
                <UMLContextMenu
                  x={contextMenu.x}
                  y={contextMenu.y}
                  nodeId={contextMenu.nodeId}
                  edgeId={contextMenu.edgeId}
                  clickedElement={contextMenu.clickedElement}
                  onClose={handleCloseContextMenu} // Usa la función de cierre
                  onDeleteNode={handleDeleteNode}
                  onDeleteEdge={handleDeleteEdge}
                  onAddAttribute={handleAddAttribute}
                  onAddMethod={handleAddMethod}
                  onCopyNode={handleCopyNode}
                  onDeleteAttribute={handleDeleteAttribute}
                  onDeleteMethod={handleDeleteMethod}
                >
                  <></>
                  {/* You can put context menu items here, or leave empty if handled internally */}
                </UMLContextMenu>
              )}
          </ReactFlowProvider>

          {hasUnsavedChanges && (
            <div className="absolute top-4 right-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-md text-sm">
              Unsaved changes
            </div>
          )}

          {lastSaved && !hasUnsavedChanges && (
            <div className="absolute top-4 right-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-md text-sm">
              Saved at {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}