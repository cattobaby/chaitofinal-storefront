"use client"

import { Button } from "@/components/atoms"
import { BinIcon } from "@/icons"
import { removeShippingMethod } from "@/lib/data/cart"
import { convertToLocale } from "@/lib/helpers/money"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

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

    const amount =
        typeof method?.amount === "number" && Number.isFinite(method.amount)
            ? method.amount
            : 0

    const safeCurrencyCode =
        typeof currency_code === "string" && currency_code.trim() !== ""
            ? currency_code
            : "bob"

    return (
        <div className="mb-4 border rounded-md p-4 flex items-center justify-between">
            <div>
                <Text className="txt-medium-plus text-ui-fg-base mb-1">Método</Text>
                <Text className="txt-medium text-ui-fg-subtle">
                    {method?.name}{" "}
                    {convertToLocale({
                        amount, // ✅ MAJOR
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
