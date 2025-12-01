"use server"
import { Wishlist } from "@/types/wishlist"
import { sdk } from "../config"
import { getAuthHeaders } from "./cookies"
import { revalidatePath } from "next/cache"

export const getUserWishlists = async (): Promise<{
    wishlists: Wishlist[]
    count: number
}> => {
    const headers = {
        ...(await getAuthHeaders()),
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env
            .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
    }

    try {
        const res = await sdk.client.fetch<{ wishlists: Wishlist[]; count: number }>(
            `/store/wishlist`,
            {
                cache: "no-cache",
                headers,
                method: "GET",
            }
        )

        // Normal successful case
        return {
            wishlists: res.wishlists ?? [],
            count: res.count ?? res.wishlists?.length ?? 0,
        }
    } catch (e: any) {
        // ❗ Backend is returning 500 here when unauthenticated (actor_id undefined)
        // Instead of crashing the whole page, just behave as "no wishlist yet".
        console.error("Failed to load wishlist, returning empty list instead", e?.message || e)

        return {
            wishlists: [],
            count: 0,
        }
    }
}

export const addWishlistItem = async ({
                                          reference_id,
                                          reference,
                                      }: {
    reference_id: string
    reference: "product"
}) => {
    const headers = {
        ...(await getAuthHeaders()),
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env
            .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
    }

    await fetch(`${process.env.MEDUSA_BACKEND_URL}/store/wishlist`, {
        headers,
        method: "POST",
        body: JSON.stringify({
            reference,
            reference_id,
        }),
    })

    revalidatePath("/wishlist")
}

export const removeWishlistItem = async ({
                                             wishlist_id,
                                             product_id,
                                         }: {
    wishlist_id: string
    product_id: string
}) => {
    const headers = {
        ...(await getAuthHeaders()),
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env
            .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
    }

    await fetch(
        `${process.env.MEDUSA_BACKEND_URL}/store/wishlist/${wishlist_id}/product/${product_id}`,
        {
            headers,
            method: "DELETE",
        }
    )

    revalidatePath("/wishlist")
}
