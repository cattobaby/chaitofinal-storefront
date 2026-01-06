import { HttpTypes } from "@medusajs/types"

const isIntlCurrencySupported = (code: string) => {
    try {
        new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: code,
        }).format(0)
        return true
    } catch {
        return false
    }
}

const DEFAULT_DECIMALS: Record<string, number> = {
    BOB: 2,
    USD: 2,
    USDT: 2,
}

const DEFAULT_SYMBOL: Record<string, string> = {
    BOB: "Bs",
    USD: "$",
    // ✅ USDT no es ISO → mostramos el código
    USDT: "USDT",
}

export const formatMoneySafe = (amount: number, currencyCode: string) => {
    const code = (currencyCode || "").toUpperCase()

    if (isIntlCurrencySupported(code)) {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currencyDisplay: "narrowSymbol",
            currency: code,
        }).format(amount)
    }

    // fallback para no-ISO (USDT, etc.)
    const decimals = DEFAULT_DECIMALS[code] ?? 2
    const symbol = DEFAULT_SYMBOL[code] ?? code

    const n = Number(amount)
    const formatted = Number.isFinite(n)
        ? n.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })
        : "—"

    return `${symbol} ${formatted}`
}

type VariantWithPrices = HttpTypes.StoreProductVariant & {
    prices?: Array<{
        currency_code?: string
        amount?: number
        min_quantity?: number | null
        max_quantity?: number | null
        price_list_id?: string | null
        price_rules?: any[]
    }>
}

// escoge “precio base” por moneda (sin price_list, sin reglas, qty default)
export const getVariantPriceByCurrency = (
    variant: VariantWithPrices | undefined,
    currencyCode: string
) => {
    const code = currencyCode.toLowerCase()
    const prices = variant?.prices ?? []

    const matching = prices.filter(
        (p) => (p.currency_code || "").toLowerCase() === code
    )

    if (!matching.length) return null

    const best =
        matching.find(
            (p) =>
                !p.price_list_id &&
                (!p.price_rules || p.price_rules.length === 0) &&
                (p.min_quantity ?? 0) === 0 &&
                (p.max_quantity == null || p.max_quantity === 0)
        ) ?? matching[0]

    const amount =
        typeof best.amount === "number" ? best.amount : Number(best.amount)

    if (!Number.isFinite(amount)) return null

    return {
        amount,
        currency_code: currencyCode,
        formatted: formatMoneySafe(amount, currencyCode),
    }
}

export const getProductAltPrice = (args: {
    product: HttpTypes.StoreProduct
    variantId?: string
    currencyCode: string
}) => {
    const { product, variantId, currencyCode } = args
    const variant =
        (product.variants ?? []).find((v) => v.id === variantId) ??
        product.variants?.[0]
    return getVariantPriceByCurrency(variant as any, currencyCode)
}
