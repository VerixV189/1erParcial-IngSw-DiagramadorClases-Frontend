"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Download, ImageIcon, FileText, Database, Loader2 } from "lucide-react"
import { toPng, toJpeg, toSvg } from "html-to-image"
import type { UMLClass, UMLRelationship } from "@/lib/types"

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  classes: UMLClass[]
  relationships: UMLRelationship[]
}

export function ExportDialog({ isOpen, onClose, classes, relationships }: ExportDialogProps) {
  const [imageFormat, setImageFormat] = useState("png")
  const [imageQuality, setImageQuality] = useState("1")
  const [fileName, setFileName] = useState("uml-diagram")
  const [isExporting, setIsExporting] = useState(false)

  const exportAsImage = async () => {
    setIsExporting(true)
    try {
      const diagramElement = document.querySelector(".react-flow") as HTMLElement
      if (!diagramElement) {
        throw new Error("Diagram element not found")
      }

      let dataUrl: string
      const options = {
        quality: Number.parseFloat(imageQuality),
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      }

      switch (imageFormat) {
        case "png":
          dataUrl = await toPng(diagramElement, options)
          break
        case "jpeg":
          dataUrl = await toJpeg(diagramElement, options)
          break
        case "svg":
          dataUrl = await toSvg(diagramElement)
          break
        default:
          dataUrl = await toPng(diagramElement, options)
      }

      // Download the image
      const link = document.createElement("a")
      link.download = `${fileName}.${imageFormat}`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Error exporting image:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsJSON = () => {
    const exportData = {
      classes,
      relationships,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: "1.0",
      },
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.download = `${fileName}.json`
    link.href = url
    link.click()

    URL.revokeObjectURL(url)
  }

  const exportAsXMI = () => {
    // Generate XMI (XML Metadata Interchange) format for UML
    let xmi = `<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmi:version="2.0" xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML">
  <uml:Model xmi:id="model" name="UMLModel">
`

    // Add classes
    classes.forEach((cls) => {
      xmi += `    <packagedElement xmi:type="uml:Class" xmi:id="${cls.id}" name="${cls.name}">\n`

      // Add attributes
      cls.attributes.forEach((attr, index) => {
        xmi += `      <ownedAttribute xmi:id="${cls.id}_attr_${index}" name="${attr.name}" type="${attr.type}" visibility="${attr.visibility}"/>\n`
      })

      // Add methods
      cls.methods.forEach((method, index) => {
        xmi += `      <ownedOperation xmi:id="${cls.id}_op_${index}" name="${method.name}" visibility="${method.visibility}">\n`
        xmi += `        <ownedParameter direction="return" type="${method.returnType}"/>\n`
        method.parameters.forEach((param, paramIndex) => {
          xmi += `        <ownedParameter xmi:id="${cls.id}_op_${index}_param_${paramIndex}" name="${param.name}" type="${param.type}"/>\n`
        })
        xmi += `      </ownedOperation>\n`
      })

      xmi += `    </packagedElement>\n`
    })

    // Add relationships
    relationships.forEach((rel) => {
      const relType = rel.relationshipType === "inheritance" ? "uml:Generalization" : "uml:Association"
      xmi += `    <packagedElement xmi:type="${relType}" xmi:id="${rel.id}" general="${rel.targetClassId}" specific="${rel.sourceClassId}"/>\n`
    })

    xmi += `  </uml:Model>
</xmi:XMI>`

    const dataBlob = new Blob([xmi], { type: "application/xml" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.download = `${fileName}.xmi`
    link.href = url
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Export Diagram</DialogTitle>
          <DialogDescription>
            Export your UML class diagram in various formats for documentation, sharing, or further editing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="image" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="image">Image Export</TabsTrigger>
              <TabsTrigger value="data">Data Export</TabsTrigger>
              <TabsTrigger value="uml">UML Export</TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="flex-1 overflow-hidden">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Image Export Settings
                    </CardTitle>
                    <CardDescription>Export your diagram as a high-quality image file</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fileName">File Name</Label>
                        <Input
                          id="fileName"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          placeholder="uml-diagram"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="imageFormat">Format</Label>
                        <Select value={imageFormat} onValueChange={setImageFormat}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="png">PNG (Recommended)</SelectItem>
                            <SelectItem value="jpeg">JPEG</SelectItem>
                            <SelectItem value="svg">SVG (Vector)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {imageFormat !== "svg" && (
                      <div className="space-y-2">
                        <Label htmlFor="imageQuality">Quality</Label>
                        <Select value={imageQuality} onValueChange={setImageQuality}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.8">Standard (0.8)</SelectItem>
                            <SelectItem value="1">High (1.0)</SelectItem>
                            <SelectItem value="2">Ultra High (2.0)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button onClick={exportAsImage} disabled={isExporting} className="w-full">
                      {isExporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export as {imageFormat.toUpperCase()}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="data" className="flex-1 overflow-hidden">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Data Export
                    </CardTitle>
                    <CardDescription>Export diagram data for backup or sharing with other tools</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataFileName">File Name</Label>
                      <Input
                        id="dataFileName"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="uml-diagram"
                      />
                    </div>

                    <Button onClick={exportAsJSON} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export as JSON
                    </Button>

                    <div className="text-sm text-muted-foreground">
                      <p>
                        <strong>JSON Format:</strong> Complete diagram data including classes, relationships, and
                        metadata. Can be imported back into the editor.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="uml" className="flex-1 overflow-hidden">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      UML Standard Export
                    </CardTitle>
                    <CardDescription>Export in standard UML formats compatible with other UML tools</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="umlFileName">File Name</Label>
                      <Input
                        id="umlFileName"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="uml-diagram"
                      />
                    </div>

                    <Button onClick={exportAsXMI} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export as XMI
                    </Button>

                    <div className="text-sm text-muted-foreground">
                      <p>
                        <strong>XMI Format:</strong> XML Metadata Interchange format, the standard for UML model
                        exchange. Compatible with Eclipse UML2, Enterprise Architect, and other UML tools.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
