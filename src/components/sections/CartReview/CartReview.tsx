"use client"

import PaymentButton from "./PaymentButton"
import { CartItems } from "./CartItems"
import { CartSummary } from "@/components/organisms/CartSummary/CartSummary" // Asegúrate de la ruta correcta

const CartReview = ({
                        cart,
                        currencyCode,
                    }: {
    cart: any
    currencyCode: string
}) => {
    const paidByGiftcard =
        cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

    const raw = cart?.totals
        ? {
            item_total: cart?.totals?.subtotal ?? cart?.subtotal ?? 0,
            shipping_total: cart?.totals?.shipping_total ?? cart?.shipping_total ?? 0,
            total: cart?.totals?.total ?? cart?.total ?? 0,
            tax_total: cart?.totals?.tax_total ?? cart?.tax_total ?? 0,
            discount_total: cart?.totals?.discount_total ?? cart?.discount_total ?? 0,
        }
        : {
            item_total: cart?.subtotal ?? 0,
            shipping_total: cart?.shipping_total ?? 0,
            total: cart?.total ?? 0,
            tax_total: cart?.tax_total ?? 0,
            discount_total: cart?.discount_total ?? 0,
        }

    const paymentSessions = cart?.payment_collection?.payment_sessions || []
    const activeSession = paymentSessions.find((s: any) =>
        ["pending", "requires_more", "authorized"].includes(s?.status)
    )

    const isBnb =
        !!activeSession &&
        (activeSession.provider_id === "bnb" ||
            activeSession.provider_id === "pp_bnb_bnb" ||
            activeSession.provider_id?.startsWith?.("pp_bnb"))

    const bnbData = isBnb ? activeSession?.data || {} : null
    const bnbQrBase64 = bnbData?.qr
    const bnbQrId = bnbData?.bnb_qr_id || bnbData?.id

    const hasShippingAddress = !!cart?.shipping_address
    const shippingMethodsLength = cart?.shipping_methods?.length || 0
    const hasPaymentCollection = !!cart?.payment_collection

    const previousStepsCompleted =
        hasShippingAddress &&
        shippingMethodsLength > 0 &&
        (hasPaymentCollection || paidByGiftcard)

    return (
        <div>
            <div className="w-full mb-6">
                <CartItems cart={cart} currencyCode={currencyCode} />
            </div>

            <div className="w-full mb-6 border rounded-sm p-4">
                <CartSummary
                    item_total={raw.item_total}
                    shipping_total={raw.shipping_total}
                    total={raw.total}
                    currency_code={cart?.currency_code || "bob"}
                    tax={raw.tax_total}
                    discount_total={raw.discount_total}
                    cart={cart}
                    activeCurrencyCode={currencyCode}
                />
            </div>

            {isBnb && bnbQrBase64 && (
                <div className="w-full mb-6 border border-green-200 rounded-sm p-4 bg-green-50">
                    <h3 className="text-lg font-semibold mb-2 text-green-900">
                        Paga con QR del Banco Nacional de Bolivia
                    </h3>
                    <p className="text-sm text-green-800 mb-4">
                        Escanea este código con la app del BNB para pagar tu pedido.
                    </p>
                    <div className="flex justify-center mb-2">
                        <img
                            src={`data:image/png;base64,${bnbQrBase64}`}
                            alt="QR de pago BNB"
                            className="w-48 h-48 mix-blend-multiply"
                        />
                    </div>
                    {bnbQrId && (
                        <p className="text-xs text-green-800 text-center">
                            ID de pago BNB: {bnbQrId}
                        </p>
                    )}
                </div>
            )}

            {previousStepsCompleted && (
                <PaymentButton cart={cart} data-testid="submit-order-button" />
            )}
        </div>
    )
}

export default CartReview // ✅ Export por defecto corregido