// /home/willman/WebstormProjects/new/new/storefront/src/lib/helpers/get-product-price.ts
import { HttpTypes } from "@medusajs/types"
import { getPercentageDiff } from "./get-precentage-diff"
import { convertToLocale } from "./money"
import { BaseHit, Hit } from "instantsearch.js"
import { getVariantPriceByCurrency } from "./alt-prices"

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

type PricesForVariant = {
    calculated_price_number: number
    calculated_price: string
    calculated_price_without_tax?: string
    calculated_price_without_tax_number?: number
    original_price_number: number
    original_price: string
    currency_code: string
    price_type?: any
    percentage_diff?: string | null
}

const getAltPricesForVariant = (
    variant: VariantWithPrices,
    currencyCode: string
): PricesForVariant | null => {
    const alt = getVariantPriceByCurrency(variant, currencyCode)
    if (!alt) return null

    return {
        calculated_price_number: alt.amount,
        calculated_price: alt.formatted,
        calculated_price_without_tax: alt.formatted,
        calculated_price_without_tax_number: alt.amount,
        original_price_number: alt.amount,
        original_price: alt.formatted,
        currency_code: currencyCode,
        price_type: undefined,
        percentage_diff: null,
    }
}

export const getPricesForVariant = (variant: any): PricesForVariant | null => {
    if (
        !variant?.calculated_price?.calculated_amount_with_tax &&
        !variant?.calculated_price?.calculated_amount
    ) {
        return null
    }

    // No with_tax present → use calculated_amount
    if (!variant?.calculated_price?.calculated_amount_with_tax) {
        const calculated = variant.calculated_price.calculated_amount
        const original = variant.calculated_price.original_amount

        return {
            calculated_price_number: calculated,
            calculated_price: convertToLocale({
                amount: calculated,
                currency_code: variant.calculated_price.currency_code,
            }),
            calculated_price_without_tax: convertToLocale({
                amount: variant.calculated_price.calculated_amount_without_tax,
                currency_code: variant.calculated_price.currency_code,
            }),
            calculated_price_without_tax_number:
            variant.calculated_price.calculated_amount_without_tax,
            original_price_number: original,
            original_price: convertToLocale({
                amount: original,
                currency_code: variant.calculated_price.currency_code,
            }),
            currency_code: variant.calculated_price.currency_code,
            price_type: variant.calculated_price?.calculated_price?.price_list_type,
            percentage_diff: getPercentageDiff(original, calculated),
        }
    }

    // with_tax present → use *_with_tax consistently
    const calculatedWithTax = variant.calculated_price.calculated_amount_with_tax
    const originalWithTax = variant.calculated_price.original_amount_with_tax

    return {
        calculated_price_number: calculatedWithTax,
        calculated_price: convertToLocale({
            amount: calculatedWithTax,
            currency_code: variant.calculated_price.currency_code,
        }),
        calculated_price_without_tax: convertToLocale({
            amount: variant.calculated_price.calculated_amount_without_tax,
            currency_code: variant.calculated_price.currency_code,
        }),
        calculated_price_without_tax_number:
        variant.calculated_price.calculated_amount_without_tax,
        original_price_number: originalWithTax,
        original_price: convertToLocale({
            amount: originalWithTax,
            currency_code: variant.calculated_price.currency_code,
        }),
        currency_code: variant.calculated_price.currency_code,
        price_type: variant.calculated_price?.calculated_price?.price_list_type,
        percentage_diff: getPercentageDiff(originalWithTax, calculatedWithTax),
    }
}

function sameCurrency(a?: string, b?: string) {
    return (a || "").toUpperCase() === (b || "").toUpperCase()
}

function shouldUseAlt(variant: any, currencyCode?: string) {
    if (!currencyCode) return false
    const base = variant?.calculated_price?.currency_code
    // Si no hay moneda base, asumimos que es alt
    if (!base) return true
    return !sameCurrency(base, currencyCode)
}

function getVariantSortAmount(v: any, currencyCode?: string): number {
    if (currencyCode && shouldUseAlt(v, currencyCode)) {
        const alt = getVariantPriceByCurrency(v as VariantWithPrices, currencyCode)
        if (alt && typeof alt.amount === "number" && Number.isFinite(alt.amount)) {
            return alt.amount
        }
    }

    // fallback: calculated_price
    const withTax = v?.calculated_price?.calculated_amount_with_tax
    const noTax = v?.calculated_price?.calculated_amount

    const n =
        typeof withTax === "number"
            ? withTax
            : typeof noTax === "number"
                ? noTax
                : Infinity

    return Number.isFinite(n) ? n : Infinity
}

export function getProductPrice({
                                    product,
                                    variantId,
                                    currencyCode,
                                }: {
    product: Hit<HttpTypes.StoreProduct> | Partial<Hit<BaseHit>>
    variantId?: string
    currencyCode?: string
}) {
    if (!product || !product.id) {
        throw new Error("No product provided")
    }

    const resolvePrices = (variant: any) => {
        if (!variant) return null

        // Si la moneda pedida es distinta a la base calculada → intentamos alt-prices
        if (currencyCode && shouldUseAlt(variant, currencyCode)) {
            const alt = getAltPricesForVariant(variant as VariantWithPrices, currencyCode)
            if (alt) return alt
        }

        // caso normal (BOB / moneda de región) → calculated_price
        return getPricesForVariant(variant)
    }

    const cheapestVariant = () => {
        if (!product?.variants?.length) return null

        const variants = product.variants as any[]

        const filtered = currencyCode
            ? variants.filter((v) => {
                // Si es la misma moneda que calculated_price → basta calculated_price
                if (!shouldUseAlt(v, currencyCode)) return !!v.calculated_price
                // Si es distinta → necesitamos variants.prices
                return !!getVariantPriceByCurrency(v as any, currencyCode)
            })
            : variants.filter((v) => !!v.calculated_price)

        const pool = filtered.length ? filtered : variants

        return pool
            .slice()
            .sort((a, b) => getVariantSortAmount(a, currencyCode) - getVariantSortAmount(b, currencyCode))[0]
    }

    const cheapestPrice = () => {
        const variant: any = cheapestVariant()
        return resolvePrices(variant)
    }

    const variantPrice = () => {
        if (!variantId) return null

        const variant: any = (product.variants as any[])?.find(
            (v: any) => v.id === variantId || v.sku === variantId
        )

        if (!variant) return null

        return resolvePrices(variant)
    }

    return {
        product,
        cheapestPrice: cheapestPrice(),
        variantPrice: variantPrice(),
        cheapestVariant: cheapestVariant(),
    }
}
