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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Plus } from "lucide-react"
import type { UMLClass, UMLAttribute, UMLMethod } from "@/lib/types"

interface EditClassDialogProps {
  isOpen: boolean
  onClose: () => void
  classData: UMLClass | null
  onSave: (classData: UMLClass) => void
}

export function EditClassDialog({ isOpen, onClose, classData, onSave }: EditClassDialogProps) {
  const [name, setName] = useState(classData?.name || "")
  const [stereotype, setStereotype] = useState(classData?.stereotype || "")
  const [attributes, setAttributes] = useState<UMLAttribute[]>(classData?.attributes || [])
  const [methods, setMethods] = useState<UMLMethod[]>(classData?.methods || [])

  const handleSave = () => {
    if (!classData) return

    const updatedClass: UMLClass = {
      ...classData,
      name,
      stereotype,
      attributes,
      methods,
    }

    onSave(updatedClass)
    onClose()
  }

  const addAttribute = () => {
    setAttributes([
      ...attributes,
      {
        name: "newAttribute",
        type: "String",
        visibility: "public",
        isStatic: false,
      },
    ])
  }

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  const updateAttribute = (index: number, field: keyof UMLAttribute, value: any) => {
    const updated = [...attributes]
    updated[index] = { ...updated[index], [field]: value }
    setAttributes(updated)
  }

  const addMethod = () => {
    setMethods([
      ...methods,
      {
        name: "newMethod",
        returnType: "void",
        parameters: [],
        visibility: "public",
        isStatic: false,
        isAbstract: false,
      },
    ])
  }

  const removeMethod = (index: number) => {
    setMethods(methods.filter((_, i) => i !== index))
  }

  const updateMethod = (index: number, field: keyof UMLMethod, value: any) => {
    const updated = [...methods]
    updated[index] = { ...updated[index], [field]: value }
    setMethods(updated)
  }

  if (!classData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
          <DialogDescription>Modify the class properties, attributes, and methods.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Properties */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="className">Class Name</Label>
              <Input id="className" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stereotype">Stereotype (Optional)</Label>
              <Input
                id="stereotype"
                placeholder="e.g., entity, controller"
                value={stereotype}
                onChange={(e) => setStereotype(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="attributes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
              <TabsTrigger value="methods">Methods</TabsTrigger>
            </TabsList>

            <TabsContent value="attributes" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Attributes</h3>
                <Button onClick={addAttribute} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Attribute
                </Button>
              </div>

              <div className="space-y-3">
                {attributes.map((attr, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-3">
                          <Input
                            placeholder="Name"
                            value={attr.name}
                            onChange={(e) => updateAttribute(index, "name", e.target.value)}
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="Type"
                            value={attr.type}
                            onChange={(e) => updateAttribute(index, "type", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Select
                            value={attr.visibility}
                            onValueChange={(value) => updateAttribute(index, "visibility", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                              <SelectItem value="protected">Protected</SelectItem>
                              <SelectItem value="package">Package</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={attr.isStatic}
                            onChange={(e) => updateAttribute(index, "isStatic", e.target.checked)}
                          />
                          <Label className="text-sm">Static</Label>
                        </div>
                        <div className="col-span-2">
                          <Button variant="outline" size="sm" onClick={() => removeAttribute(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="methods" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Methods</h3>
                <Button onClick={addMethod} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Method
                </Button>
              </div>

              <div className="space-y-3">
                {methods.map((method, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-3">
                            <Input
                              placeholder="Method Name"
                              value={method.name}
                              onChange={(e) => updateMethod(index, "name", e.target.value)}
                            />
                          </div>
                          <div className="col-span-3">
                            <Input
                              placeholder="Return Type"
                              value={method.returnType}
                              onChange={(e) => updateMethod(index, "returnType", e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Select
                              value={method.visibility}
                              onValueChange={(value) => updateMethod(index, "visibility", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="private">Private</SelectItem>
                                <SelectItem value="protected">Protected</SelectItem>
                                <SelectItem value="package">Package</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2 flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={method.isStatic}
                              onChange={(e) => updateMethod(index, "isStatic", e.target.checked)}
                            />
                            <Label className="text-xs">Static</Label>
                            <input
                              type="checkbox"
                              checked={method.isAbstract}
                              onChange={(e) => updateMethod(index, "isAbstract", e.target.checked)}
                            />
                            <Label className="text-xs">Abstract</Label>
                          </div>
                          <div className="col-span-2">
                            <Button variant="outline" size="sm" onClick={() => removeMethod(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Parameters: {method.parameters.map((p) => `${p.name}: ${p.type}`).join(", ") || "None"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
