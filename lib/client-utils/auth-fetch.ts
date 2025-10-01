import Cookies from 'js-cookie';

/**
 * Función utilitaria para realizar peticiones fetch desde el lado del cliente (componentes 'use client')
 * incluyendo automáticamente el token JWT de las cookies.
 * @param url La URL interna del API Proxy de Next.js.
 * @param options Opciones de la petición fetch.
 */
export async function fetchWithAuthClient(url: string, options: RequestInit = {}) {
    // Lee la cookie de autenticación que Flask/Next.js guarda al hacer login
    const token = Cookies.get('access_token'); 

    if (!token) {
        console.warn("Authentication token not found in cookies. Redirecting to login.");
        // Redirigir manualmente si es necesario, o dejar que el backend/proxy devuelva el 401
        // window.location.href = '/auth/login'; 
        // Si no hay token, la petición fallará con 401, que es lo esperado.
    }

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (token) {
        // Añade el token al encabezado de Authorization
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, {
        ...options,
        headers,
        // Por defecto, usa POST si no se especifica
        method: options.method || 'POST', 
    });

    if (response.status === 401) {
        console.error("Authentication failed. Redirecting to login.");
        // Usamos window.location.href en el cliente para forzar la redirección fuera del contexto de ReactFlow
        window.location.href = '/auth/login'; 
        // Lanza un error para detener el flujo de guardado
        throw new Error("Unauthorized"); 
    }

    return response;
}