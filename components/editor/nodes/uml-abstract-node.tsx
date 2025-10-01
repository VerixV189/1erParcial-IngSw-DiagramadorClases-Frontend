"use client"

import type React from "react"

import { memo, useState, useCallback } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface UMLAbstractData {
  name: string
  attributes: Array<{
    name: string
    type: string
    visibility: "public" | "private" | "protected" | "package"
    isStatic?: boolean
  }>
  methods: Array<{
    name: string
    returnType: string
    parameters: Array<{ name: string; type: string }>
    visibility: "public" | "private" | "protected" | "package"
    isStatic?: boolean
    isAbstract?: boolean
  }>
  onUpdate?: (data: UMLAbstractData) => void
}

const getVisibilitySymbol = (visibility: string) => {
  switch (visibility) {
    case "public":
      return "+"
    case "private":
      return "-"
    case "protected":
      return "#"
    case "package":
      return "~"
    default:
      return "+"
  }
}

export const UMLAbstractNode = memo(({ data }: NodeProps<UMLAbstractData>) => {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  const handleDoubleClick = useCallback((field: string, currentValue: string) => {
    setEditingField(field)
    setEditValue(currentValue)
  }, [])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (editingField && data.onUpdate) {
          const updatedData = { ...data }

          if (editingField === "name") {
            updatedData.name = editValue
          } else if (editingField.startsWith("attr-")) {
            const index = Number.parseInt(editingField.split("-")[1])
            const field = editingField.split("-")[2]
            if (updatedData.attributes[index]) {
              updatedData.attributes[index] = {
                ...updatedData.attributes[index],
                [field]: editValue,
              }
            }
          } else if (editingField.startsWith("method-")) {
            const index = Number.parseInt(editingField.split("-")[1])
            const field = editingField.split("-")[2]
            if (updatedData.methods[index]) {
              updatedData.methods[index] = {
                ...updatedData.methods[index],
                [field]: editValue,
              }
            }
          }

          data.onUpdate(updatedData)
        }
        setEditingField(null)
        setEditValue("")
      } else if (e.key === "Escape") {
        setEditingField(null)
        setEditValue("")
      }
    },
    [editingField, editValue, data],
  )

  const renderEditableText = useCallback(
    (field: string, value: string, className?: string) => {
      if (editingField === field) {
        return (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={() => setEditingField(null)}
            className={`h-auto p-0 border-none bg-transparent ${className}`}
            autoFocus
          />
        )
      }

      return (
        <span
          className={`cursor-pointer hover:bg-muted/50 px-1 rounded ${className}`}
          onDoubleClick={() => handleDoubleClick(field, value)}
        >
          {value}
        </span>
      )
    },
    [editingField, editValue, handleDoubleClick, handleKeyPress],
  )

  return (
    <div className="min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <Card className="shadow-lg border-2 hover:border-primary/50 transition-colors bg-muted/20 dark:bg-muted/10">
        <CardHeader className="pb-2 text-center">
          <Badge variant="outline" className="text-xs mb-1 self-center">
            &lt;&lt;abstract&gt;&gt;
          </Badge>
          <h3 className="font-bold text-sm italic">{renderEditableText("name", data.name)}</h3>
        </CardHeader>

        {data.attributes.length > 0 && (
          <>
            <Separator />
            <CardContent className="py-2">
              <div className="space-y-1">
                {data.attributes.map((attr, index) => (
                  <div key={index} className="text-xs font-mono flex items-center">
                    <span className="mr-1">{getVisibilitySymbol(attr.visibility)}</span>
                    <span className={attr.isStatic ? "underline" : ""}>
                      {renderEditableText(`attr-${index}-name`, attr.name)}:
                      {renderEditableText(`attr-${index}-type`, attr.type, "ml-1")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </>
        )}

        {data.methods.length > 0 && (
          <>
            <Separator />
            <CardContent className="py-2">
              <div className="space-y-1">
                {data.methods.map((method, index) => (
                  <div key={index} className="text-xs font-mono flex items-center">
                    <span className="mr-1">{getVisibilitySymbol(method.visibility)}</span>
                    <span className={`${method.isStatic ? "underline" : ""} ${method.isAbstract ? "italic" : ""}`}>
                      {renderEditableText(`method-${index}-name`, method.name)}(
                      {method.parameters.map((param, i) => (
                        <span key={i}>
                          {param.name}: {param.type}
                          {i < method.parameters.length - 1 ? ", " : ""}
                        </span>
                      ))}
                      ): {renderEditableText(`method-${index}-returnType`, method.returnType)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </>
        )}
      </Card>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
})

UMLAbstractNode.displayName = "UMLAbstractNode"
