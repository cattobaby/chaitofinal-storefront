// storefront/src/components/sections/CartShippingMethodsSection/CartShippingMethodRow.tsx
"use client"

import { Button } from "@/components/atoms"
import { BinIcon } from "@/icons"
import { removeShippingMethod } from "@/lib/data/cart"
import { convertToLocale } from "@/lib/helpers/money"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

// ➕ same helper as elsewhere
const ZERO_DECIMAL = new Set([
    "bif","clp","djf","gnf","jpy","kmf","krw","mga","pyg","rwf",
    "ugx","vnd","vuv","xaf","xof","xpf"
])
function toMajor(amount: number | undefined, currency?: string) {
    const a = typeof amount === "number" ? amount : 0
    const code = (currency || "").toLowerCase()
    return ZERO_DECIMAL.has(code) ? a : a / 100
}

export const CartShippingMethodRow = ({
                                          method,
                                          currency_code,
                                      }: {
    method: HttpTypes.StoreCartShippingMethod
    currency_code: string
}) => {
    const handleRemoveShippingMethod = async () => {
        await removeShippingMethod(method.id)
    }

    const amountMinor =
        typeof method?.amount === "number" && !Number.isNaN(method.amount)
            ? method.amount
            : 0

    const safeCurrencyCode =
        typeof currency_code === "string" && currency_code.trim() !== ""
            ? currency_code
            : "BOB"

    const amountMajor = toMajor(amountMinor, safeCurrencyCode)

    return (
        <div className="mb-4 border rounded-md p-4 flex items-center justify-between">
            <div>
                <Text className="txt-medium-plus text-ui-fg-base mb-1">Method</Text>
                <Text className="txt-medium text-ui-fg-subtle">
                    {method?.name}{" "}
                    {convertToLocale({
                        amount: amountMajor,
                        currency_code: safeCurrencyCode,
                    })}
                </Text>
            </div>

            <Button
                variant="tonal"
                size="small"
                className="p-2"
                onClick={handleRemoveShippingMethod}
            >
                <BinIcon size={16} />
            </Button>
        </div>
    )
}
