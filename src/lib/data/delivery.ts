"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"

const DELIVERY_OPTION_ID = process.env.NEXT_PUBLIC_DELIVERY_OPTION_ID

export type DeliveryQuote = {
    option_id: string
    amount: number
    currency_code: string
}

/**
 * Get distance-based delivery price for the current cart
 * using the single platform delivery option.
 */
export async function getDeliveryQuote(cartId: string): Promise<DeliveryQuote | null> {
    console.log("[getDeliveryQuote] called with cartId:", cartId)
    console.log("[getDeliveryQuote] DELIVERY_OPTION_ID:", DELIVERY_OPTION_ID)

    if (!DELIVERY_OPTION_ID) {
        console.warn(
            "[getDeliveryQuote] NEXT_PUBLIC_DELIVERY_OPTION_ID is NOT set in the Node env"
        )
        return null
    }

    const headers = {
        ...(await getAuthHeaders()),
    }

    const next = {
        ...(await getCacheOptions("fulfillment")),
    }

    try {
        console.log(
            "[getDeliveryQuote] Requesting distance price from /storeapp/shipping/calculate-distance"
        )

        const res = await sdk.client.fetch<{
            amount: number
            currency_code: string
            stock_location_id?: string
            distance_km?: number
        }>(`/storeapp/shipping/calculate-distance`, {
            method: "POST",
            body: {
                cart_id: cartId,
                option_id: DELIVERY_OPTION_ID,
            },
            headers,
            next,
            cache: "no-cache",
        })

        console.log("[getDeliveryQuote] Response:", res)

        return {
            option_id: DELIVERY_OPTION_ID,
            amount: res.amount,
            currency_code: res.currency_code,
        }
    } catch (e: any) {
        console.error(
            "[getDeliveryQuote] ERROR calling /storeapp/shipping/calculate-distance:",
            e?.message || e
        )
        return null
    }
}
