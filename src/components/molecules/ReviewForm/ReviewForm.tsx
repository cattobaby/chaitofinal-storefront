"use client"
import {
    FieldError,
    FieldValues,
    FormProvider,
    useForm,
    useFormContext,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { reviewSchema, ReviewFormData } from "./schema"
import { Button } from "@/components/atoms"
import { InteractiveStarRating } from "@/components/atoms/InteractiveStarRating/InteractiveStarRating"
import { useState, useRef } from "react" // <--- Agregamos useRef
import { cn } from "@/lib/utils"
import { createReview, Order } from "@/lib/data/reviews"
// --- NUEVOS IMPORTS ---
import { uploadImage } from "@/lib/uploads"
import { Photo, XMark, Spinner } from "@medusajs/icons"

interface Props {
    handleClose?: () => void
    seller: Order
}

export const ReviewForm: React.FC<Props> = ({ ...props }) => {
    const methods = useForm<ReviewFormData>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            sellerId: "",
            rating: 0,
            opinion: "",
        },
    })

    return (
        <FormProvider {...methods}>
            <Form {...props} />
        </FormProvider>
    )
}

const Form: React.FC<Props> = ({ handleClose, seller }) => {
    const [error, setError] = useState<string>()

    // --- NUEVOS ESTADOS PARA IMÁGENES ---
    const [files, setFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        watch,
        handleSubmit,
        register,
        setValue,
        formState: { errors },
    } = useFormContext()

    // Manejador de selección de archivos
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
            // Limitamos a 5 fotos máximo, por ejemplo
            setFiles((prev) => [...prev, ...newFiles].slice(0, 5))
        }
    }

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const submit = async (data: FieldValues) => {
        setIsUploading(true)
        setError("")

        try {
            // 1. Subir imágenes a S3 en paralelo (si existen)
            let imageKeys: string[] = []

            if (files.length > 0) {
                try {
                    const uploadResults = await Promise.all(
                        files.map((file) => uploadImage(file))
                    )
                    // Obtenemos solo las keys
                    imageKeys = uploadResults.map((res) => res.key!)
                } catch (e) {
                    console.error("Error subiendo imágenes", e)
                    setError("Error al subir las imágenes. Intenta de nuevo.")
                    setIsUploading(false)
                    return
                }
            }

            // 2. Crear la reseña con las keys en metadata
            const body = {
                order_id: seller.id,
                rating: data.rating,
                reference: "seller", // O "product" si estás reseñando productos individuales
                reference_id: seller.seller.id, // Ojo aquí: revisa si reviews.ts espera esto o lo saca del order
                customer_note: data.opinion,
                images: imageKeys // <--- Enviamos las keys al backend
            }

            const response = await createReview(body)

            if (response.error) {
                setError("Ocurrió un error al guardar la reseña")
                return
            }

            // Éxito
            handleClose && handleClose()

        } catch (e) {
            setError("Error inesperado")
        } finally {
            setIsUploading(false)
        }
    }

    const lettersCount = watch("opinion")?.length || 0
    const rating = watch("rating")

    return (
        <form onSubmit={handleSubmit(submit)}>
            <div className="px-4 space-y-4">
                <div className="max-w-full grid grid-cols-1 items-top gap-4 mb-4">

                    {/* Calificación */}
                    <div>
                        <label className="label-sm block mb-2">Calificación</label>
                        <InteractiveStarRating
                            value={rating}
                            onChange={(value) => setValue("rating", value, { shouldValidate: true })}
                            error={!!errors.rating}
                        />
                        {errors.rating?.message && (
                            <p className="label-sm text-negative mt-1">
                                {(errors.rating as FieldError).message}
                            </p>
                        )}
                    </div>

                    {/* Opinión */}
                    <label className={cn("label-sm block relative")}>
                        <p className={cn(error && "text-negative")}>Tu opinión</p>
                        <textarea
                            className={cn(
                                "w-full px-4 py-3 h-32 border rounded-sm bg-component-secondary focus:border-primary focus:outline-none focus:ring-0 relative",
                                error && "border-negative focus:border-negative"
                            )}
                            placeholder="Escribe tu opinión sobre este vendedor..."
                            {...register("opinion")}
                        />
                        <div
                            className={cn(
                                "absolute right-4 label-medium text-secondary",
                                errors.opinion?.message ? "bottom-8" : "bottom-3 "
                            )}
                        >
                            {`${lettersCount} / 300`}
                        </div>
                        {errors.opinion?.message && (
                            <p className="label-sm text-negative">
                                {(errors.opinion as FieldError).message}
                            </p>
                        )}
                    </label>

                    {/* --- SECCIÓN DE FOTOS --- */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="label-sm">Fotos (Opcional)</label>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="text-xs text-primary underline flex items-center gap-1 hover:text-primary/80 disabled:opacity-50"
                            >
                                <Photo /> Adjuntar
                            </button>
                        </div>

                        {/* Input oculto */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                        />

                        {/* Previsualización */}
                        {files.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {files.map((file, idx) => (
                                    <div key={idx} className="relative w-16 h-16 border rounded overflow-hidden group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeFile(idx)}
                                            disabled={isUploading}
                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XMark className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {error && <p className="label-md text-negative">{error}</p>}

                <Button className="w-full" disabled={isUploading}>
                    {isUploading ? (
                        <div className="flex items-center gap-2">
                            <Spinner className="animate-spin" /> ENVIANDO...
                        </div>
                    ) : (
                        "ENVIAR RESEÑA"
                    )}
                </Button>
            </div>
        </form>
    )
}