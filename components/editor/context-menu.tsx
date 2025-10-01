"use client"

import type React from "react"
import { useCallback } from "react"
// Eliminamos las importaciones de shadcn/ui ContextMenu que causaban el error de contexto
// import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu"
import { Trash2, Plus, Copy } from "lucide-react"

// Componente estilizado que imita un ContextMenuItem
const MenuItem: React.FC<React.ComponentPropsWithoutRef<'button'> & { className?: string; onClick: () => void }> = ({ children, className, onClick, ...props }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}
    role="menuitem"
    {...props}
  >
    {children}
  </button>
)

// Componente estilizado que imita un ContextMenuSeparator
const MenuSeparator = () => (
  <div className="h-px my-1 mx-1 bg-gray-200 dark:bg-gray-600" />
)


interface ContextMenuProps {
  x: number // Posición X del ratón (cliente)
  y: number // Posición Y del ratón (cliente)
  onClose: () => void // Función para cerrar el menú
  children: React.ReactNode
  nodeId?: string
  edgeId?: string
  onDeleteNode?: (nodeId: string) => void
  onDeleteEdge?: (edgeId: string) => void
  onAddAttribute?: (nodeId: string) => void
  onAddMethod?: (nodeId: string) => void
  onCopyNode?: (nodeId: string) => void
  onDeleteAttribute?: (nodeId: string, index: number) => void
  onDeleteMethod?: (nodeId: string, index: number) => void
  clickedElement?: string // "attr-0", "method-1", etc.
}

export function UMLContextMenu({
  x,
  y,
  onClose,
  nodeId,
  edgeId,
  onDeleteNode,
  onDeleteEdge,
  onAddAttribute,
  onAddMethod,
  onCopyNode,
  onDeleteAttribute,
  onDeleteMethod,
  clickedElement,
}: ContextMenuProps) {

  const handleDeleteAttributeClick = useCallback(() => {
    if (nodeId && clickedElement?.startsWith("attr-") && onDeleteAttribute) {
      const index = Number.parseInt(clickedElement.split("-")[1])
      onDeleteAttribute(nodeId, index)
      onClose() // Asegura que el menú se cierre después de la acción
    }
  }, [nodeId, clickedElement, onDeleteAttribute, onClose])

  const handleDeleteMethodClick = useCallback(() => {
    if (nodeId && clickedElement?.startsWith("method-") && onDeleteMethod) {
      const index = Number.parseInt(clickedElement.split("-")[1])
      onDeleteMethod(nodeId, index)
      onClose() // Asegura que el menú se cierre después de la acción
    }
  }, [nodeId, clickedElement, onDeleteMethod, onClose])

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 1000,
  }

  return (
    // Capa de fondo invisible para capturar clics fuera y cerrar el menú
    <div 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
      onClick={onClose}
      // Previene el menú nativo si haces clic derecho en el fondo y cierra el menú custom
      onContextMenu={(e) => { e.preventDefault(); onClose(); }} 
    >
      <div 
        style={menuStyle} 
        // El contenido del menú debe usar onClick/onContextMenu para evitar que se cierren al interactuar con ellos
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
      >
        {/* Reemplazamos ContextMenuContent con un div estilizado */}
        <div className="w-48 block shadow-xl bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
          {nodeId && (
            <>
              {/* Opción de añadir atributos y cerrar el menú */}
              <MenuItem onClick={() => { onAddAttribute?.(nodeId); onClose(); }}>
                <Plus className="h-4 w-4 mr-2 text-blue-500" />
                Add Attribute
              </MenuItem>
              {/* Opción de añadir métodos y cerrar el menú */}
              <MenuItem onClick={() => { onAddMethod?.(nodeId); onClose(); }}>
                <Plus className="h-4 w-4 mr-2 text-blue-500" />
                Add Method
              </MenuItem>
              <MenuSeparator />
              <MenuItem onClick={() => { onCopyNode?.(nodeId); onClose(); }}>
                <Copy className="h-4 w-4 mr-2 text-gray-500" />
                Copy Class
              </MenuItem>
              <MenuSeparator />

              {/* Opciones de eliminación de elementos internos */}
              {clickedElement?.startsWith("attr-") && clickedElement !== "attr-name" && (
                <MenuItem onClick={handleDeleteAttributeClick} className="text-red-600 dark:text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Attribute
                </MenuItem>
              )}
              {clickedElement?.startsWith("method-") && clickedElement !== "method-name" && (
                <MenuItem onClick={handleDeleteMethodClick} className="text-red-600 dark:text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Method
                </MenuItem>
              )}
              
              {(clickedElement?.startsWith("attr-") || clickedElement?.startsWith("method-")) && <MenuSeparator />}

              {/* Opción de eliminación de la clase */}
              <MenuItem onClick={() => { onDeleteNode?.(nodeId); onClose(); }} className="text-red-600 dark:text-red-400">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Class
              </MenuItem>
            </>
          )}

          {edgeId && (
            // Opción de eliminación de la relación
            <MenuItem onClick={() => { onDeleteEdge?.(edgeId); onClose(); }} className="text-red-600 dark:text-red-400">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Relationship
            </MenuItem>
          )}
        </div>
      </div>
    </div>
  )
}