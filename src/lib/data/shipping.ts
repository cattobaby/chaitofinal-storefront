/* storefront/src/lib/data/shipping.ts */
"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import type { HttpTypes } from "@medusajs/types"

function mkDebugId(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export type DeliveryRecommendation = {
    stock_location_id: string
    stock_location_name: string
    distance_km: number
    amount: number // minor units (informativo)
    currency_code: string

    shipping_option_id?: string | null
    shipping_option_name?: string | null
    provider_id?: string | null

    // compat extra
    optionId?: string | null
    optionName?: string | null
}

export type PickupLocation = {
    stock_location_id: string
    stock_location_name: string
    stock_location_gps: { lat: number; lng: number } | null

    shipping_option_id: string
    shipping_option_name: string
    provider_id: string

    enabled_in_store: string
    distance_km: number | null
}

export async function recommendDelivery(cartId: string): Promise<DeliveryRecommendation | null> {
    const debug_id = mkDebugId("ship_reco")
    const t0 = Date.now()

    const headers = { ...(await getAuthHeaders()) }
    const next = { ...(await getCacheOptions("fulfillment")) }

    console.log("[storefront][data][shipping] recommendDelivery:start", {
        debug_id,
        cartId,
    })

    try {
        const res = await sdk.client.fetch<DeliveryRecommendation>(`/storeapp/shipping/delivery/recommend`, {
            method: "POST",
            body: { cart_id: cartId },
            headers,
            next,
            cache: "no-cache",
        })

        console.log("[storefront][data][shipping] recommendDelivery:ok", {
            debug_id,
            ms: Date.now() - t0,
            stock_location_id: res?.stock_location_id,
            distance_km: res?.distance_km,
            amount: res?.amount,
            currency_code: res?.currency_code,
            shipping_option_id: (res as any)?.shipping_option_id ?? null,
            provider_id: (res as any)?.provider_id ?? null,
        })

        return res
    } catch (e: any) {
        console.error("[storefront][data][shipping] recommendDelivery:err", {
            debug_id,
            ms: Date.now() - t0,
            message: e?.message || e,
        })
        return null
    }
}

export async function calculateShippingOptionQuote(args: {
    cartId: string
    optionId: string
    data?: Record<string, unknown>
}): Promise<{ amount: number; currency_code?: string } | null> {
    const debug_id = mkDebugId("ship_calc")
    const t0 = Date.now()

    const { cartId, optionId, data } = args
    const headers = { ...(await getAuthHeaders()) }
    const next = { ...(await getCacheOptions("fulfillment")) }

    console.log("[storefront][data][shipping] calculateShippingOptionQuote:start", {
        debug_id,
        cartId,
        optionId,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
    })

    if (!cartId || !optionId) return null

    try {
        const { shipping_option } = await sdk.client.fetch<{
            shipping_option: HttpTypes.StoreCartShippingOption
        }>(`/store/shipping-options/${optionId}/calculate`, {
            method: "POST",
            body: { cart_id: cartId, data },
            headers,
            next,
            cache: "no-cache",
        })

        const amount = (shipping_option as any)?.amount
        const currency_code = (shipping_option as any)?.currency_code

        const out = {
            amount: typeof amount === "number" ? amount : 0,
            currency_code: typeof currency_code === "string" ? currency_code : undefined,
        }

        console.log("[storefront][data][shipping] calculateShippingOptionQuote:ok", {
            debug_id,
            ms: Date.now() - t0,
            out,
        })

        return out
    } catch (e: any) {
        console.error("[storefront][data][shipping] calculateShippingOptionQuote:err", {
            debug_id,
            ms: Date.now() - t0,
            message: e?.message || e,
        })
        return null
    }
}

/**
 * ✅ Pickup locations (OVERRIDE) — usa /storeapp/shipping/pickup/recommend
 * Fallback: /storeapp/shipping/pickup/locations (legacy)
 */
export async function listPickupLocations(cartId: string): Promise<PickupLocation[]> {
    const debug_id = mkDebugId("ship_pickups")
    const t0 = Date.now()

    const headers = { ...(await getAuthHeaders()) }
    const next = { ...(await getCacheOptions("fulfillment")) }

    console.log("[storefront][data][shipping] listPickupLocations:start", {
        debug_id,
        cartId,
    })

    // 1) Nuevo override endpoint
    try {
        const res = await sdk.client.fetch<any>(`/storeapp/shipping/pickup/recommend`, {
            method: "POST",
            body: { cart_id: cartId },
            headers,
            next,
            cache: "no-cache",
        })

        // ✅ soporta ambos shapes:
        // - nuevo: { pickup_locations: [...] }
        // - viejo: { stock_location_id, stock_location_name, shipping_option_id, ... }
        const locs: PickupLocation[] =
            Array.isArray(res?.pickup_locations) ? res.pickup_locations
                : (res?.stock_location_id && res?.shipping_option_id)
                    ? [{
                        stock_location_id: String(res.stock_location_id),
                        stock_location_name: String(res.stock_location_name || res.stock_location_id),
                        stock_location_gps: res?.stock_location_gps ?? null,
                        shipping_option_id: String(res.shipping_option_id),
                        shipping_option_name: String(res.shipping_option_name || "Pickup"),
                        provider_id: String(res.provider_id || "manual_manual"),
                        enabled_in_store: "true",
                        distance_km: typeof res?.distance_km === "number" ? res.distance_km : null,
                    }]
                    : []

        console.log("[storefront][data][shipping] listPickupLocations:ok (recommend)", {
            debug_id,
            ms: Date.now() - t0,
            count: locs.length,
            first: locs[0] ?? null,
            rawKeys: res ? Object.keys(res) : [],
        })

        return locs
    } catch (e: any) {
        console.error("[storefront][data][shipping] listPickupLocations:recommend err → fallback legacy", {
            debug_id,
            ms: Date.now() - t0,
            message: e?.message || e,
        })
    }

    // 2) Fallback legacy GET
    try {
        const res = await sdk.client.fetch<{ pickup_locations: PickupLocation[] }>(
            `/storeapp/shipping/pickup/locations`,
            {
                method: "GET",
                query: { cart_id: cartId },
                headers,
                next,
                cache: "no-cache",
            }
        )

        console.log("[storefront][data][shipping] listPickupLocations:ok (legacy)", {
            debug_id,
            ms: Date.now() - t0,
            count: res?.pickup_locations?.length ?? 0,
            first: res?.pickup_locations?.[0] ?? null,
        })

        return res.pickup_locations || []
    } catch (e: any) {
        console.error("[storefront][data][shipping] listPickupLocations:legacy err", {
            debug_id,
            ms: Date.now() - t0,
            message: e?.message || e,
        })
        return []
    }
}
