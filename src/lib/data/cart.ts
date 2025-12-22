// storefront/src/lib/data/cart.ts
"use server"

/* eslint-disable no-console */

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

const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

const LOG = "[storefront][data][cart]"

function nowMs() {
    return Date.now()
}

function safeHeaders(h: Record<string, any>) {
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(h || {})) {
        const key = k.toLowerCase()
        if (
            key.includes("authorization") ||
            key.includes("cookie") ||
            key.includes("set-cookie") ||
            key.includes("x-publishable-api-key")
        ) {
            out[k] = "<redacted>"
        } else {
            out[k] = v
        }
    }
    return out
}

async function safeReadText(resp: Response) {
    try {
        const t = await resp.text()
        return t.length > 800 ? t.slice(0, 800) + "…(truncated)" : t
    } catch {
        return "<unreadable>"
    }
}

export async function retrieveCart(cartId?: string) {
    const id = cartId || (await getCartId())

    if (!id) {
        console.log(`${LOG} retrieveCart → no cart id, returning null`)
        return null
    }

    const headers = {
        ...(await getAuthHeaders()),
    }

    console.log(`${LOG} retrieveCart → fetching cart`, {
        id,
        hasAuth: !!(headers as any).authorization,
    })

    return await sdk.client
        .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
            method: "GET",
            query: {
                fields: [
                    "*items",
                    "*items.product",
                    "*items.variant",
                    "*items.variant.options",
                    "items.variant.options.option.title",
                    "*items.thumbnail",
                    "*items.metadata",
                    "+items.total",

                    "*region",

                    "*shipping_address",
                    "*billing_address",

                    "*promotions",
                    "+shipping_methods.name",
                    "+shipping_methods.amount",
                    "*items.product.seller",

                    "+subtotal",
                    "+shipping_total",
                    "+discount_total",
                    "+tax_total",
                    "+total",

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
                    `${LOG} retrieveCart → payment sessions`,
                    paymentSessions.map((s: any) => ({
                        id: s.id,
                        provider_id: s.provider_id,
                        status: s.status,
                        hasData: !!s.data,
                    }))
                )
            }

            console.log(`${LOG} retrieveCart → cart summary`, {
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
            console.error(`${LOG} retrieveCart → error`, e?.message || e, e?.stack)
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
        console.log(`${LOG} getOrSetCart:create`, { region_id: region.id })
        const cartResp = await sdk.store.cart.create({ region_id: region.id }, {}, headers)
        cart = cartResp.cart

        await setCartId(cart.id)

        const cartCacheTag = await getCacheTag("carts")
        revalidateTag(cartCacheTag)
    }

    if (cart && cart?.region_id !== region.id) {
        console.log(`${LOG} getOrSetCart:update region`, {
            cartId: cart.id,
            from: cart.region_id,
            to: region.id,
        })
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

    console.log(`${LOG} updateCart:start`, { cartId, keys: Object.keys(data || {}) })

    return await sdk.store.cart
        .update(cartId, data, {}, headers)
        .then(async ({ cart }) => {
            const cartCacheTag = await getCacheTag("carts")
            await revalidateTag(cartCacheTag)
            console.log(`${LOG} updateCart:ok`, { cartId })
            return cart
        })
        .catch((e) => {
            console.error(`${LOG} updateCart:fail`, e?.message || e, e?.stack)
            return medusaError(e)
        })
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
    if (!variantId) throw new Error("Missing variant ID when adding to cart")

    const cart = await getOrSetCart(countryCode)
    if (!cart) throw new Error("Error retrieving or creating cart")

    const headers = {
        ...(await getAuthHeaders()),
    }

    const currentItem = cart.items?.find((item) => item.variant_id === variantId)

    console.log(`${LOG} addToCart:start`, {
        cartId: cart.id,
        variantId,
        quantity,
        hasCurrentItem: !!currentItem,
    })

    if (currentItem) {
        await sdk.store.cart
            .updateLineItem(cart.id, currentItem.id, { quantity: currentItem.quantity + quantity }, {}, headers)
            .catch(medusaError)
            .finally(async () => {
                const cartCacheTag = await getCacheTag("carts")
                revalidateTag(cartCacheTag)
            })
    } else {
        await sdk.store.cart
            .createLineItem(cart.id, { variant_id: variantId, quantity }, {}, headers)
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
    if (!lineId) throw new Error("Missing lineItem ID when updating line item")

    const cartId = await getCartId()
    if (!cartId) throw new Error("Missing cart ID when updating line item")

    const headers = {
        ...(await getAuthHeaders()),
    }

    console.log(`${LOG} updateLineItem:start`, { cartId, lineId, quantity })

    const res = await fetchQuery(`/store/carts/${cartId}/line-items/${lineId}`, {
        body: { quantity },
        method: "POST",
        headers,
    })

    const cartCacheTag = await getCacheTag("carts")
    await revalidateTag(cartCacheTag)

    console.log(`${LOG} updateLineItem:ok`, { cartId, lineId })

    return res
}

export async function deleteLineItem(lineId: string) {
    if (!lineId) throw new Error("Missing lineItem ID when deleting line item")

    const cartId = await getCartId()
    if (!cartId) throw new Error("Missing cart ID when deleting line item")

    const headers = {
        ...(await getAuthHeaders()),
    }

    console.log(`${LOG} deleteLineItem:start`, { cartId, lineId })

    await sdk.store.cart
        .deleteLineItem(cartId, lineId, headers)
        .then(async () => {
            const cartCacheTag = await getCacheTag("carts")
            await revalidateTag(cartCacheTag)
            console.log(`${LOG} deleteLineItem:ok`, { cartId, lineId })
        })
        .catch((e) => {
            console.error(`${LOG} deleteLineItem:fail`, e?.message || e, e?.stack)
            return medusaError(e)
        })
}

type SetShippingMethodArgs = {
    cartId: string
    shippingMethodId: string // shipping_option_id
    sellerId?: string | null
    data?: Record<string, any>
    amountMinor?: number | null
}

export async function setShippingMethod(args: SetShippingMethodArgs): Promise<{
    ok: boolean
    cart?: HttpTypes.StoreCart
    error?: { message: string }
}> {
    const authHeaders = await getAuthHeaders()

    const headers: Record<string, string> = {
        ...(authHeaders as any),
        "Content-Type": "application/json",
    }

    const pub = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    if (pub && !headers["x-publishable-api-key"]) {
        headers["x-publishable-api-key"] = pub
    }

    const shouldFallback = (msg: string) => {
        const m = (msg || "").toLowerCase()
        return (
            m.includes("not available for any of the cart items") ||
            m.includes("not available for any of the cart item") ||
            m.includes("is not available") ||
            m.includes("not available for the cart")
        )
    }

    const fetchCart = async () => {
        const { cart } = await sdk.client.fetch<HttpTypes.StoreCartResponse>(`/store/carts/${args.cartId}`, {
            method: "GET",
            query: {
                fields: [
                    "*items",
                    "*items.product",
                    "*items.variant",
                    "*items.variant.options",
                    "items.variant.options.option.title",
                    "*items.thumbnail",
                    "*items.metadata",
                    "+items.total",
                    "*region",
                    "*shipping_address",
                    "*billing_address",
                    "*promotions",
                    "+shipping_methods.name",
                    "+shipping_methods.amount",
                    "*items.product.seller",
                    "+subtotal",
                    "+shipping_total",
                    "+discount_total",
                    "+tax_total",
                    "+total",
                    "*payment_collection.payment_sessions",
                    "payment_collection.payment_sessions.*",
                    "payment_collection.payment_sessions.data",
                ].join(","),
            },
            headers,
            cache: "no-cache",
        })
        return cart
    }

    // ✅ FIX: enviar al force route el payload correcto (amount + option_id)
    const callForce = async (messageFromNormal: string) => {
        const amountMinor = typeof args.amountMinor === "number" ? args.amountMinor : null
        if (amountMinor == null || !Number.isFinite(amountMinor)) {
            return { ok: false, error: { message: `${messageFromNormal} (faltó amount para FORCE)` } }
        }

        const resp = await fetch(`${BASE_URL}/storeapp/shipping/force`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                cart_id: args.cartId,

                // canonical
                option_id: args.shippingMethodId,

                // canonical (minor units)
                amount: amountMinor,

                replace_existing: true,

                data: {
                    ...(args.data || {}),
                    ...(args.sellerId ? { seller_id: args.sellerId } : {}),
                    forced: true,
                    source: (args.data as any)?.source ?? "storefront_force",
                },
            }),
            cache: "no-cache",
        })

        const json = await resp.json().catch(() => ({}))
        if (!resp.ok) {
            return { ok: false, error: { message: json?.message || "FORCE failed" } }
        }

        const cart = await fetchCart()

        const cartCacheTag = await getCacheTag("carts")
        revalidateTag(cartCacheTag)

        return { ok: true, cart }
    }

    try {
        // 1) intento normal (Medusa)
        const res = await fetch(`${BASE_URL}/store/carts/${args.cartId}/shipping-methods`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                option_id: args.shippingMethodId,
                data: {
                    ...(args.data || {}),
                    ...(args.sellerId ? { seller_id: args.sellerId } : {}),
                },
            }),
            cache: "no-cache",
        })

        const json = await res.json().catch(() => ({}))

        if (res.ok) {
            const cart = (json?.cart || json) as HttpTypes.StoreCart

            const cartCacheTag = await getCacheTag("carts")
            revalidateTag(cartCacheTag)

            return { ok: true, cart }
        }

        const msg = String(json?.message || "Error al establecer el método de envío.")

        // 2) fallback solo para el error de availability por items/location
        if (shouldFallback(msg)) {
            return await callForce(msg)
        }

        return { ok: false, error: { message: msg } }
    } catch (e: any) {
        return { ok: false, error: { message: e?.message || "Error al establecer el método de envío." } }
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

    console.log(`${LOG} initiatePaymentSession:start`, {
        cartId: cart?.id,
        provider_id: data?.provider_id,
        contextKeys: Object.keys(data?.context || {}),
    })

    return sdk.store.payment
        .initiatePaymentSession(cart, data, {}, headers)
        .then(async (resp) => {
            const cartCacheTag = await getCacheTag("carts")
            revalidateTag(cartCacheTag)
            console.log(`${LOG} initiatePaymentSession:ok`, { cartId: cart?.id })
            return resp
        })
        .catch((e) => {
            console.error(`${LOG} initiatePaymentSession:fail`, e?.message || e, e?.stack)
            return medusaError(e)
        })
}

export async function applyPromotions(codes: string[]) {
    const cartId = await getCartId()
    if (!cartId) throw new Error("No existing cart found")

    const headers = {
        ...(await getAuthHeaders()),
    }

    console.log(`${LOG} applyPromotions:start`, { cartId, codes })

    return sdk.store.cart
        .update(cartId, { promo_codes: codes }, {}, headers)
        .then(async ({ cart }) => {
            const cartCacheTag = await getCacheTag("carts")
            revalidateTag(cartCacheTag)

            const applied = (cart as any)?.promotions?.some((promotion: any) => codes.includes(promotion.code))

            console.log(`${LOG} applyPromotions:ok`, { cartId, applied })
            return applied
        })
        .catch((e) => {
            console.error(`${LOG} applyPromotions:fail`, e?.message || e, e?.stack)
            return medusaError(e)
        })
}

/**
 * ✅ FIX: removeShippingMethod ahora usa BASE_URL + auth headers + publishable key (igual que setShippingMethod).
 */
export async function removeShippingMethod(shippingMethodId: string) {
    const cartId = await getCartId()
    if (!cartId) throw new Error("No existing cart found")

    const authHeaders = await getAuthHeaders()
    const headers: Record<string, string> = {
        ...(authHeaders as any),
        "Content-Type": "application/json",
    }

    const pub = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    if (pub && !headers["x-publishable-api-key"]) {
        headers["x-publishable-api-key"] = pub
    }

    const url = `${BASE_URL}/store/carts/${cartId}/shipping-methods`

    console.log(`${LOG} removeShippingMethod:start`, {
        cartId,
        shippingMethodId,
        url,
        headers: safeHeaders(headers),
    })

    return fetch(url, {
        method: "DELETE",
        body: JSON.stringify({ shipping_method_ids: [shippingMethodId] }),
        headers,
        cache: "no-cache",
    })
        .then(async (resp) => {
            const text = await safeReadText(resp)
            console.log(`${LOG} removeShippingMethod:response`, {
                status: resp.status,
                ok: resp.ok,
                bodySnippet: text,
            })

            const cartCacheTag = await getCacheTag("carts")
            revalidateTag(cartCacheTag)
        })
        .catch((e) => {
            console.error(`${LOG} removeShippingMethod:fail`, e?.message || e, e?.stack)
            return medusaError(e)
        })
}

export async function setAddresses(currentState: unknown, formData: FormData) {
    try {
        if (!formData) throw new Error("No form data found when setting addresses")

        const cartId = await getCartId()
        if (!cartId) throw new Error("No existing cart found when setting addresses")

        const gpsLatRaw = formData.get("shipping_address.metadata.gps_latitude")
        const gpsLngRaw = formData.get("shipping_address.metadata.gps_longitude")

        const gpsLat =
            typeof gpsLatRaw === "string" && gpsLatRaw.trim() !== "" && !isNaN(Number(gpsLatRaw))
                ? Number(gpsLatRaw)
                : undefined

        const gpsLng =
            typeof gpsLngRaw === "string" && gpsLngRaw.trim() !== "" && !isNaN(Number(gpsLngRaw))
                ? Number(gpsLngRaw)
                : undefined

        const metadata: Record<string, unknown> = {}
        if (typeof gpsLat === "number") metadata.gps_latitude = gpsLat
        if (typeof gpsLng === "number") metadata.gps_longitude = gpsLng

        console.log(`${LOG} setAddresses:start`, {
            cartId,
            hasGpsLat: typeof gpsLat === "number",
            hasGpsLng: typeof gpsLng === "number",
            metadataKeys: Object.keys(metadata),
        })

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

        data.billing_address = data.shipping_address

        await updateCart(data)
        await revalidatePath("/cart")

        console.log(`${LOG} setAddresses:ok`, { cartId })
    } catch (e: any) {
        console.error(`${LOG} setAddresses:fail`, e?.message || e, e?.stack)
        return e.message
    }
}

export async function placeOrder(cartId?: string) {
    const id = cartId || (await getCartId())
    if (!id) throw new Error("No existing cart found when placing an order")

    const headers = {
        ...(await getAuthHeaders()),
    }

    console.log(`${LOG} placeOrder:start`, { cartId: id })

    const res = await fetchQuery(`/store/carts/${id}/complete`, {
        method: "POST",
        headers,
    })

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    if (res?.data?.order_set) {
        console.log(`${LOG} placeOrder:ok`, { cartId: id })
        revalidatePath("/user/reviews")
        revalidatePath("/user/orders")
        removeCartId()
        redirect(`/order/${res?.data?.order_set.orders[0].id}/confirmed`)
    }

    console.log(`${LOG} placeOrder:done`, { cartId: id, hasOrderSet: !!res?.data?.order_set })

    return res
}

export async function updateRegion(countryCode: string, currentPath: string) {
    const cartId = await getCartId()
    const region = await getRegion(countryCode)

    if (!region) throw new Error(`Region not found for country code: ${countryCode}`)

    console.log(`${LOG} updateRegion:start`, { cartId, countryCode, newRegionId: region.id })

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

export async function updateRegionWithValidation(
    countryCode: string,
    currentPath: string
): Promise<{ removedItems: string[]; newPath: string }> {
    const cartId = await getCartId()
    const region = await getRegion(countryCode)

    if (!region) throw new Error(`Region not found for country code: ${countryCode}`)

    console.log(`${LOG} updateRegionWithValidation:start`, {
        cartId,
        countryCode,
        newRegionId: region.id,
    })

    let removedItems: string[] = []

    if (cartId) {
        const headers = {
            ...(await getAuthHeaders()),
        }

        try {
            await updateCart({ region_id: region.id })
        } catch (error: any) {
            console.error(`${LOG} updateRegionWithValidation:updateCart failed`, error?.message || error)

            if (!error?.message?.includes("do not have a price")) {
                throw error
            }

            const problematicVariantIds = parseVariantIdsFromError(error.message)
            console.log(`${LOG} updateRegionWithValidation:problematic variants`, problematicVariantIds)

            if (!problematicVariantIds.length) {
                throw new Error("Failed to parse variant IDs from error")
            }

            try {
                const { cart } = await sdk.client.fetch<HttpTypes.StoreCartResponse>(`/store/carts/${cartId}`, {
                    method: "GET",
                    query: { fields: "*items" },
                    headers,
                    cache: "no-cache",
                })

                for (const variantId of problematicVariantIds) {
                    const item = cart?.items?.find((item) => item.variant_id === variantId)
                    if (item) {
                        try {
                            await sdk.store.cart.deleteLineItem(cart.id, item.id, headers)
                            removedItems.push(item.product_title || "Unknown product")
                        } catch (e: any) {
                            console.error(`${LOG} updateRegionWithValidation:remove item failed`, {
                                variantId,
                                message: e?.message,
                            })
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

    console.log(`${LOG} listCartOptions:start`, { cartId, hasAuth: !!(headers as any).authorization })

    return await sdk.client.fetch<{
        shipping_options: HttpTypes.StoreCartShippingOption[]
    }>("/store/shipping-options", {
        query: { cart_id: cartId },
        next,
        headers,
        cache: "force-cache",
    })
}
