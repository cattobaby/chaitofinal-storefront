"use server"

import { fetchQuery, sdk } from "../config"
import medusaError from "@/lib/helpers/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
    getAuthHeaders,
    getCacheOptions,
    getCacheTag,
    getCartId,
    removeCartId,
    setCartId,
} from "./cookies"
import { getRegion } from "./regions"
import { parseVariantIdsFromError } from "@/lib/helpers/parse-variant-error"

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object if found, or null if not found.
 */
export async function retrieveCart(cartId?: string) {
    const id = cartId || (await getCartId())

    if (!id) {
        console.log("Server  retrieveCart → no cart id, returning null")
        return null
    }

    const headers = {
        ...(await getAuthHeaders()),
    }

    console.log("Server  retrieveCart → fetching cart ", {
        id,
        hasAuth: !!(headers as any).authorization,
    })

    return await sdk.client
        .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
            method: "GET",
            query: {
                fields: [
                    // items + variants + product
                    "*items",
                    "*items.product",
                    "*items.variant",
                    "*items.variant.options",
                    "items.variant.options.option.title",
                    "*items.thumbnail",
                    "*items.metadata",
                    "+items.total",

                    // region
                    "*region",

                    // addresses
                    "*shipping_address",
                    "*billing_address",

                    // promotions / shipping methods / seller
                    "*promotions",
                    "+shipping_methods.name",
                    // ✅ IMPORTANT: fetch the amount so UI doesn't fall back to 0
                    "+shipping_methods.amount",
                    "*items.product.seller",

                    // ✅ ask Medusa to compute and return totals (primitive fields)
                    "+subtotal",
                    "+shipping_total",
                    "+discount_total",
                    "+tax_total",
                    "+total",

                    // ✅ payment collection + sessions (include all session fields + data)
                    "*payment_collection.payment_sessions",
                    "payment_collection.payment_sessions.*",
                    "payment_collection.payment_sessions.data",
                ].join(","),
            },
            headers,
            cache: "no-cache",
        })
        .then(({ cart }) => {
            const paymentSessions = cart?.payment_collection?.payment_sessions || []

            if (paymentSessions.length) {
                console.log(
                    "Server  retrieveCart → payment sessions",
                    paymentSessions.map((s: any) => ({
                        id: s.id,
                        provider_id: s.provider_id,
                        status: s.status,
                        hasData: !!s.data,
                    }))
                )
            }

            console.log("Server  retrieveCart → cart summary ", {
                id: cart?.id,
                itemsLength: cart?.items?.length || 0,
                hasShippingAddress: !!cart?.shipping_address,
                hasBillingAddress: !!cart?.billing_address,
                hasShippingMethods: !!cart?.shipping_methods?.length,
                hasPaymentCollection: !!cart?.payment_collection,
                paymentSessions: paymentSessions.map((s: any) => ({
                    id: s.id,
                    provider_id: s.provider_id,
                    status: s.status,
                    hasData: !!s.data,
                })),
                hasTotals: !!(cart as any)?.totals,
            })

            return cart
        })
        .catch((e) => {
            console.error("Server  retrieveCart → error", e)
            return null
        })
}

export async function getOrSetCart(countryCode: string) {
    const region = await getRegion(countryCode)

    if (!region) {
        throw new Error(`Region not found for country code: ${countryCode}`)
    }

    let cart = await retrieveCart()

    const headers = {
        ...(await getAuthHeaders()),
    }

    if (!cart) {
        const cartResp = await sdk.store.cart.create(
            { region_id: region.id },
            {},
            headers
        )
        cart = cartResp.cart

        await setCartId(cart.id)

        const cartCacheTag = await getCacheTag("carts")
        revalidateTag(cartCacheTag)
    }

    if (cart && cart?.region_id !== region.id) {
        await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
        const cartCacheTag = await getCacheTag("carts")
        revalidateTag(cartCacheTag)
    }

    return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
    const cartId = await getCartId()

    if (!cartId) {
        throw new Error("No existing cart found, please create one before updating")
    }

    const headers = {
        ...(await getAuthHeaders()),
    }

    return await sdk.store.cart
        .update(cartId, data, {}, headers)
        .then(async ({ cart }) => {
            const cartCacheTag = await getCacheTag("carts")
            await revalidateTag(cartCacheTag)
            return cart
        })
        .catch(medusaError)
}

export async function addToCart({
                                    variantId,
                                    quantity,
                                    countryCode,
                                }: {
    variantId: string
    quantity: number
    countryCode: string
}) {
    if (!variantId) {
        throw new Error("Missing variant ID when adding to cart")
    }

    const cart = await getOrSetCart(countryCode)

    if (!cart) {
        throw new Error("Error retrieving or creating cart")
    }

    const headers = {
        ...(await getAuthHeaders()),
    }

    const currentItem = cart.items?.find((item) => item.variant_id === variantId)

    if (currentItem) {
        await sdk.store.cart
            .updateLineItem(
                cart.id,
                currentItem.id,
                { quantity: currentItem.quantity + quantity },
                {},
                headers
            )
            .catch(medusaError)
            .finally(async () => {
                const cartCacheTag = await getCacheTag("carts")
                revalidateTag(cartCacheTag)
            })
    } else {
        await sdk.store.cart
            .createLineItem(
                cart.id,
                {
                    variant_id: variantId,
                    quantity,
                },
                {},
                headers
            )
            .then(async () => {
                const cartCacheTag = await getCacheTag("carts")
                revalidateTag(cartCacheTag)
            })
            .catch(medusaError)
            .finally(async () => {
                const cartCacheTag = await getCacheTag("carts")
                revalidateTag(cartCacheTag)
            })
    }
}

export async function updateLineItem({
                                         lineId,
                                         quantity,
                                     }: {
    lineId: string
    quantity: number
}) {
    if (!lineId) {
        throw new Error("Missing lineItem ID when updating line item")
    }

    const cartId = await getCartId()

    if (!cartId) {
        throw new Error("Missing cart ID when updating line item")
    }

    const headers = {
        ...(await getAuthHeaders()),
    }

    const res = await fetchQuery(`/store/carts/${cartId}/line-items/${lineId}`, {
        body: { quantity },
        method: "POST",
        headers,
    })

    const cartCacheTag = await getCacheTag("carts")
    await revalidateTag(cartCacheTag)

    return res
}

export async function deleteLineItem(lineId: string) {
    if (!lineId) {
        throw new Error("Missing lineItem ID when deleting line item")
    }

    const cartId = await getCartId()

    if (!cartId) {
        throw new Error("Missing cart ID when deleting line item")
    }

    const headers = {
        ...(await getAuthHeaders()),
    }

    await sdk.store.cart
        .deleteLineItem(cartId, lineId, headers)
        .then(async () => {
            const cartCacheTag = await getCacheTag("carts")
            await revalidateTag(cartCacheTag)
        })
        .catch(medusaError)
}

/**
 * Attach a shipping method to the cart.
 * We now accept an optional sellerId and store it in `data.seller_id`
 * so the marketplace logic can find "seller shipping methods".
 */
export async function setShippingMethod({
                                            cartId,
                                            shippingMethodId,
                                            sellerId,
                                        }: {
    cartId: string
    shippingMethodId: string
    sellerId?: string | null
}): Promise<{
    ok: boolean
    cart?: HttpTypes.StoreCart
    error?: { message: string }
}> {
    const headers = { ...(await getAuthHeaders()) }

    // 🔒 Idempotency: if the cart already has this option attached, no-op
    const existing = await sdk.client
        .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${cartId}`, {
            method: "GET",
            query: { fields: "+shipping_methods.shipping_option_id" },
            headers,
            cache: "no-cache",
        })
        .then(({ cart }) => cart)
        .catch(() => null)

    const alreadyAttached = !!existing?.shipping_methods?.some(
        (m: any) => m?.shipping_option_id === shippingMethodId
    )

    if (alreadyAttached) {
        // still ensure override is applied once
        try {
            const { getDeliveryQuote } = await import("./delivery")
            await getDeliveryQuote(cartId)
        } catch (e) {
            console.warn("[setShippingMethod] distance override after no-op failed:", e)
        }

        const cart = (await retrieveCart(cartId)) ?? undefined
        return { ok: true, cart }
    }

    const body: any = { option_id: shippingMethodId }
    if (sellerId) body.data = { seller_id: sellerId }

    try {
        const res: any = await fetchQuery(`/store/carts/${cartId}/shipping-methods`, {
            body,
            method: "POST",
            headers,
        })

        const cartCacheTag = await getCacheTag("carts")
        revalidateTag(cartCacheTag)

        // Apply the distance-based override exactly once after attach
        try {
            const { getDeliveryQuote } = await import("./delivery")
            await getDeliveryQuote(cartId)
        } catch (e) {
            console.warn("[setShippingMethod] post-attach distance override failed:", e)
        }

        // Return a fresh cart snapshot
        const cart = (await retrieveCart(cartId)) ?? undefined
        return { ok: true, cart }
    } catch (e: any) {
        return {
            ok: false,
            error: { message: e?.message || "Failed to set shipping method." },
        }
    }
}

export async function initiatePaymentSession(
    cart: HttpTypes.StoreCart,
    data: {
        provider_id: string
        context?: Record<string, unknown>
    }
) {
    const headers = {
        ...(await getAuthHeaders()),
    }

    return sdk.store.payment
        .initiatePaymentSession(cart, data, {}, headers)
        .then(async (resp) => {
            const cartCacheTag = await getCacheTag("carts")
            revalidateTag(cartCacheTag)
            return resp
        })
        .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
    const cartId = await getCartId()

    if (!cartId) {
        throw new Error("No existing cart found")
    }

    const headers = {
        ...(await getAuthHeaders()),
    }

    return sdk.store.cart
        .update(cartId, { promo_codes: codes }, {}, headers)
        .then(async ({ cart }) => {
            const cartCacheTag = await getCacheTag("carts")
            revalidateTag(cartCacheTag)

            const applied = (cart as any)?.promotions?.some((promotion: any) =>
                codes.includes(promotion.code)
            )

            return applied
        })
        .catch(medusaError)
}

export async function removeShippingMethod(shippingMethodId: string) {
    const cartId = await getCartId()

    if (!cartId) {
        throw new Error("No existing cart found")
    }

    const headers = {
        ...(await getAuthHeaders()),
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env
            .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
    }

    return fetch(
        `${process.env.MEDUSA_BACKEND_URL}/store/carts/${cartId}/shipping-methods`,
        {
            method: "DELETE",
            body: JSON.stringify({ shipping_method_ids: [shippingMethodId] }),
            headers,
        }
    )
        .then(async () => {
            const cartCacheTag = await getCacheTag("carts")
            revalidateTag(cartCacheTag)
        })
        .catch(medusaError)
}

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
    try {
        if (!formData) {
            throw new Error("No form data found when setting addresses")
        }

        const cartId = await getCartId()
        if (!cartId) {
            throw new Error("No existing cart found when setting addresses")
        }

        const gpsLatRaw = formData.get("shipping_address.metadata.gps_latitude")
        const gpsLngRaw = formData.get("shipping_address.metadata.gps_longitude")

        const gpsLat =
            typeof gpsLatRaw === "string" &&
            gpsLatRaw.trim() !== "" &&
            !isNaN(Number(gpsLatRaw))
                ? Number(gpsLatRaw)
                : undefined

        const gpsLng =
            typeof gpsLngRaw === "string" &&
            gpsLngRaw.trim() !== "" &&
            !isNaN(Number(gpsLngRaw))
                ? Number(gpsLngRaw)
                : undefined

        const metadata: Record<string, unknown> = {}

        if (typeof gpsLat === "number") {
            metadata.gps_latitude = gpsLat
        }

        if (typeof gpsLng === "number") {
            metadata.gps_longitude = gpsLng
        }

        const shippingAddress: any = {
            first_name: formData.get("shipping_address.first_name"),
            last_name: formData.get("shipping_address.last_name"),
            address_1: formData.get("shipping_address.address_1"),
            address_2: "",
            company: formData.get("shipping_address.company"),
            postal_code: formData.get("shipping_address.postal_code"),
            city: formData.get("shipping_address.city"),
            country_code: formData.get("shipping_address.country_code"),
            province: formData.get("shipping_address.province"),
            phone: formData.get("shipping_address.phone"),
        }

        if (Object.keys(metadata).length > 0) {
            shippingAddress.metadata = metadata
        }

        const data: any = {
            shipping_address: shippingAddress,
            email: formData.get("email"),
        }

        // mirror shipping -> billing for now
        data.billing_address = data.shipping_address

        await updateCart(data)
        await revalidatePath("/cart")
    } catch (e: any) {
        return e.message
    }
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to place an order for.
 * @returns The cart object if the order was successful, or null if not found.
 */
export async function placeOrder(cartId?: string) {
    const id = cartId || (await getCartId())

    if (!id) {
        throw new Error("No existing cart found when placing an order")
    }

    const headers = {
        ...(await getAuthHeaders()),
    }

    const res = await fetchQuery(`/store/carts/${id}/complete`, {
        method: "POST",
        headers,
    })

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    if (res?.data?.order_set) {
        revalidatePath("/user/reviews")
        revalidatePath("/user/orders")
        removeCartId()
        redirect(`/order/${res?.data?.order_set.orders[0].id}/confirmed`)
    }

    return res
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
    const cartId = await getCartId()
    const region = await getRegion(countryCode)

    if (!region) {
        throw new Error(`Region not found for country code: ${countryCode}`)
    }

    if (cartId) {
        await updateCart({ region_id: region.id })
        const cartCacheTag = await getCacheTag("carts")
        revalidateTag(cartCacheTag)
    }

    const regionCacheTag = await getCacheTag("regions")
    revalidateTag(regionCacheTag)

    const productsCacheTag = await getCacheTag("products")
    revalidateTag(productsCacheTag)

    redirect(`/${countryCode}${currentPath}`)
}

/**
 * Updates the region and returns removed items for notification.
 * This is a wrapper around updateRegion that doesn't redirect.
 */
export async function updateRegionWithValidation(
    countryCode: string,
    currentPath: string
): Promise<{ removedItems: string[]; newPath: string }> {
    const cartId = await getCartId()
    const region = await getRegion(countryCode)

    if (!region) {
        throw new Error(`Region not found for country code: ${countryCode}`)
    }

    let removedItems: string[] = []

    if (cartId) {
        const headers = {
            ...(await getAuthHeaders()),
        }

        try {
            await updateCart({ region_id: region.id })
        } catch (error: any) {
            if (!error?.message?.includes("do not have a price")) {
                throw error
            }

            const problematicVariantIds = parseVariantIdsFromError(error.message)

            if (!problematicVariantIds.length) {
                throw new Error("Failed to parse variant IDs from error")
            }

            try {
                const { cart } = await sdk.client.fetch<HttpTypes.StoreCartResponse>(
                    `/store/carts/${cartId}`,
                    {
                        method: "GET",
                        query: {
                            fields: "*items",
                        },
                        headers,
                        cache: "no-cache",
                    }
                )

                for (const variantId of problematicVariantIds) {
                    const item = cart?.items?.find(
                        (item) => item.variant_id === variantId
                    )
                    if (item) {
                        try {
                            await sdk.store.cart.deleteLineItem(cart.id, item.id, headers)
                            removedItems.push(item.product_title || "Unknown product")
                        } catch {
                            // ignore delete failure
                        }
                    }
                }

                if (removedItems.length > 0) {
                    await updateCart({ region_id: region.id })
                }
            } catch {
                throw new Error("Failed to handle incompatible cart items")
            }
        }

        const cartCacheTag = await getCacheTag("carts")
        revalidateTag(cartCacheTag)
    }

    const regionCacheTag = await getCacheTag("regions")
    revalidateTag(regionCacheTag)

    const productsCacheTag = await getCacheTag("products")
    revalidateTag(productsCacheTag)

    return {
        removedItems,
        newPath: `/${countryCode}${currentPath}`,
    }
}

export async function listCartOptions() {
    const cartId = await getCartId()
    const headers = {
        ...(await getAuthHeaders()),
    }
    const next = {
        ...(await getCacheOptions("shippingOptions")),
    }

    return await sdk.client.fetch<{
        shipping_options: HttpTypes.StoreCartShippingOption[]
    }>("/store/shipping-options", {
        query: { cart_id: cartId },
        next,
        headers,
        cache: "force-cache",
    })
}
