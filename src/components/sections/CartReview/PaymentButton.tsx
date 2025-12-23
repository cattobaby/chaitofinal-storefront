"use client"

import ErrorMessage from "@/components/molecules/ErrorMessage/ErrorMessage"
import { isManual, isStripe } from "../../../lib/constants"
import { placeOrder } from "@/lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useEffect, useState } from "react"
import { Button } from "@/components/atoms"

type PaymentButtonProps = {
    cart: HttpTypes.StoreCart
    "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
                                                         cart,
                                                         "data-testid": dataTestId,
                                                     }) => {
    // Be less strict: DO NOT require cart.email for dev/mock payments
    const notReady =
        !cart ||
        !cart.shipping_address ||
        !cart.billing_address ||
        (cart.shipping_methods?.length ?? 0) < 1

    const paymentSession = cart.payment_collection?.payment_sessions?.[0]
    const providerId = paymentSession?.provider_id

    const isStripeProvider = isStripe(providerId)

    // For dev: treat any non-Stripe provider as "manual" / mock
    const isManualLikeProvider =
        !!paymentSession && (!isStripeProvider || isManual(providerId))

    console.log("[PaymentButton] debug", {
        notReady,
        providerId,
        isStripeProvider,
        isManualLikeProvider,
        hasShippingAddress: !!cart?.shipping_address,
        hasBillingAddress: !!cart?.billing_address,
        shippingMethodsLength: cart?.shipping_methods?.length ?? 0,
        email: cart?.email,
    })

    switch (true) {
        case isStripeProvider:
            return (
                <StripePaymentButton
                    notReady={notReady}
                    cart={cart}
                    data-testid={dataTestId}
                />
            )

        case isManualLikeProvider:
            return (
                <ManualTestPaymentButton
                    notReady={notReady}
                    data-testid={dataTestId}
                />
            )

        default:
            return (
                <Button disabled className="w-full">
                    Selecciona un método de pago
                </Button>
            )
    }
}

const StripePaymentButton = ({
                                 cart,
                                 notReady,
                                 "data-testid": dataTestId,
                             }: {
    cart: HttpTypes.StoreCart
    notReady: boolean
    "data-testid"?: string
}) => {
    const [submitting, setSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [disabled, setDisabled] = useState(true)

    const onPaymentCompleted = async () => {
        try {
            const res = await placeOrder()
            if (!res.ok) {
                setErrorMessage(res.error?.message)
            }
        } catch (error: any) {
            if (error?.message !== "NEXT_REDIRECT") {
                setErrorMessage(
                    error?.message
                        ?.replace("Error setting up the request: ", "")
                        ?.replace("Error al configurar la solicitud: ", "")
                )
            }
        } finally {
            setSubmitting(false)
        }
    }

    const stripe = useStripe()
    const elements = useElements()
    const card = elements?.getElement("card")

    const session = cart.payment_collection?.payment_sessions?.find(
        (s) => s.status === "pending"
    )

    useEffect(() => {
        // @ts-ignore
        setDisabled(!card?._complete)
    }, [card, stripe, elements, cart])

    const handlePayment = async () => {
        setSubmitting(true)

        if (!stripe || !elements || !card || !cart) {
            setSubmitting(false)
            return
        }

        await stripe
            .confirmCardPayment(session?.data.client_secret as string, {
                payment_method: {
                    card: card,
                    billing_details: {
                        name:
                            cart.billing_address?.first_name +
                            " " +
                            cart.billing_address?.last_name,
                        address: {
                            city: cart.billing_address?.city ?? undefined,
                            country: cart.billing_address?.country_code ?? undefined,
                            line1: cart.billing_address?.address_1 ?? undefined,
                            line2: cart.billing_address?.address_2 ?? undefined,
                            postal_code: cart.billing_address?.postal_code ?? undefined,
                            state: cart.billing_address?.province ?? undefined,
                        },
                        email: cart.email,
                        phone: cart.billing_address?.phone ?? undefined,
                    },
                },
            })
            .then(({ error, paymentIntent }) => {
                if (error) {
                    const pi = error.payment_intent

                    if (
                        (pi && pi.status === "requires_capture") ||
                        (pi && pi.status === "succeeded")
                    ) {
                        onPaymentCompleted()
                    }

                    setErrorMessage(error.message || null)
                    return
                }

                if (
                    (paymentIntent && paymentIntent.status === "requires_capture") ||
                    paymentIntent.status === "succeeded"
                ) {
                    return onPaymentCompleted()
                }

                return
            })
    }

    return (
        <>
            <Button
                disabled={disabled || notReady}
                onClick={handlePayment}
                loading={submitting}
                className="w-full"
                data-testid={dataTestId}
            >
                Realizar pedido
            </Button>
            <ErrorMessage
                error={errorMessage}
                data-testid="stripe-payment-error-message"
            />
        </>
    )
}

const ManualTestPaymentButton = ({
                                     notReady,
                                     "data-testid": dataTestId,
                                 }: {
    notReady: boolean
    "data-testid"?: string
}) => {
    const [submitting, setSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const onPaymentCompleted = async () => {
        try {
            const res = await placeOrder()
            if (!res.ok) {
                setErrorMessage(res.error?.message)
            }
        } catch (error: any) {
            if (error?.message !== "NEXT_REDIRECT") {
                setErrorMessage(
                    error?.message
                        ?.replace("Error setting up the request: ", "")
                        ?.replace("Error al configurar la solicitud: ", "")
                )
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handlePayment = () => {
        setSubmitting(true)
        onPaymentCompleted()
    }

    return (
        <>
            <Button
                disabled={notReady}
                onClick={handlePayment}
                className="w-full"
                loading={submitting}
                data-testid={dataTestId}
            >
                Realizar pedido
            </Button>
            <ErrorMessage
                error={errorMessage}
                data-testid="manual-payment-error-message"
            />
        </>
    )
}

export default PaymentButton
