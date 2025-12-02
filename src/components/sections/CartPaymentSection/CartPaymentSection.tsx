"use client"

import ErrorMessage from "@/components/molecules/ErrorMessage/ErrorMessage"
import { initiatePaymentSession } from "@/lib/data/cart"
import { RadioGroup } from "@headlessui/react"
import {
    isStripe as isStripeFunc,
    paymentInfoMap,
} from "../../../lib/constants"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import PaymentContainer, {
    StripeCardContainer,
} from "../../organisms/PaymentContainer/PaymentContainer"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/atoms"

type StoreCardPaymentMethod = any & {
    service_zone?: {
        fulfillment_set: {
            type: string
        }
    }
}

// Map a session provider_id (pp_*) to the corresponding module id used by the picker
const normalizeProviderIdForPicker = (sessionProviderId?: string) => {
    if (!sessionProviderId) return ""
    if (sessionProviderId.startsWith("pp_card_stripe-connect")) return "stripe-connect"
    if (sessionProviderId === "pp_bnb_bnb" || sessionProviderId.startsWith("pp_bnb")) return "bnb"
    // If it's already a module id, return as-is
    return sessionProviderId
}

const CartPaymentSection = ({
                                cart,
                                availablePaymentMethods,
                            }: {
    cart: any
    availablePaymentMethods: StoreCardPaymentMethod[] | null
}) => {
    const activeSession = cart.payment_collection?.payment_sessions?.find(
        (paymentSession: any) => paymentSession.status === "pending"
    )

    // Default selection: active session mapped to module id (if any); else empty
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
        normalizeProviderIdForPicker(activeSession?.provider_id)
    )

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [cardBrand, setCardBrand] = useState<string | null>(null)
    const [cardComplete, setCardComplete] = useState(false)

    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const isOpen = searchParams.get("step") === "payment"

    const isStripe = isStripeFunc(selectedPaymentMethod)
    const paidByGiftcard =
        cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

    const paymentReady =
        (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams)
            params.set(name, value)
            return params.toString()
        },
        [searchParams]
    )

    const handleEdit = () => {
        router.push(pathname + "?" + createQueryString("step", "payment"), {
            scroll: false,
        })
    }

    const handleSubmit = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const shouldInputCard =
                isStripeFunc(selectedPaymentMethod) && !activeSession

            const sessionMatchesSelection =
                normalizeProviderIdForPicker(activeSession?.provider_id) === selectedPaymentMethod

            // Initiate a session for the selected MODULE id if no matching active session
            if (!sessionMatchesSelection) {
                await initiatePaymentSession(cart, {
                    provider_id: selectedPaymentMethod, // <-- module id: "stripe-connect" or "bnb"
                })
            }

            if (!shouldInputCard) {
                return router.push(
                    pathname + "?" + createQueryString("step", "review"),
                    {
                        scroll: false,
                    }
                )
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const setPaymentMethod = async (method: string) => {
        setError(null)
        setSelectedPaymentMethod(method)
        // For Stripe we usually want a session ready so the card input mounts
        if (isStripeFunc(method)) {
            await initiatePaymentSession(cart, {
                provider_id: method, // <-- module id
            })
        }
    }

    useEffect(() => {
        setError(null)
    }, [isOpen])

    const isEditEnabled =
        !isOpen && !!cart?.payment_collection?.payment_sessions?.length

    // ensure the picker shows something valid if nothing is selected but there are methods
    useEffect(() => {
        if (!selectedPaymentMethod && availablePaymentMethods?.length) {
            setSelectedPaymentMethod(availablePaymentMethods[0].id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availablePaymentMethods])

    return (
        <div className="border p-4 rounded-sm bg-ui-bg-interactive">
            <div className="flex flex-row items-center justify-between mb-6">
                <Heading
                    level="h2"
                    className="flex flex-row text-3xl-regular gap-x-2 items-baseline items-center"
                >
                    {!isOpen && paymentReady && <CheckCircleSolid />}
                    Payment
                </Heading>
                {isEditEnabled && (
                    <Text>
                        <Button onClick={handleEdit} variant="tonal">
                            Edit
                        </Button>
                    </Text>
                )}
            </div>
            <div>
                <div className={isOpen ? "block" : "hidden"}>
                    {!paidByGiftcard && availablePaymentMethods?.length && (
                        <>
                            <RadioGroup
                                value={selectedPaymentMethod}
                                onChange={(value: string) => setPaymentMethod(value)}
                            >
                                {availablePaymentMethods.map((paymentMethod) => (
                                    <div key={paymentMethod.id}>
                                        {isStripeFunc(paymentMethod.id) ? (
                                            <StripeCardContainer
                                                paymentProviderId={paymentMethod.id}
                                                selectedPaymentOptionId={selectedPaymentMethod}
                                                paymentInfoMap={paymentInfoMap}
                                                setCardBrand={setCardBrand}
                                                setError={setError}
                                                setCardComplete={setCardComplete}
                                            />
                                        ) : (
                                            <PaymentContainer
                                                paymentInfoMap={paymentInfoMap}
                                                paymentProviderId={paymentMethod.id}
                                                selectedPaymentOptionId={selectedPaymentMethod}
                                            />
                                        )}
                                    </div>
                                ))}
                            </RadioGroup>
                        </>
                    )}

                    {paidByGiftcard && (
                        <div className="flex flex-col w-1/3">
                            <Text className="txt-medium-plus text-ui-fg-base mb-1">
                                Payment method
                            </Text>
                            <Text
                                className="txt-medium text-ui-fg-subtle"
                                data-testid="payment-method-summary"
                            >
                                Gift card
                            </Text>
                        </div>
                    )}

                    <ErrorMessage
                        error={error}
                        data-testid="payment-method-error-message"
                    />

                    <Button
                        onClick={handleSubmit}
                        variant="tonal"
                        loading={isLoading}
                        disabled={
                            (isStripe && !cardComplete) ||
                            (!selectedPaymentMethod && !paidByGiftcard)
                        }
                    >
                        {!activeSession && isStripeFunc(selectedPaymentMethod)
                            ? " Enter card details"
                            : "Continue to review"}
                    </Button>
                </div>

                <div className={isOpen ? "hidden" : "block"}>
                    {cart && paymentReady && activeSession ? (
                        <div className="flex items-start gap-x-1 w-full">
                            <div className="flex flex-col w-1/3">
                                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                                    Payment method
                                </Text>
                                <Text
                                    className="txt-medium text-ui-fg-subtle"
                                    data-testid="payment-method-summary"
                                >
                                    {paymentInfoMap[activeSession?.provider_id]?.title ||
                                        paymentInfoMap[normalizeProviderIdForPicker(activeSession?.provider_id)]?.title ||
                                        activeSession?.provider_id}
                                </Text>
                            </div>
                            <div className="flex flex-col w-1/3">
                                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                                    Payment details
                                </Text>
                                <div
                                    className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                                    data-testid="payment-details-summary"
                                >
                                    <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                                        {paymentInfoMap[selectedPaymentMethod]?.icon || (
                                            <CreditCard />
                                        )}
                                    </Container>
                                    <Text>
                                        {isStripeFunc(selectedPaymentMethod) && cardBrand
                                            ? cardBrand
                                            : "Another step will appear"}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    ) : paidByGiftcard ? (
                        <div className="flex flex-col w-1/3">
                            <Text className="txt-medium-plus text-ui-fg-base mb-1">
                                Payment method
                            </Text>
                            <Text
                                className="txt-medium text-ui-fg-subtle"
                                data-testid="payment-method-summary"
                            >
                                Gift card
                            </Text>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

export default CartPaymentSection
