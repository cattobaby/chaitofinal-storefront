"use client"

import React, { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Spinner } from "@medusajs/icons"

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/heic"]

export const VisualSearch = () => {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!ACCEPTED_TYPES.includes(file.type)) {
            alert("Sube una imagen válida (PNG, JPG, WEBP)")
            return
        }

        setIsUploading(true)

        try {
            // Use FormData for multipart upload
            const formData = new FormData()
            formData.append("image", file) // Field name must match backend 'image'

            const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

            // Call the new local vision route
            const response = await fetch(`${backendUrl}/store/vision-search?limit=20`, {
                method: "POST",
                // Do NOT set Content-Type header manually for FormData, browser does it
                body: formData,
            })

            if (!response.ok) {
                throw new Error("No se pudo realizar la búsqueda")
            }

            const data = await response.json()

            if (data.matches && data.matches.length > 0) {
                // Extract IDs and redirect
                const ids = data.matches.map((m: any) => m.id).join(",")
                router.push(`/categories?visual_ids=${ids}`)
            } else {
                alert("No se encontraron productos similares.")
            }

            // Reset
            setIsUploading(false)
            if (inputRef.current) inputRef.current.value = ""

        } catch (error) {
            console.error("Visual search error", error)
            setIsUploading(false)
            alert("Ocurrió un error al buscar por imagen.")
        }
    }

    return (
        <div className="relative flex items-center">
            <input
                type="file"
                ref={inputRef}
                className="hidden"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFileSelect}
            />

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className="p-2 text-neutral-500 hover:text-brand-700 transition-colors"
                title="Buscar por imagen"
            >
                {isUploading ? (
                    <Spinner className="animate-spin" />
                ) : (
                    <Camera className="w-5 h-5" />
                )}
            </button>
        </div>
    )
}
