"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FLASK_API_BASE_URL } from "@/lib/api" 

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${FLASK_API_BASE_URL}/auth/registrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Campos que Flask espera según AuthRegisterSchemaBody
          nombre: name, 
          email: email,
          password: password,
        }),
      })

      // Verificar si la respuesta fue exitosa (código 201 CREATED esperado)
      if (response.status === 201) {
        // Registro exitoso
        router.push("/auth/login?message=Registro exitoso. Por favor, inicia sesión.")
        
      } else {
        // Manejar errores como usuario ya existente (400) o error de validación
        const errorData = await response.json();
        
        let errorMessage = "Ocurrió un error desconocido durante el registro.";
        
        if (errorData.phrase) {
            // Manejo de GenericError de Flask (ej: "El usuario ya está registrado")
            errorMessage = errorData.phrase + (errorData.description ? `: ${errorData.description}` : '');
        } else if (errorData.errors) {
            // Manejo de ValidationError de Marshmallow
            // Simplemente mostramos el primer error encontrado
            const keys = Object.keys(errorData.errors);
            if (keys.length > 0) {
                errorMessage = `${keys[0]}: ${errorData.errors[keys[0]][0]}`;
            }
        } else if (errorData.msg) {
             // Manejo de 500 limpio de Flask
             errorMessage = errorData.msg;
        }

        setError(errorMessage);
      }
    } catch (error: unknown) {
        // Esto captura errores de red (servidor Flask caído o inaccesible)
      console.error("Error al conectar con el servidor de autenticación:", error);
      setError("Error de conexión. Asegúrate de que el servidor Flask esté activo en " + FLASK_API_BASE_URL);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>Join UML Class Diagram Builder and start creating professional diagrams</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="underline underline-offset-4">
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
