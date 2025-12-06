"use server"

import { sdk } from "../config"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
    getAuthHeaders,
    getCacheOptions,
    getCacheTag,
    getCartId,
    removeAuthToken,
    removeCartId,
    setAuthToken,
} from "./cookies"

const logFormData = async (formData: FormData, label: string) => {
    const asObj: Record<string, string> = {}
    for (const [k, v] of formData.entries()) {
        asObj[k] = typeof v === "string" ? v : "[Blob]"
    }
    console.log(`[customer.ts] ${label}`, asObj)
    return asObj
}

export const retrieveCustomer =
    async (): Promise<HttpTypes.StoreCustomer | null> => {
        const authHeaders = await getAuthHeaders()

        if (!authHeaders) return null

        const headers = {
            ...authHeaders,
        }

        const next = {
            ...(await getCacheOptions("customers")),
        }

        return await sdk.client
            .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
                method: "GET",
                query: {
                    fields: "*orders",
                },
                headers,
                next,
                cache: "force-cache",
            })
            .then(({ customer }) => customer)
            .catch(() => null)
    }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
    const headers = {
        ...(await getAuthHeaders()),
    }

    console.log("[customer.ts] updateCustomer body", body)

    const updateRes = await sdk.store.customer
        .update(body, {}, headers)
        .then(({ customer }) => customer)
        .catch((err) => {
            throw new Error(err.message)
        })

    const cacheTag = await getCacheTag("customers")
    revalidateTag(cacheTag)

    return updateRes
}

export async function signup(formData: FormData) {
    const password = formData.get("password") as string

    // 👇 NEW: read gender from the form
    const genderRaw = formData.get("gender") as string | null
    const allowedGenders = [
        "female",
        "male",
        "other",
        "prefer_not_to_say",
    ] as const

    const gender = genderRaw && allowedGenders.includes(genderRaw as any)
        ? (genderRaw as (typeof allowedGenders)[number])
        : undefined

    const customerForm: any = {
        email: formData.get("email") as string,
        first_name: formData.get("first_name") as string,
        last_name: formData.get("last_name") as string,
        phone: formData.get("phone") as string,
    }

    // 👇 NEW: attach metadata.gender if provided
    if (gender) {
        customerForm.metadata = {
            ...(customerForm.metadata || {}),
            gender,
        }
    }

    try {
        console.log("[customer.ts] signup customerForm", customerForm)

        const token = await sdk.auth.register("customer", "emailpass", {
            email: customerForm.email,
            password: password,
        })

        await setAuthToken(token as string)

        const headers = {
            ...(await getAuthHeaders()),
        }

        const { customer: createdCustomer } = await sdk.store.customer.create(
            customerForm,
            {},
            headers
        )

        const loginToken = await sdk.auth.login("customer", "emailpass", {
            email: customerForm.email,
            password,
        })

        await setAuthToken(loginToken as string)

        const customerCacheTag = await getCacheTag("customers")
        revalidateTag(customerCacheTag)

        await transferCart()

        return createdCustomer
    } catch (error: any) {
        console.error("[customer.ts] signup error", error)
        return error.toString()
    }
}


export async function login(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    console.log("[customer.ts] login credentials (email only)", { email })

    try {
        await sdk.auth
            .login("customer", "emailpass", { email, password })
            .then(async (token) => {
                await setAuthToken(token as string)
                const customerCacheTag = await getCacheTag("customers")
                revalidateTag(customerCacheTag)
            })
    } catch (error: any) {
        console.error("[customer.ts] login error", error)
        return error.toString()
    }

    try {
        await transferCart()
    } catch (error: any) {
        console.error("[customer.ts] transferCart after login error", error)
        return error.toString()
    }
}

export async function signout() {
    await sdk.auth.logout()

    await removeAuthToken()

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    await removeCartId()

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
    redirect(`/`)
}

export async function transferCart() {
    const cartId = await getCartId()

    if (!cartId) {
        console.log("[customer.ts] transferCart – no cartId, skipping")
        return
    }

    const headers = await getAuthHeaders()

    console.log("[customer.ts] transferCart →", { cartId })
    await sdk.store.cart.transferCart(cartId, {}, headers)

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
}

export const addCustomerAddress = async (formData: FormData): Promise<any> => {
    const headers = {
        ...(await getAuthHeaders()),
    }

    const payload = await logFormData(formData, "addCustomerAddress payload")

    return sdk.store.customer
        .createAddress(payload as any, {}, headers)
        .then(async ({ customer }) => {
            console.log("[customer.ts] addCustomerAddress → success")
            const customerCacheTag = await getCacheTag("customers")
            revalidateTag(customerCacheTag)
            return { success: true, error: null }
        })
        .catch((err) => {
            console.error("[customer.ts] addCustomerAddress → error", err)
            return { success: false, error: err.toString() }
        })
}

export const deleteCustomerAddress = async (
    addressId: string
): Promise<void> => {
    const headers = {
        ...(await getAuthHeaders()),
    }

    console.log("[customer.ts] deleteCustomerAddress", { addressId })

    await sdk.store.customer
        .deleteAddress(addressId, headers)
        .then(async () => {
            const customerCacheTag = await getCacheTag("customers")
            revalidateTag(customerCacheTag)
            return { success: true, error: null }
        })
        .catch((err) => {
            console.error("[customer.ts] deleteCustomerAddress error", err)
            return { success: false, error: err.toString() }
        })
}

export const updateCustomerAddress = async (
    formData: FormData
): Promise<any> => {
    const headers = {
        ...(await getAuthHeaders()),
    }

    const payload = await logFormData(formData, "updateCustomerAddress payload")

    const addressId = payload["addressId"]
    if (!addressId) {
        console.error("[customer.ts] updateCustomerAddress → missing addressId")
        return { success: false, error: "Address ID is required" }
    }

    const updateBody: HttpTypes.StoreUpdateCustomerAddress = {
        address_name: payload["address_name"],
        first_name: payload["first_name"],
        last_name: payload["last_name"],
        company: payload["company"] || undefined,
        address_1: payload["address_1"],
        address_2: payload["address_2"] || undefined,
        city: payload["city"],
        postal_code: payload["postal_code"],
        province: payload["province"] || undefined,
        country_code: payload["country_code"],
        phone: payload["phone"] || undefined,
    }

    console.log("[customer.ts] updateCustomerAddress → body", updateBody)

    return sdk.store.customer
        .updateAddress(addressId, updateBody, {}, headers)
        .then(async () => {
            console.log("[customer.ts] updateCustomerAddress → success")
            const customerCacheTag = await getCacheTag("customers")
            revalidateTag(customerCacheTag)
            return { success: true, error: null }
        })
        .catch((err) => {
            console.error("[customer.ts] updateCustomerAddress → error", err)
            return { success: false, error: err.toString() }
        })
}

export const updateCustomerPassword = async (
    password: string,
    token: string
): Promise<any> => {
    console.log("[customer.ts] updateCustomerPassword")
    const res = await fetch(
        `${process.env.MEDUSA_BACKEND_URL}/auth/customer/emailpass/update`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ password }),
        }
    )
        .then(async () => {
            await removeAuthToken()
            const customerCacheTag = await getCacheTag("customers")
            revalidateTag(customerCacheTag)
            return { success: true, error: null }
        })
        .catch((err: any) => {
            console.error("[customer.ts] updateCustomerPassword error", err)
            return { success: false, error: err.toString() }
        })

    return res
}

export const sendResetPasswordEmail = async (email: string) => {
    console.log("[customer.ts] sendResetPasswordEmail", { email })
    const res = await sdk.auth
        .resetPassword("customer", "emailpass", {
            identifier: email,
        })
        .then(() => {
            return { success: true, error: null }
        })
        .catch((err: any) => {
            console.error("[customer.ts] sendResetPasswordEmail error", err)
            return { success: false, error: err.toString() }
        })

    return res
}
