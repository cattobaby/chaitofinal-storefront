"use client"

import { convertToLocale } from "@/lib/helpers/money"
import { HttpTypes } from "@medusajs/types"
import { getCartItemPriceAmount } from "@/lib/helpers/get-cart-item-price"

type CartSummaryProps = {
    item_total: number
    shipping_total: number
    total: number
    currency_code: string
    tax: number
    discount_total: number
    cart?: HttpTypes.StoreCart // ✅ New: Allows recalculation
    activeCurrencyCode?: string // ✅ New: The visual override
}

export const CartSummary = ({
                                item_total,
                                shipping_total,
                                total,
                                currency_code,
                                tax,
                                discount_total,
                                cart,
                                activeCurrencyCode
                            }: CartSummaryProps) => {
    const displayCurrency = activeCurrencyCode || currency_code || "bob"
    const isUsdt = displayCurrency.toLowerCase() === "usdt"

    // 1. Calculate Item Total (Visual Override)
    let displayItemTotal = item_total
    if (cart && isUsdt) {
        displayItemTotal = cart.items?.reduce((acc, item) => {
            return acc + (getCartItemPriceAmount(item, "usdt") * item.quantity)
        }, 0) || 0
    }

    // 2. Shipping & Tax (Placeholders for your custom logic)
    let displayShipping = shipping_total
    let displayTax = tax
    let displayDiscount = discount_total

    // You can implement your "Different Beast" logic here:
    // if (isUsdt && currency_code === 'bob') {
    //    displayShipping = convertBobToUsdt(shipping_total)
    // }

    // 3. Recalculate Total
    const displayTotal = displayItemTotal + displayShipping + displayTax - displayDiscount

    return (
        <div>
            <div className="space-y-4 label-md text-secondary mb-4">
                <div className="flex justify-between">
                    <span>Artículos:</span>
                    <span className="text-primary">
            {convertToLocale({ amount: displayItemTotal, currency_code: displayCurrency })}
          </span>
                </div>

                <div className="flex justify-between">
                    <span>Envío:</span>
                    <span className="text-primary">
            {convertToLocale({ amount: displayShipping, currency_code: displayCurrency })}
          </span>
                </div>

                <div className="flex justify-between">
                    <span>Impuestos:</span>
                    <span className="text-primary">
            {convertToLocale({ amount: displayTax, currency_code: displayCurrency })}
          </span>
                </div>

                <div className="flex justify-between">
                    <span>Descuento:</span>
                    <span className="text-primary">
            {convertToLocale({ amount: displayDiscount, currency_code: displayCurrency })}
          </span>
                </div>

                <div className="flex justify-between border-t pt-4 items-center">
                    <span>Total:</span>
                    <span className="label-xl text-green-700 font-bold">
            {convertToLocale({ amount: displayTotal, currency_code: displayCurrency })}
          </span>
                </div>
            </div>
        </div>
    )
}