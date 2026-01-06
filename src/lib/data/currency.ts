// /home/willman/WebstormProjects/new/new/storefront/src/lib/data/currency.ts
export const CURRENCY_COOKIE = "chaito_currency"
export const DEFAULT_CURRENCY = "BOB"

const SUPPORTED = new Set(["BOB", "USDT"])

export function normalizeCurrency(input?: string | null) {
    const code = (input || "").trim().toUpperCase()
    if (!code) return DEFAULT_CURRENCY
    return SUPPORTED.has(code) ? code : DEFAULT_CURRENCY
}

export function getCurrencyFromCookieHeader(cookieHeader?: string | null) {
    if (!cookieHeader) return DEFAULT_CURRENCY

    const re = new RegExp(`(?:^|;\\s*)${CURRENCY_COOKIE}=([^;]+)`)
    const m = cookieHeader.match(re)
    if (!m?.[1]) return DEFAULT_CURRENCY

    try {
        return normalizeCurrency(decodeURIComponent(m[1]))
    } catch {
        return normalizeCurrency(m[1])
    }
}
