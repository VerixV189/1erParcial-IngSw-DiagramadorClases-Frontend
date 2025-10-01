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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, Zap, Loader2 } from "lucide-react"
import type { UMLClass, UMLRelationship } from "@/lib/types"
// TypeScript type for SpeechRecognition (for browsers)
type SpeechRecognitionType = typeof window.SpeechRecognition extends undefined
  ? typeof window.webkitSpeechRecognition
  : typeof window.SpeechRecognition;

type SpeechRecognition = InstanceType<SpeechRecognitionType>;

interface AIGenerationDialogProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (classes: UMLClass[], relationships: UMLRelationship[]) => void
}

export function AIGenerationDialog({ isOpen, onClose, onGenerate }: AIGenerationDialogProps) {
  const [textPrompt, setTextPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)

  const handleTextGeneration = async () => {
    if (!textPrompt.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/ai/generate-uml", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: textPrompt,
          type: "text",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate UML")
      }

      const data = await response.json()

      // Transform the data to match our types and add positioning
      const classes: UMLClass[] = data.classes.map((cls: any, index: number) => ({
        ...cls,
        position: {
          x: 100 + (index % 3) * 300,
          y: 100 + Math.floor(index / 3) * 200,
        },
      }))

      onGenerate(classes, data.relationships)
      onClose()
      setTextPrompt("")
    } catch (error) {
      console.error("Error generating UML:", error)
      // You could add a toast notification here
    } finally {
      setIsGenerating(false)
    }
  }

  const startVoiceRecording = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser")
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsRecording(true)
    }

    recognition.onresult = (event) => {
      let finalTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      if (finalTranscript) {
        setTextPrompt((prev) => prev + " " + finalTranscript)
      }
    }

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.start()
    setRecognition(recognition)
  }

  const stopVoiceRecording = () => {
    if (recognition) {
      recognition.stop()
      setRecognition(null)
    }
    setIsRecording(false)
  }

  const examplePrompts = [
    "Create a simple e-commerce system with User, Product, Order, and OrderItem classes",
    "Design a library management system with Book, Author, Member, and Loan classes",
    "Build a social media platform with User, Post, Comment, and Like classes",
    "Create a banking system with Account, Customer, Transaction, and Bank classes",
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>AI UML Generation</DialogTitle>
          <DialogDescription>
            Describe your system in natural language or use voice input to generate UML class diagrams automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="text" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Text Input</TabsTrigger>
              <TabsTrigger value="voice">Voice Input</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex-1">
                  <Label htmlFor="textPrompt">Describe your system</Label>
                  <Textarea
                    id="textPrompt"
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    placeholder="Describe the classes, relationships, and functionality you want to model..."
                    className="min-h-[200px] mt-2"
                  />
                </div>

                {/* <div className="space-y-2">
                  <Label>Example prompts:</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {examplePrompts.map((prompt, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setTextPrompt(prompt)}
                      >
                        <CardContent className="p-3">
                          <p className="text-sm text-muted-foreground">{prompt}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div> */}
              </div>
            </TabsContent>

            <TabsContent value="voice" className="flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Voice Input</CardTitle>
                    <CardDescription>Click the microphone to start recording your description</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    <Button
                      variant={isRecording ? "destructive" : "default"}
                      size="lg"
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      className="w-32 h-32 rounded-full"
                    >
                      {isRecording ? <MicOff className="h-12 w-12" /> : <Mic className="h-12 w-12" />}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      {isRecording ? "Recording... Click to stop" : "Click to start recording"}
                    </p>
                  </CardContent>
                </Card>

                <div className="flex-1">
                  <Label htmlFor="voiceTranscript">Transcribed text</Label>
                  <Textarea
                    id="voiceTranscript"
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    placeholder="Your speech will appear here..."
                    className="min-h-[200px] mt-2"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleTextGeneration} disabled={!textPrompt.trim() || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate UML
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
