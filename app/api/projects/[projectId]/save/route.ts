import { type NextRequest, NextResponse } from "next/server"
import { FLASK_API_BASE_URL } from "@/lib/api";

export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    // 1. Obtener el token JWT del encabezado de la solicitud
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    // El cuerpo de la solicitud ya contiene { classes, relationships }
    const requestBody = await request.json();

    // 2. Definir el endpoint de Flask al aque haremos proxy
    const flaskSaveUrl = `${FLASK_API_BASE_URL}/projects/${params.projectId}/save`;

    // 3. Reenviar la solicitud a Flask, incluyendo el token JWT
    const flaskResponse = await fetch(flaskSaveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Reenviamos el token de autenticación
        'Authorization': authHeader,
      },
      body: JSON.stringify(requestBody),
    });

    // 4. Leer la respuesta de Flask. Usamos .json() incluso para errores.
    const data = await flaskResponse.json();

    // 5. Devolver la respuesta de Flask al cliente, manteniendo el código de estado HTTP
    if (!flaskResponse.ok) {
        console.error(`Error from Flask (${flaskResponse.status}) during project save:`, data);
    }
    
    return NextResponse.json(data, { status: flaskResponse.status });
    
  } catch (error) {
    console.error("Error saving project via proxy or connecting to Flask:", error);
    // Esto captura errores de red (Flask caído o URL incorrecta)
    return NextResponse.json({ error: "Internal server error: Flask connection failed" }, { status: 500 });
  }
}
