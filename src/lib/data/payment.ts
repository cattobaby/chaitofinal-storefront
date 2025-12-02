"use server"

import { sdk } from "../config"
import { getAuthHeaders } from "./cookies"
import { HttpTypes } from "@medusajs/types"

export const listCartPaymentMethods = async (regionId: string) => {
    const headers = {
        ...(await getAuthHeaders()),
    }

    console.log(
        "[checkout] listCartPaymentMethods → calling /store/payment-providers",
        { regionId, headersPresent: Object.keys(headers) }
    )

    try {
        const res = await sdk.client.fetch<HttpTypes.StorePaymentProviderListResponse>(
            `/store/payment-providers`,
            {
                method: "GET",
                query: { region_id: regionId },
                headers,
                // IMPORTANT: disable Next.js caching while we debug
                cache: "no-store",
            }
        )

        console.log(
            "[checkout] listCartPaymentMethods → raw response",
            JSON.stringify(res, null, 2)
        )

        const sorted = res.payment_providers.sort((a, b) => {
            return a.id > b.id ? 1 : -1
        })

        console.log(
            "[checkout] listCartPaymentMethods → final list",
            sorted.map((p) => ({ id: p.id, is_enabled: (p as any).is_enabled }))
        )

        return sorted
    } catch (err: any) {
        console.error(
            "[checkout] listCartPaymentMethods → ERROR",
            err?.message || err
        )
        return null
    }
}
