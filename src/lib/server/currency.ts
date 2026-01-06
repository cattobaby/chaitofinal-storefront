// /home/willman/WebstormProjects/new/new/storefront/src/lib/server/currency.ts

import { getCurrencyFromCookieHeader } from "@/lib/data/currency"

/**
 * Server-safe y client-safe:
 * - NO importa next/headers
 * - Solo parsea un cookie header string
 */
export function getCurrencyCodeFromCookieHeader(cookieHeader?: string | null) {
    return getCurrencyFromCookieHeader(cookieHeader)
}
