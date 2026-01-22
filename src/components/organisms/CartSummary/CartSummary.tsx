"use client"

import { convertToLocale } from "@/lib/helpers/money"
import { HttpTypes } from "@medusajs/types"
import { getCartItemPriceAmount } from "@/lib/helpers/get-cart-item-price"
import { useEffect } from "react"

type CartSummaryProps = {
    item_total: number
    shipping_total: number
    total: number
    currency_code: string
    tax: number
    discount_total: number
    cart?: HttpTypes.StoreCart
    activeCurrencyCode?: string
}

export const CartSummary = ({
                                item_total,
                                shipping_total,
                                total,
                                currency_code,
                                tax,
                                discount_total,
                                cart,
                                activeCurrencyCode,
                            }: CartSummaryProps) => {
    const displayCurrency = activeCurrencyCode || currency_code || "bob"
    const isUsdt = displayCurrency.toLowerCase() === "usdt"

    // 1. ITEMS: Recalcular SIEMPRE sumando item por item.
    // Esto limpia cualquier "basura" (como envíos duplicados) que el backend agregue al subtotal del carrito.
    let displayItemTotal = 0

    if (cart?.items && cart.items.length > 0) {
        displayItemTotal = cart.items.reduce((acc, item) => {
            // 🛠️ FIX TS: Pasamos 'currency_code' en lugar de undefined.
            // Si es USDT forzamos "usdt", si no, usamos la moneda del carrito.
            const codeToUse = isUsdt ? "usdt" : currency_code

            const price = getCartItemPriceAmount(item, codeToUse)
            return acc + (price * item.quantity)
        }, 0)
    } else {
        // Fallback por si no hay items cargados
        displayItemTotal = item_total
    }

    // 2. ENVÍO: Redondeo matemático simple sobre el valor crudo.
    // Ej: 7.28 -> 7.  6.0 -> 6.
    const displayShipping = Math.round(shipping_total)

    // 3. TAX & DISCOUNT
    const displayTax = tax
    const displayDiscount = discount_total

    // 4. TOTAL VISUAL: Suma limpia de componentes saneados
    // 111 (Items) + 7 (Envío) = 118
    const displayTotal = displayItemTotal + displayShipping + displayTax - displayDiscount

    // 🔍 DEBUG: Log para confirmar el ID de la orden si existiera, o del carrito
    useEffect(() => {
        console.log("[CartSummary CLEAN] ---------------------------------")
        console.log(`🆔 Cart ID: ${cart?.id}`)
        console.log(`📦 Items (Backend Dirty): ${item_total} vs (Calculado Clean): ${displayItemTotal}`)
        console.log(`🚚 Envío: ${shipping_total} -> ${displayShipping}`)
        console.log(`✨ Total Visual: ${displayTotal}`)
        console.log("-------------------------------------------------")
    }, [cart?.id, item_total, displayItemTotal, shipping_total, displayShipping, displayTotal])

    return (
        <div>
            <div className="space-y-4 label-md text-secondary mb-4">
                <div className="flex justify-between">
                    <span>Artículos:</span>
                    <span className="text-primary">
            {convertToLocale({
                amount: displayItemTotal,
                currency_code: displayCurrency,
            })}
          </span>
                </div>

                <div className="flex justify-between">
                    <span>Envío:</span>
                    <span className="text-primary">
            {convertToLocale({
                amount: displayShipping,
                currency_code: displayCurrency,
            })}
          </span>
                </div>

                <div className="flex justify-between">
                    <span>Impuestos:</span>
                    <span className="text-primary">
            {convertToLocale({
                amount: displayTax,
                currency_code: displayCurrency,
            })}
          </span>
                </div>

                <div className="flex justify-between">
                    <span>Descuento:</span>
                    <span className="text-primary">
            {convertToLocale({
                amount: displayDiscount,
                currency_code: displayCurrency,
            })}
          </span>
                </div>

                <div className="flex justify-between border-t pt-4 items-center">
                    <span>Total:</span>
                    <span className="label-xl text-green-700 font-bold">
            {convertToLocale({
                amount: displayTotal,
                currency_code: displayCurrency,
            })}
          </span>
                </div>
            </div>
        </div>
    )
}