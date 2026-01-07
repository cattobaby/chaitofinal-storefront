import PaymentWrapper from "@/components/organisms/PaymentContainer/PaymentWrapper"
import { CartAddressSection } from "@/components/sections/CartAddressSection/CartAddressSection"
import CartPaymentSection from "@/components/sections/CartPaymentSection/CartPaymentSection"
import CartReview from "@/components/sections/CartReview/CartReview"

import CartShippingMethodsSection from "@/components/sections/CartShippingMethodsSection/CartShippingMethodsSection"
import { retrieveCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import { listCartShippingMethods } from "@/lib/data/fulfillment"
import { listCartPaymentMethods } from "@/lib/data/payment"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

// ✅ 1. Imports for Server Currency
import { headers } from "next/headers"
import { getCurrencyCodeFromCookieHeader } from "@/lib/server/currency"

export const metadata: Metadata = {
    title: "Finalizar compra",
    description: "Mi carrito - Finalizar compra",
}

export default async function CheckoutPage() {
    // ✅ 2. Read Cookie
    const headersList = await headers()
    const cookieHeader = headersList.get("cookie")
    const currencyCode = getCurrencyCodeFromCookieHeader(cookieHeader)

    return (
        <Suspense
            fallback={
                <div className="container flex items-center justify-center">
                    Cargando...
                </div>
            }
        >
            {/* ✅ 3. Pass it down */}
            <CheckoutPageContent currencyCode={currencyCode} />
        </Suspense>
    )
}

// ✅ 4. Accept the Prop
async function CheckoutPageContent({ currencyCode }: { currencyCode: string }) {
    const cart = await retrieveCart()

    if (!cart) {
        return notFound()
    }

    const shippingMethods = await listCartShippingMethods(cart.id, false)
    const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")
    const customer = await retrieveCustomer()

    return (
        <PaymentWrapper cart={cart}>
            <main className="container">
                <div className="grid lg:grid-cols-11 gap-8">
                    <div className="flex flex-col gap-4 lg:col-span-6">
                        <CartAddressSection cart={cart} customer={customer} />
                        <CartShippingMethodsSection
                            cart={cart}
                            availableShippingMethods={shippingMethods as any}
                        />
                        <CartPaymentSection
                            cart={cart}
                            availablePaymentMethods={paymentMethods}
                        />
                    </div>

                    <div className="lg:col-span-5">
                        {/* ✅ 5. Pass it to Review (Summary) */}
                        <CartReview cart={cart} currencyCode={currencyCode} />
                    </div>
                </div>
            </main>
        </PaymentWrapper>
    )
}