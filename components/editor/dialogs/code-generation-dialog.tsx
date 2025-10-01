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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Copy, Download, FileCode, Database } from "lucide-react"
import { SpringBootGenerator, type GeneratedCode } from "@/lib/code-generators/spring-boot-generator"
import { SQLGenerator } from "@/lib/code-generators/sql-generator"
import type { UMLClass, UMLRelationship } from "@/lib/types"

interface CodeGenerationDialogProps {
  isOpen: boolean
  onClose: () => void
  classes: UMLClass[]
  relationships: UMLRelationship[]
}

export function CodeGenerationDialog({ isOpen, onClose, classes, relationships }: CodeGenerationDialogProps) {
  const [packageName, setPackageName] = useState("com.example.demo")
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode[]>([])
  const [generatedSQL, setGeneratedSQL] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateSpringBoot = async () => {
    setIsGenerating(true)
    try {
      const generator = new SpringBootGenerator(classes, relationships, packageName)
      const code = generator.generateAll()
      setGeneratedCode(code)
    } catch (error) {
      console.error("Error generating Spring Boot code:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateSQL = async () => {
    setIsGenerating(true)
    try {
      const generator = new SQLGenerator(classes, relationships)
      const sql = generator.generateCreateTables()
      setGeneratedSQL(sql)
    } catch (error) {
      console.error("Error generating SQL:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAllFiles = () => {
    generatedCode.forEach((file) => {
      downloadFile(file.content, file.fileName)
    })
  }

  const getLayerColor = (layer: string) => {
    switch (layer) {
      case "entity":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
      case "repository":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
      case "service":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
      case "controller":
        return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Code Generation</DialogTitle>
          <DialogDescription>
            Generate Spring Boot application code and SQL schema from your UML class diagram.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="springboot" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="springboot">Spring Boot Code</TabsTrigger>
              <TabsTrigger value="sql">SQL Schema</TabsTrigger>
            </TabsList>

            <TabsContent value="springboot" className="flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="packageName">Package Name</Label>
                    <Input
                      id="packageName"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      placeholder="com.example.demo"
                    />
                  </div>
                  <Button onClick={handleGenerateSpringBoot} disabled={isGenerating} className="mt-6">
                    <FileCode className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generating..." : "Generate Code"}
                  </Button>
                </div>

                {generatedCode.length > 0 && (
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Generated Files: {generatedCode.length}</span>
                        <div className="flex gap-1">
                          {["entity", "repository", "service", "controller"].map((layer) => (
                            <Badge key={layer} variant="outline" className={getLayerColor(layer)}>
                              {layer}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button onClick={downloadAllFiles} size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download All
                      </Button>
                    </div>

                    <ScrollArea className="h-[400px] border rounded-md">
                      <div className="p-4 space-y-4">
                        {generatedCode.map((file, index) => (
                          <Card key={index}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-sm">{file.fileName}</CardTitle>
                                  <Badge variant="outline" className={getLayerColor(file.layer)}>
                                    {file.layer}
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(file.content)}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadFile(file.content, file.fileName)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                                <code>{file.content}</code>
                              </pre>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sql" className="flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <Button onClick={handleGenerateSQL} disabled={isGenerating}>
                    <Database className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generating..." : "Generate SQL Schema"}
                  </Button>
                  {generatedSQL && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedSQL)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy SQL
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadFile(generatedSQL, "schema.sql")}>
                        <Download className="h-4 w-4 mr-2" />
                        Download SQL
                      </Button>
                    </div>
                  )}
                </div>

                {generatedSQL && (
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[500px] border rounded-md">
                      <div className="p-4">
                        <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                          <code>{generatedSQL}</code>
                        </pre>
                      </div>
                    </ScrollArea>
                  </div>
                )}
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