"use server"

import { sdk } from "@/lib/config"
import type { HttpTypes } from "@medusajs/types"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import {
    isDistancePricingOption,
    type PricingShippingOptionWithRules,
} from "../shipping-rules"

/**
 * We don’t need the full storefront type here, just the cart shipping option shape.
 * The `rules` field is where we’ll look for distance_pricing.
 */
export type PricingShippingOption = PricingShippingOptionWithRules

export const listCartShippingMethods = async (
    cartId: string,
    _is_return: boolean = false
) => {
    const headers = {
        ...(await getAuthHeaders()),
    }

    const next = {
        ...(await getCacheOptions("fulfillment")),
    }

    return sdk.client
        .fetch<{ shipping_options: PricingShippingOption[] | null }>(
            `/store/shipping-options`,
            {
                method: "GET",
                query: {
                    cart_id: cartId,
                    fields:
                        "seller_id,+service_zone.fulfillment_set.type,*service_zone.fulfillment_set.location.address,*rules",
                },
                headers,
                next,
                cache: "no-cache",
            }
        )
        .then(({ shipping_options }) => shipping_options)
        .catch(() => {
            return null
        })
}

/**
 * Unified price calculator:
 *
 * - If the option has distance_pricing === "true" → call our custom distance endpoint.
 * - Otherwise → use the default Medusa calculate endpoint.
 *
 * Returns something shaped like a StoreCartShippingOption, but we really only
 * rely on `id` and `amount` in the UI.
 */
export const calculatePriceForShippingOption = async (
    option: PricingShippingOption,
    cartId: string,
    data?: Record<string, unknown>
): Promise<HttpTypes.StoreCartShippingOption | null> => {
    const headers = {
        ...(await getAuthHeaders()),
    }

    const next = {
        ...(await getCacheOptions("fulfillment")),
    }

    try {
        // ---- Distance-based pricing path ----
        if (isDistancePricingOption(option)) {
            const body = {
                cart_id: cartId,
                option_id: option.id,
                ...(data || {}),
            }

            const res = await sdk.client.fetch<{
                amount: number
                currency_code: string
                stock_location_id?: string
                distance_km?: number
            }>(`/storeapp/shipping/calculate-distance`, {
                method: "POST",
                body,
                headers,
                next,
                cache: "no-cache",
            })

            // Minimal shape – we only really need id + amount (+ currency_code)
            return {
                id: option.id,
                amount: res.amount,
                currency_code: res.currency_code,
            } as unknown as HttpTypes.StoreCartShippingOption
        }

        // ---- Default Medusa calculated pricing path ----
        const body = {
            cart_id: cartId,
            data,
        }

        const { shipping_option } = await sdk.client.fetch<{
            shipping_option: HttpTypes.StoreCartShippingOption
        }>(`/store/shipping-options/${option.id}/calculate`, {
            method: "POST",
            body,
            headers,
            next,
        })

        return shipping_option
    } catch {
        // If anything blows up (network, 4xx, etc.), just treat it as no price.
        return null
    }
}
