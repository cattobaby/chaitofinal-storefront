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
