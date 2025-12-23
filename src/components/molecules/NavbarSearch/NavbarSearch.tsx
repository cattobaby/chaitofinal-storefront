// storefront/src/components/molecules/NavbarSearch/NavbarSearch.tsx
"use client"

import { useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SearchIcon } from "@/icons"
import { Camera, Spinner } from "@medusajs/icons"

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/heic"]

export const NavbarSearch = () => {
    const searchParams = useSearchParams()
    const router = useRouter()

    // Texto de búsqueda normal
    const [search, setSearch] = useState(searchParams.get("query") || "")

    // Estado para búsqueda visual
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)

    // Submit de texto
    const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (search.trim()) {
            router.push(`/categories?query=${encodeURIComponent(search.trim())}`)
        } else {
            router.push(`/categories`)
        }
    }

    // Handler de archivo (VisualSearch original + publishable key)
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!ACCEPTED_TYPES.includes(file.type)) {
            alert("Sube una imagen válida (PNG, JPG, WEBP)")
            return
        }

        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append("image", file)

            const backendUrl =
                process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

            const publishableKey =
                process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

            if (!publishableKey) {
                console.warn(
                    "[visual search] Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY, request may fail"
                )
            }

            const response = await fetch(
                `${backendUrl}/store/vision-search?limit=20`,
                {
                    method: "POST",
                    headers: {
                        "x-publishable-api-key": publishableKey,
                    },
                    body: formData,
                }
            )

            if (!response.ok) {
                throw new Error("No se pudo realizar la búsqueda")
            }

            const data = await response.json()

            if (data.matches && data.matches.length > 0) {
                const ids = data.matches.map((m: any) => m.id).join(",")
                router.push(`/categories?visual_ids=${ids}`)
            } else {
                alert("No se encontraron productos similares.")
            }
        } catch (err) {
            console.error("Visual search error", err)
            alert("Ocurrió un error al buscar por imagen.")
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    return (
        <form className="w-full" method="POST" onSubmit={submitHandler}>
            {/* input hidden para la cámara */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFileSelect}
            />

            {/* Pastilla completa */}
            <div className="flex w-full items-center rounded-full bg-white px-4 py-2.5 shadow-sm">
                {/* Texto a la izquierda */}
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar en Chaito..."
                    className="flex-1 bg-transparent text-sm md:text-base text-neutral-900 placeholder:text-neutral-400 outline-none border-none"
                />

                {/* Íconos a la derecha, dentro de la misma pastilla */}
                <div className="flex items-center gap-3 pl-3">
                    {/* Botón buscar */}
                    <button
                        type="submit"
                        className="text-neutral-500 hover:text-brand-700 transition-colors"
                        aria-label="Buscar"
                    >
                        <SearchIcon className="w-5 h-5" />
                    </button>

                    {/* Botón cámara */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-neutral-500 hover:text-brand-700 transition-colors disabled:opacity-60"
                        aria-label="Buscar por imagen"
                        title="Buscar por imagen"
                    >
                        {isUploading ? (
                            <Spinner className="w-5 h-5 animate-spin" />
                        ) : (
                            <Camera className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </form>
    )
}
