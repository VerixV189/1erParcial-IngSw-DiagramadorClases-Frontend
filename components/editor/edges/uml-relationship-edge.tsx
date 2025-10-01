"use client"

import type React from "react"

import { memo, useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { getStraightPath, type EdgeProps } from "reactflow"

interface UMLRelationshipData {
  relationshipType: "inheritance" | "composition" | "aggregation" | "association" | "dependency" | "realization"
  sourceMultiplicity?: string
  targetMultiplicity?: string
  label?: string
  onUpdate?: (data: UMLRelationshipData) => void
}

const getEdgeStyle = (relationshipType: string) => {
  switch (relationshipType) {
    case "inheritance":
      return { stroke: "black", strokeWidth: 2, strokeDasharray: "none" }
    case "realization":
      return { stroke: "black", strokeWidth: 2, strokeDasharray: "5,5" }
    case "dependency":
      return { stroke: "black", strokeWidth: 2, strokeDasharray: "3,3" }
    case "association":
      return { stroke: "black", strokeWidth: 0.5, strokeDasharray: "none" }
    case "aggregation":
      return { stroke: "black", strokeWidth: 2, strokeDasharray: "none" }
    case "composition":
      return { stroke: "black", strokeWidth: 2, strokeDasharray: "none" }
    default:
      return { stroke: "hsl(var(--foreground))", strokeWidth: 1, strokeDasharray: "none" }
  }
  // switch (relationshipType) {
  //   case "inheritance":
  //     return { stroke: "hsl(var(--foreground))", strokeWidth: 2, strokeDasharray: "none" }
  //   case "realization":
  //     return { stroke: "hsl(var(--foreground))", strokeWidth: 2, strokeDasharray: "5,5" }
  //   case "dependency":
  //     return { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "3,3" }
  //   case "association":
  //     return { stroke: "black", strokeWidth: 1, strokeDasharray: "none" }
  //   case "aggregation":
  //     return { stroke: "hsl(var(--foreground))", strokeWidth: 1, strokeDasharray: "none" }
  //   case "composition":
  //     return { stroke: "hsl(var(--foreground))", strokeWidth: 2, strokeDasharray: "none" }
  //   default:
  //     return { stroke: "hsl(var(--foreground))", strokeWidth: 1, strokeDasharray: "none" }
  // }
}

const getArrowMarker = (relationshipType: string) => {
  switch (relationshipType) {
    case "inheritance":
      return "url(#inheritance-arrow)"
    case "realization":
      return "url(#realization-arrow)"
    case "dependency":
      return "url(#dependency-arrow)"
    case "association":
      return "url(#association-arrow)"
    case "aggregation":
      return "url(#aggregation-diamond)"
    case "composition":
      return "url(#composition-diamond)"
    default:
      return "url(#default-arrow)"
  }
}

export const UMLRelationshipEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
    markerEnd,
  }: EdgeProps<UMLRelationshipData>) => {
    const [editingField, setEditingField] = useState<string | null>(null)
    const [editValue, setEditValue] = useState("")

    const [edgePath, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    })

    const edgeStyle = getEdgeStyle(data?.relationshipType || "association")
    const arrowMarker = getArrowMarker(data?.relationshipType || "association")

    const handleDoubleClick = useCallback((field: string, currentValue: string) => {
      setEditingField(field)
      setEditValue(currentValue || "")
    }, [])

    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          if (editingField && data?.onUpdate) {
            const updatedData = { ...data }

            if (editingField === "sourceMultiplicity") {
              updatedData.sourceMultiplicity = editValue
            } else if (editingField === "targetMultiplicity") {
              updatedData.targetMultiplicity = editValue
            } else if (editingField === "label") { // <-- Nuevo
              updatedData.label = editValue; // <-- Nuevo
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

    const renderEditableMultiplicity = useCallback(
      (field: string, value: string, startOffset: string) => {
        if (editingField === field) {
          // Calculate position for input
          const pathElement = document.getElementById(id) as SVGPathElement | null
          const pathLength = pathElement?.getTotalLength() || 0
          const offset = field === "sourceMultiplicity" ? pathLength * 0.1 : pathLength * 0.9
          const point = pathElement?.getPointAtLength(offset)

          return (
            <foreignObject x={(point?.x || 0) - 25} y={(point?.y || 0) - 10} width="50" height="20">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={() => setEditingField(null)}
                className="h-5 text-xs p-1 text-center bg-background border"
                autoFocus
                placeholder="1..*"
              />
            </foreignObject>
          )
        }

        return (
          <text>
            <textPath
              href={`#${id}`}
              startOffset={startOffset}
              className="text-xs fill-current cursor-pointer hover:fill-primary"
              onDoubleClick={() => handleDoubleClick(field, value)}
            >
              {value || ""}
            </textPath>
          </text>
        )
      },
      [editingField, editValue, handleDoubleClick, handleKeyPress, id],
    )

    return (
      <>
        <defs>
          {/* Inheritance arrow (hollow triangle) */}
          <marker
            id="inheritance-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1" />
          </marker>

          {/* Realization arrow (hollow triangle, dashed) */}
          <marker
            id="realization-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,6 L9,3 z"
              fill="hsl(var(--background))"
              stroke="hsl(var(--foreground))"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          </marker>

          {/* Dependency arrow (simple arrow) */}
          <marker
            id="dependency-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="hsl(var(--foreground))" />
          </marker>

          {/* Association arrow (simple arrow) */}
          <marker
            id="association-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            {/* <path d="M0,0 L0,6 L9,3 z" fill="hsl(var(--foreground))" /> */}
          </marker>

          {/* Aggregation diamond (hollow) */}
          <marker
            id="aggregation-diamond"
            markerWidth="12"
            markerHeight="8"
            refX="11"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,4 L6,0 L12,4 L6,8 z"
              fill="white"
              stroke="black"
            />
          </marker>

          {/* Composition diamond (filled) */}
          <marker
            id="composition-diamond"
            markerWidth="12"
            markerHeight="8"
            refX="11"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,4 L6,0 L12,4 L6,8 z" fill="hsl(var(--foreground))" stroke="black"/>
          </marker>

          {/* Default arrow */}
          <marker
            id="default-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="hsl(var(--foreground))"/>
          </marker>
        </defs>

        <path id={id} style={edgeStyle} d={edgePath} markerEnd={arrowMarker}/>

        {/* Source multiplicity - editable on double click */}
        {data?.relationshipType === "association" ? (renderEditableMultiplicity("sourceMultiplicity", data?.sourceMultiplicity || "1..1", "10%")) : null}

        {/* Edge label */}
        {editingField === "label" && data?.relationshipType === "association" ? (
          <foreignObject
            x={labelX - 50}
            y={labelY - 10}
            width="100"
            height="20"
            className="nodrag nopan"
          >
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={() => setEditingField(null)}
              className="h-5 text-xs p-1 text-center bg-background border"
              autoFocus
              placeholder="Relation"
            />
          </foreignObject>
        ) : (
          data?.label && (
            <text
              x={labelX}
              y={labelY}
              className="text-xs fill-current cursor-pointer hover:fill-primary"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                background: "hsl(var(--background))",
                padding: "2px 4px",
                borderRadius: "2px",
              }}
              onDoubleClick={() => handleDoubleClick("label", data.label as string)}
            >
              {data.label}
            </text>
          )
        )}

        {/* Target multiplicity - editable on double click */}
        {data?.relationshipType === "association" ? (renderEditableMultiplicity("targetMultiplicity", data?.targetMultiplicity || "1..1", "90%")) : null}
      </>
    )
  },
)

UMLRelationshipEdge.displayName = "UMLRelationshipEdge"