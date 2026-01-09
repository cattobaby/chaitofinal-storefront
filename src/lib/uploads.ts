import { getAuthHeaders } from "./data/cookies"

// Asegúrate de que esta variable apunte a tu backend (http://localhost:9000)
const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

type PresignResp = {
    mode: "s3" | "local"
    uploadUrl: string
    key?: string
    publicUrl?: string
    method: "PUT"
    headers?: Record<string, string>
}

export async function uploadImage(file: File) {
    // 1. Pedir URL firmada al backend
    // Usamos el endpoint público que ya configuramos
    const presignRes = await fetch(`${BACKEND_URL}/public/uploads-presign`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // Si requieres la API key pública en el backend
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
        body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            size: file.size,
        }),
    })

    if (!presignRes.ok) {
        throw new Error("Error obteniendo permiso de subida")
    }

    const presign: PresignResp = await presignRes.json()

    // 2. Subir el archivo real a S3 (o MinIO)
    const uploadRes = await fetch(presign.uploadUrl, {
        method: presign.method,
        headers: presign.headers,
        body: file,
    })

    if (!uploadRes.ok) {
        throw new Error("Error subiendo la imagen")
    }

    // 3. Retornar la Key (para guardar en BD) y la URL pública (para preview si fuera necesario)
    return {
        key: presign.key,
        url: presign.publicUrl
    }
}