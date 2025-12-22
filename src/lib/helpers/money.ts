import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
    amount: number
    currency_code: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    locale?: string
}

export const convertToLocale = ({
                                    amount,
                                    currency_code,
                                    minimumFractionDigits,
                                    maximumFractionDigits,
                                    locale = "es-BO",
                                }: ConvertToLocaleParams) => {
    const numericAmount =
        typeof amount === "number" && !Number.isNaN(amount) ? amount : 0

    const safeCurrency =
        typeof currency_code === "string" && !isEmpty(currency_code)
            ? currency_code.toUpperCase()
            : "BOB"

    // USDT no es ISO-4217 → Intl currency falla.
    if (safeCurrency === "USDT") {
        const min = typeof minimumFractionDigits === "number" ? minimumFractionDigits : 2
        const max = typeof maximumFractionDigits === "number" ? maximumFractionDigits : 2

        const formatted = new Intl.NumberFormat(locale, {
            minimumFractionDigits: min,
            maximumFractionDigits: max,
        }).format(numericAmount)

        // Estilo consistente con el resto
        return `USDT ${formatted}`
    }

    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: safeCurrency,
            minimumFractionDigits,
            maximumFractionDigits,
        }).format(numericAmount)
    } catch (err) {
        console.error("[convertToLocale] Failed to format", {
            amount: numericAmount,
            currency_code: safeCurrency,
            locale,
            err,
        })

        const fallbackDigits =
            typeof minimumFractionDigits === "number" ? minimumFractionDigits : 2

        return `${numericAmount.toFixed(fallbackDigits)} ${safeCurrency}`
    }
}

/** Monedas sin decimales (minor === major) */
const ZERO_DECIMAL = new Set([
    "bif","clp","djf","gnf","jpy","kmf","krw","mga","pyg","rwf",
    "ugx","vnd","vuv","xaf","xof","xpf",
])

export const isZeroDecimal = (currency?: string) =>
    ZERO_DECIMAL.has((currency || "").toLowerCase())

/**
 * Si (y solo si) recibes algo en MINOR units, conviértelo a MAJOR.
 * En tu tienda, los precios de productos están en MAJOR (400 = 400.00),
 * pero el quote de envío te está viniendo en MINOR (1660 = 16.60).
 */
export function toMajor(amountMinor: number | undefined, currency?: string) {
    const a = typeof amountMinor === "number" ? amountMinor : 0
    return isZeroDecimal(currency) ? a : a / 100
}

/** MAJOR → MINOR (útil para Stripe u otros gateways que piden minor) */
export function toMinor(amountMajor: number | undefined, currency?: string) {
    const a = typeof amountMajor === "number" ? amountMajor : 0
    return isZeroDecimal(currency) ? Math.round(a) : Math.round(a * 100)
}
