"use server"
import { revalidatePath } from "next/cache"
import { fetchQuery } from "../config"
import { getAuthHeaders } from "./cookies"
import { HttpTypes } from "@medusajs/types"

export type Review = {
    id: string
    seller: {
        id: string
        name: string
        photo: string
    }
    reference: string
    customer_note: string
    rating: number
    updated_at: string
    metadata?: {
        images?: string[]
    }
}

export type Order = HttpTypes.StoreOrder & {
    seller: { id: string; name: string; reviews?: any[] }
    reviews: any[]
}

type CreateReviewInput = {
    order_id: string
    reference: string
    rating: number
    customer_note?: string
    images?: string[]
}

// Helper para obtener reviews de forma segura
const getReviews = async () => {
    try {
        const headers = {
            ...(await getAuthHeaders()),
        }

        const res = await fetchQuery("/store/reviews", {
            headers,
            method: "GET",
            query: { fields: "*seller,+customer.id,+order_id" },
        })

        return { ok: true, data: res }
    } catch (error) {
        console.error("[getReviews] Error:", error)
        return { ok: false, data: { reviews: [] } }
    }
}

// Acción para crear review con soporte de imágenes en metadata
const createReview = async (review: CreateReviewInput) => {
    try {
        const headers = {
            ...(await getAuthHeaders()),
            "Content-Type": "application/json",
            "x-publishable-api-key": process.env
                .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
        }

        // FIX: Separamos 'images' del resto de propiedades.
        // Así evitamos enviarlo en la raíz del payload y causar error 400.
        const { images, ...restOfReview } = review

        const payload = {
            ...restOfReview, // Enviamos rating, order_id, notes, etc.
            metadata: {
                // Guardamos las keys de las imágenes aquí dentro
                images: images || []
            }
        }

        const response = await fetch(
            `${process.env.MEDUSA_BACKEND_URL}/store/reviews`,
            {
                headers,
                method: "POST",
                body: JSON.stringify(payload),
            }
        )

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.message || "Failed to create review")
        }

        revalidatePath("/user/reviews")
        revalidatePath("/user/reviews/written")

        return await response.json()
    } catch (e: any) {
        console.error("[createReview] Error:", e)
        return { error: e.message || "Unknown error" }
    }
}

export { getReviews, createReview }