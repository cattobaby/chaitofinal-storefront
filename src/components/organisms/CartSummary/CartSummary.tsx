"use client"

import { convertToLocale } from "@/lib/helpers/money"

export const CartSummary = ({
                                item_total,
                                shipping_total,
                                total,
                                currency_code,
                                tax,
                                discount_total,
                            }: {
    // ✅ En tu DB/tienda estos vienen en MAJOR
    item_total: number
    shipping_total: number
    total: number
    currency_code: string
    tax: number
    discount_total: number
}) => {
    const code = currency_code || "bob"

    return (
        <div>
            <div className="space-y-4 label-md text-secondary mb-4">
                <div className="flex justify-between">
                    <span>Artículos:</span>
                    <span className="text-primary">
            {convertToLocale({ amount: item_total, currency_code: code })}
          </span>
                </div>

                <div className="flex justify-between">
                    <span>Envío:</span>
                    <span className="text-primary">
            {convertToLocale({ amount: shipping_total, currency_code: code })}
          </span>
                </div>

                <div className="flex justify-between">
                    <span>Impuestos:</span>
                    <span className="text-primary">
            {convertToLocale({ amount: tax, currency_code: code })}
          </span>
                </div>

                <div className="flex justify-between">
                    <span>Descuento:</span>
                    <span className="text-primary">
            {convertToLocale({ amount: discount_total, currency_code: code })}
          </span>
                </div>

                <div className="flex justify-between border-t pt-4 items-center">
                    <span>Total:</span>
                    <span className="label-xl text-green-700 font-bold">
            {convertToLocale({ amount: total, currency_code: code })}
          </span>
                </div>
            </div>
        </div>
    )
}
