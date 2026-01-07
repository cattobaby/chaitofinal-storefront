import { Button } from "@/components/atoms"
import { CartEmpty, CartItems, CartSummary } from "@/components/organisms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { retrieveCart } from "@/lib/data/cart"
import CartPromotionCode from "../CartReview/CartPromotionCode"

import { retrieveCustomer } from "@/lib/data/customer"
import { redirect } from "next/navigation"

// ✅ Component accepts currencyCode as a prop now
export const Cart = async ({ currencyCode }: { currencyCode: string }) => {
    const customer = await retrieveCustomer()

    if (!customer) {
        redirect("/user/register")
    }

    const cart = await retrieveCart()

    if (!cart || !cart.items?.length) {
        return <CartEmpty />
    }

    return (
        <>
            <div className="col-span-12 lg:col-span-6">
                {/* ✅ Pass currency code to CartItems */}
                <CartItems cart={cart} currencyCode={currencyCode} />
            </div>

            <div className="lg:col-span-2"></div>

            <div className="col-span-12 lg:col-span-4">
                <div className="w-full mb-6 border rounded-sm p-4">
                    <CartPromotionCode cart={cart} />
                </div>

                <div className="border rounded-sm p-4 h-fit">
                    {/* ✅ Pass 'activeCurrencyCode' and 'cart' to enable recalculation */}
                    <CartSummary
                        item_total={(cart as any)?.subtotal ?? 0}
                        shipping_total={(cart as any)?.shipping_total ?? 0}
                        total={(cart as any)?.total ?? 0}
                        currency_code={(cart as any)?.currency_code || "bob"}
                        tax={(cart as any)?.tax_total ?? 0}
                        discount_total={(cart as any)?.discount_total ?? 0}

                        // New Props for override
                        cart={cart}
                        activeCurrencyCode={currencyCode}
                    />

                    <LocalizedClientLink href="/checkout?step=address">
                        <Button className="w-full py-3 flex justify-center items-center">
                            Ir a finalizar compra
                        </Button>
                    </LocalizedClientLink>
                </div>
            </div>
        </>
    )
}