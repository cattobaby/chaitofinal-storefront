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

export type StoreCardShippingMethod = HttpTypes.StoreCartShippingOption & {
    // still here just so the prop type is compatible with the existing usage
    rules?: unknown
    seller_id?: string | null
    service_zone?: {
        fulfillment_set: {
            type: string // "shipping" | "pickup"
            location?: {
                address?: HttpTypes.StoreOrderAddress | null
            }
        }
    }
}

type ShippingProps = {
    cart: HttpTypes.StoreCart
    // We receive this but we won't use it anymore – we drive delivery by env + GPS.
    availableShippingMethods: StoreCardShippingMethod[] | null
}

const CartShippingMethodsSection: React.FC<ShippingProps> = ({ cart }) => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const isOpen = searchParams.get("step") === "delivery"

    const [quote, setQuote] = useState<{
        amount: number
        currency_code: string
        option_id: string
    } | null>(null)

    const [loadingQuote, setLoadingQuote] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // When we enter the delivery step, fetch the single delivery quote
    useEffect(() => {
        if (!isOpen) {
            return
        }

        let cancelled = false
        setError(null)
        setLoadingQuote(true)

        getDeliveryQuote(cart.id)
            .then((q) => {
                if (cancelled) return
                if (!q) {
                    setError("Delivery is not available for your address right now.")
                } else {
                    setQuote(q)
                }
            })
            .catch((e: any) => {
                if (cancelled) return
                setError(e?.message || "Could not calculate delivery price.")
            })
            .finally(() => {
                if (!cancelled) setLoadingQuote(false)
            })

        return () => {
            cancelled = true
        }
    }, [cart.id, isOpen])

    useEffect(() => {
        // clear errors when the step is toggled
        setError(null)
    }, [isOpen])

    const handleConfirmDelivery = async () => {
        if (!quote) return

        try {
            setSaving(true)
            setError(null)

            // Take the seller from the first line item (single-seller carts for now)
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
                return setError(res.error?.message || "Failed to set delivery method.")
            }

            router.push(pathname + "?step=payment", { scroll: false })
        } catch (e: any) {
            setError(
                e?.message?.replace("Error setting up the request: ", "") ||
                "An error occurred"
            )
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = () => {
        router.replace(pathname + "?step=delivery")
    }

    const isEditEnabled = !isOpen && !!cart?.shipping_methods?.length

    /* CLOSED STATE (summary) */
    if (!isOpen) {
        return (
            <div className="border p-4 rounded-sm bg-ui-bg-interactive">
                <div className="flex flex-row items-center justify-between mb-6">
                    <Heading
                        level="h2"
                        className="flex flex-row text-3xl-regular gap-x-2 items-baseline items-center"
                    >
                        {(cart.shipping_methods?.length ?? 0) > 0 && <CheckCircleSolid />}
                        Delivery
                    </Heading>
                    {isEditEnabled && (
                        <Text>
                            <Button onClick={handleEdit} variant="tonal">
                                Edit
                            </Button>
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
                        <Text className="text-ui-fg-subtle">
                            No delivery method selected yet.
                        </Text>
                    )}
                </div>
            </div>
        )
    }

    /* OPEN STATE (user is in delivery step) */
    return (
        <div className="border p-4 rounded-sm bg-ui-bg-interactive">
            <div className="flex flex-row items-center justify-between mb-6">
                <Heading
                    level="h2"
                    className="flex flex-row text-3xl-regular gap-x-2 items-baseline items-center"
                >
                    Delivery
                </Heading>
            </div>

            {loadingQuote && (
                <Text className="text-md text-ui-fg-subtle mb-4">
                    Calculating delivery price from your location…
                </Text>
            )}

            {!loadingQuote && quote && (
                <div className="mb-4 border rounded-md p-4">
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                        Deliver to your address
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                        Delivery{" "}
                        {convertToLocale({
                            amount: quote.amount,
                            currency_code: quote.currency_code,
                        })}
                    </Text>
                </div>
            )}

            {/* Show any already-attached shipping methods (so you can remove/change later) */}
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

            <ErrorMessage
                error={error}
                data-testid="delivery-option-error-message"
            />

            <Button
                onClick={handleConfirmDelivery}
                variant="tonal"
                disabled={!quote || loadingQuote}
                loading={saving}
            >
                Continue to payment
            </Button>
        </div>
    )
}

export default CartShippingMethodsSection
