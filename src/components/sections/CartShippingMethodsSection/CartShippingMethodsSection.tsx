// storefront/src/components/sections/CartShippingMethodsSection/CartShippingMethodsSection.tsx
"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import { CheckCircleSolid } from "@medusajs/icons"

import ErrorMessage from "@/components/molecules/ErrorMessage/ErrorMessage"
import { Button } from "@/components/atoms"
import { convertToLocale } from "@/lib/helpers/money"
import { setShippingMethod } from "@/lib/data/cart"
import { CartShippingMethodRow } from "./CartShippingMethodRow"
import { getDeliveryQuote } from "@/lib/data/delivery"

// ➕ add zero-decimal handling and toMajor here (same logic as CartReview)
const ZERO_DECIMAL = new Set([
    "bif","clp","djf","gnf","jpy","kmf","krw","mga","pyg","rwf",
    "ugx","vnd","vuv","xaf","xof","xpf"
])
function toMajor(amount: number | undefined, currency?: string) {
    const a = typeof amount === "number" ? amount : 0
    const code = (currency || "").toLowerCase()
    return ZERO_DECIMAL.has(code) ? a : a / 100
}

export type StoreCardShippingMethod = HttpTypes.StoreCartShippingOption & {
    rules?: unknown
    seller_id?: string | null
    service_zone?: {
        fulfillment_set: {
            type: string
            location?: {
                address?: HttpTypes.StoreOrderAddress | null
            }
        }
    }
}

type ShippingProps = {
    cart: HttpTypes.StoreCart
    availableShippingMethods: StoreCardShippingMethod[] | null
}

const CartShippingMethodsSection: React.FC<ShippingProps> = ({ cart }) => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const isOpen = searchParams.get("step") === "delivery"

    const [quote, setQuote] = useState<{
        amount: number // minor
        currency_code: string
        option_id: string
    } | null>(null)

    const [loadingQuote, setLoadingQuote] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // When we enter the delivery step, fetch the single delivery quote ONCE
    useEffect(() => {
        if (!isOpen) return
        let cancelled = false
        setError(null)
        setLoadingQuote(true)

        getDeliveryQuote(cart.id)
            .then((q) => {
                if (cancelled) return
                if (!q) setError("El envío no está disponible para tu dirección en este momento.")
                else setQuote(q)
            })
            .catch((e: any) => {
                if (cancelled) return
                setError(e?.message || "No se pudo calcular el precio del envío.")
            })
            .finally(() => {
                if (!cancelled) setLoadingQuote(false)
            })

        return () => { cancelled = true }
    }, [cart.id, isOpen])

    useEffect(() => {
        setError(null)
    }, [isOpen])

    const handleConfirmDelivery = async () => {
        if (!quote) return
        try {
            setSaving(true)
            setError(null)

            // seller selection (single-seller cart for now)
            const firstItem = cart.items?.[0] as any
            const sellerId =
                firstItem?.product?.seller_id ||
                firstItem?.product?.seller?.id ||
                firstItem?.seller_id ||
                null

            const res = await setShippingMethod({
                cartId: cart.id,
                shippingMethodId: quote.option_id,
                sellerId,
            })

            if (!res.ok) {
                return setError(res.error?.message || "Error al establecer el método de envío.")
            }

            // ❌ DO NOT call getDeliveryQuote() again here.
            // setShippingMethod() already ensures the override, and calling again
            // can re-trigger the whole flow / duplication.

            router.push(pathname + "?step=payment", { scroll: false })
        } catch (e: any) {
            setError(
                e?.message?.replace("Error setting up the request: ", "") ||
                "Ocurrió un error"
            )
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = () => {
        router.replace(pathname + "?step=delivery")
    }

    const isEditEnabled = !isOpen && !!cart?.shipping_methods?.length

    if (!isOpen) {
        return (
            <div className="border p-4 rounded-sm bg-ui-bg-interactive">
                <div className="flex flex-row items-center justify-between mb-6">
                    <Heading level="h2" className="flex flex-row text-3xl-regular gap-x-2 items-baseline items-center">
                        {(cart.shipping_methods?.length ?? 0) > 0 && <CheckCircleSolid />}
                        Envío
                    </Heading>
                    {isEditEnabled && (
                        <Text>
                            <Button onClick={handleEdit} variant="tonal">Editar</Button>
                        </Text>
                    )}
                </div>

                <div className="text-small-regular">
                    {cart && (cart.shipping_methods?.length ?? 0) > 0 ? (
                        <div className="flex flex-col">
                            {cart.shipping_methods?.map((method) => (
                                <CartShippingMethodRow
                                    key={method.id}
                                    method={method}
                                    currency_code={cart.currency_code}
                                />
                            ))}
                        </div>
                    ) : (
                        <Text className="text-ui-fg-subtle">Aún no se ha seleccionado un método de envío.</Text>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="border p-4 rounded-sm bg-ui-bg-interactive">
            <div className="flex flex-row items-center justify-between mb-6">
                <Heading level="h2" className="flex flex-row text-3xl-regular gap-x-2 items-baseline items-center">
                    Envío
                </Heading>
            </div>

            {loadingQuote && (
                <Text className="text-md text-ui-fg-subtle mb-4">
                    Calculando precio de envío según tu ubicación...
                </Text>
            )}

            {!loadingQuote && quote && (
                <div className="mb-4 border rounded-md p-4">
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                        Enviar a tu dirección
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                        Envío{" "}
                        {convertToLocale({
                            // 🔧 quote.amount is MINOR → convert before display
                            amount: toMajor(quote.amount, quote.currency_code),
                            currency_code: quote.currency_code,
                        })}
                    </Text>
                </div>
            )}

            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
                <div className="flex flex-col mt-4">
                    {cart.shipping_methods?.map((method) => (
                        <CartShippingMethodRow
                            key={method.id}
                            method={method}
                            currency_code={cart.currency_code}
                        />
                    ))}
                </div>
            )}

            <ErrorMessage error={error} data-testid="delivery-option-error-message" />

            <Button
                onClick={handleConfirmDelivery}
                variant="tonal"
                disabled={!quote || loadingQuote}
                loading={saving}
            >
                Continuar al pago
            </Button>
        </div>
    )
}

export default CartShippingMethodsSection