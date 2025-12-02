"use client"

import PaymentButton from "./PaymentButton"
import { CartItems } from "./CartItems"
import { CartSummary } from "@/components/organisms"

// currencies without minor units
const ZERO_DECIMAL = new Set([
    "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf",
    "ugx", "vnd", "vuv", "xaf", "xof", "xpf"
])

function toMajor(amount: number | undefined, currency?: string) {
    const a = typeof amount === "number" ? amount : 0
    const code = (currency || "").toLowerCase()
    return ZERO_DECIMAL.has(code) ? a : a / 100
}

const Review = ({ cart }: { cart: any }) => {
    const paidByGiftcard =
        cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

    // Prefer cart.totals; fall back to primitive totals we request (+subtotal, +shipping_total, ...)
    const raw = cart?.totals
        ? {
            item_total:
                cart?.totals?.subtotal ??
                cart?.subtotal ??
                0,
            shipping_total:
                cart?.totals?.shipping_total ??
                cart?.shipping_total ??
                0,
            total:
                cart?.totals?.total ??
                cart?.total ??
                0,
            tax_total:
                cart?.totals?.tax_total ??
                cart?.tax_total ??
                0,
            discount_total:
                cart?.totals?.discount_total ??
                cart?.discount_total ??
                0,
        }
        : {
            item_total: cart?.subtotal ?? 0,
            shipping_total: cart?.shipping_total ?? 0,
            total: cart?.total ?? 0,
            tax_total: cart?.tax_total ?? 0,
            discount_total: cart?.discount_total ?? 0,
        }

    // Convert MINOR → MAJOR before rendering
    const resolvedTotals = {
        item_total: toMajor(raw.item_total, cart?.currency_code),
        shipping_total: toMajor(raw.shipping_total, cart?.currency_code),
        total: toMajor(raw.total, cart?.currency_code),
        tax_total: toMajor(raw.tax_total, cart?.currency_code),
        discount_total: toMajor(raw.discount_total, cart?.currency_code),
    }

    // ────────────────────────────────────────────────────────────────
    // BNB PAYMENT SESSION / QR
    // ────────────────────────────────────────────────────────────────
    const paymentSessions = cart?.payment_collection?.payment_sessions || []

    const activeSession = paymentSessions.find((s: any) =>
        ["pending", "requires_more", "authorized"].includes(s?.status)
    )

    const isBnb =
        !!activeSession &&
        (
            activeSession.provider_id === "bnb" ||
            activeSession.provider_id === "pp_bnb_bnb" ||
            activeSession.provider_id?.startsWith?.("pp_bnb")
        )

    const bnbData = isBnb ? activeSession?.data || {} : null
    const bnbQrBase64 = bnbData?.qr
    const bnbQrId = bnbData?.bnb_qr_id || bnbData?.id

    console.log("[CartReview] cart prop summary ", {
        id: cart?.id,
        itemsLength: cart?.items?.length || 0,
        items: cart?.items,
        totals: cart?.totals,
        primitives: {
            subtotal: cart?.subtotal,
            shipping_total: cart?.shipping_total,
            total: cart?.total,
            tax_total: cart?.tax_total,
            discount_total: cart?.discount_total,
        },
        resolvedTotals,
        shipping_methods: cart?.shipping_methods,
        payment_collection: cart?.payment_collection,
    })

    console.log("[CartReview] payment / BNB debug ", {
        hasPaymentCollection: !!cart?.payment_collection,
        sessions: paymentSessions,
        activeSession,
        isBnb,
        hasQr: !!bnbQrBase64,
        bnbQrId,
    })

    const hasShippingAddress = !!cart?.shipping_address
    const shippingMethodsLength = cart?.shipping_methods?.length || 0
    const hasPaymentCollection = !!cart?.payment_collection

    const previousStepsCompleted =
        hasShippingAddress &&
        shippingMethodsLength > 0 &&
        (hasPaymentCollection || paidByGiftcard)

    console.log("[CartReview] previousStepsCompleted ", {
        hasShippingAddress,
        shippingMethodsLength,
        hasPaymentCollection,
        paidByGiftcard,
        previousStepsCompleted,
    })

    return (
        <div>
            <div className="w-full mb-6">
                <CartItems cart={cart} />
            </div>

            <div className="w-full mb-6 border rounded-sm p-4">
                <CartSummary
                    // CartSummary expects MAJOR units
                    item_total={resolvedTotals.item_total}
                    shipping_total={resolvedTotals.shipping_total}
                    total={resolvedTotals.total}
                    currency_code={cart?.currency_code || ""}
                    tax={resolvedTotals.tax_total}
                    discount_total={resolvedTotals.discount_total}
                />
            </div>

            {isBnb && bnbQrBase64 && (
                <div className="w-full mb-6 border rounded-sm p-4 bg-ui-bg-subtle">
                    <h3 className="text-lg font-semibold mb-2">
                        Paga con QR del Banco Nacional de Bolivia
                    </h3>
                    <p className="text-sm text-ui-fg-subtle mb-4">
                        Escanea este código con la app del BNB para pagar tu pedido.
                        Después de que el banco marque el QR como usado, podrás finalizar tu
                        compra.
                    </p>
                    <div className="flex justify-center mb-2">
                        <img
                            src={`data:image/png;base64,${bnbQrBase64}`}
                            alt="QR de pago BNB"
                            className="w-48 h-48"
                        />
                    </div>
                    {bnbQrId && (
                        <p className="text-xs text-ui-fg-muted text-center">
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

export default Review
