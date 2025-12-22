"use server"

import { sdk } from "@/lib/config"
import type { HttpTypes } from "@medusajs/types"
import { getAuthHeaders, getCacheOptions } from "./cookies"

export type PricingShippingOption = HttpTypes.StoreCartShippingOption & {
    rules?: any
    seller_id?: string | null
    service_zone?: {
        fulfillment_set?: {
            type?: string
            location?: { address?: HttpTypes.StoreOrderAddress | null }
        }
    }
}

function mkDebugId(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export const listCartShippingMethods = async (cartId: string, _is_return: boolean = false) => {
    const debug_id = mkDebugId("fulfill_list")
    const t0 = Date.now()

    const headers = { ...(await getAuthHeaders()) }
    const next = { ...(await getCacheOptions("fulfillment")) }

    console.log("[storefront][data][fulfillment] listCartShippingMethods:start", {
        debug_id,
        cartId,
    })

    return sdk.client
        .fetch<{ shipping_options: PricingShippingOption[] | null }>(`/store/shipping-options`, {
            method: "GET",
            query: {
                cart_id: cartId,
                fields:
                    "seller_id,+service_zone.fulfillment_set.type,*service_zone.fulfillment_set.location.address,*rules",
            },
            headers,
            next,
            cache: "no-cache",
        })
        .then(({ shipping_options }) => {
            console.log("[storefront][data][fulfillment] listCartShippingMethods:ok", {
                debug_id,
                ms: Date.now() - t0,
                count: shipping_options?.length ?? 0,
                first: shipping_options?.[0] ?? null,
            })
            return shipping_options
        })
        .catch((e: any) => {
            console.error("[storefront][data][fulfillment] listCartShippingMethods:err", {
                debug_id,
                ms: Date.now() - t0,
                message: e?.message,
            })
            return null
        })
}

export const calculatePriceForShippingOption = async (
    option: PricingShippingOption,
    cartId: string,
    data?: Record<string, unknown>
): Promise<HttpTypes.StoreCartShippingOption | null> => {
    const debug_id = mkDebugId("fulfill_calc")
    const t0 = Date.now()

    const headers = { ...(await getAuthHeaders()) }
    const next = { ...(await getCacheOptions("fulfillment")) }

    console.log("[storefront][data][fulfillment] calculatePriceForShippingOption:start", {
        debug_id,
        cartId,
        optionId: option?.id,
        hasData: !!data,
    })

    try {
        const body = { cart_id: cartId, data }

        const { shipping_option } = await sdk.client.fetch<{
            shipping_option: HttpTypes.StoreCartShippingOption
        }>(`/store/shipping-options/${option.id}/calculate`, {
            method: "POST",
            body,
            headers,
            next,
            cache: "no-cache",
        })

        console.log("[storefront][data][fulfillment] calculatePriceForShippingOption:ok", {
            debug_id,
            ms: Date.now() - t0,
            amount: (shipping_option as any)?.amount ?? null,
            currency_code: (shipping_option as any)?.currency_code ?? null,
        })

        return shipping_option
    } catch (e: any) {
        console.error("[storefront][data][fulfillment] calculatePriceForShippingOption:err", {
            debug_id,
            ms: Date.now() - t0,
            message: e?.message,
        })
        return null
    }
}
