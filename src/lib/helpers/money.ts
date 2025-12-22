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

/** Convierte de minor units a major units */
export function toMajor(amountMinor: number | undefined, currency?: string) {
    const a = typeof amountMinor === "number" ? amountMinor : 0
    return isZeroDecimal(currency) ? a : a / 100
}

/** Formatea un monto en minor units a string localizado */
export function formatMinor(params: Omit<ConvertToLocaleParams, "amount"> & { amountMinor: number }) {
    const major = toMajor(params.amountMinor, params.currency_code)
    return convertToLocale({
        amount: major,
        currency_code: params.currency_code,
        minimumFractionDigits: params.minimumFractionDigits,
        maximumFractionDigits: params.maximumFractionDigits,
        locale: params.locale,
    })
}
