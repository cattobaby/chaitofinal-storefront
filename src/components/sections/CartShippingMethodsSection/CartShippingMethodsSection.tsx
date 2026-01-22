"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import { CheckCircleSolid } from "@medusajs/icons"

import ErrorMessage from "@/components/molecules/ErrorMessage/ErrorMessage"
import { Button } from "@/components/atoms"
import { convertToLocale, toMajor } from "@/lib/helpers/money"
import { setShippingMethod } from "@/lib/data/cart"
import { CartShippingMethodRow } from "./CartShippingMethodRow"

import {
    calculateShippingOptionQuote,
    listPickupLocations,
    recommendDelivery,
    type PickupLocation,
    type DeliveryRecommendation,
} from "@/lib/data/shipping"

function mkDebugId(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export type StoreCardShippingMethod = HttpTypes.StoreCartShippingOption & {
    rules?: any
    seller_id?: string | null
    service_zone?: {
        fulfillment_set?: {
            type?: string
            location?: { address?: HttpTypes.StoreOrderAddress | null }
        }
    }
}

type ShippingProps = {
    cart: HttpTypes.StoreCart
    availableShippingMethods: StoreCardShippingMethod[] | null
}

function pickDeliveryOption(options: StoreCardShippingMethod[] | null) {
    const list = options || []
    const shipping = list.filter((o) => o?.service_zone?.fulfillment_set?.type === "shipping")
    return shipping[0] || null
}

function extractQuoteNumber(q: any): number | null {
    const candidates = [
        q?.amount,
        q?.calculated_amount,
        q?.calculated_price?.calculated_amount,
        q?.shipping_option?.calculated_price?.calculated_amount,
        q?.shipping_option?.calculated_amount,
    ]
    for (const v of candidates) {
        if (typeof v === "number" && Number.isFinite(v)) return v
    }
    return null
}

// ✅ FIXED EXCHANGE RATE (USDT Calculation)
const EXCHANGE_RATE = 6.96

const CartShippingMethodsSection: React.FC<ShippingProps> = ({ cart, availableShippingMethods }) => {
    const debug_id = useMemo(() => mkDebugId("ship_ui"), [])
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const isOpen = searchParams.get("step") === "delivery"

    const deliveryOptionFromStore = useMemo(
        () => pickDeliveryOption(availableShippingMethods),
        [availableShippingMethods]
    )

    const [mode, setMode] = useState<"delivery" | "pickup">("delivery")

    const [deliveryQuoteMinor, setDeliveryQuoteMinor] = useState<number | null>(null)
    const [deliveryQuoteMajor, setDeliveryQuoteMajor] = useState<number | null>(null)

    const [deliveryOptionId, setDeliveryOptionId] = useState<string | null>(null)
    const [deliveryReco, setDeliveryReco] = useState<DeliveryRecommendation | null>(null)

    const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([])
    const [selectedPickup, setSelectedPickup] = useState<PickupLocation | null>(null)

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ✅ 1. Determine USDT Mode from Cookie
    const [displayCurrency, setDisplayCurrency] = useState(cart.currency_code || "bob")

    useEffect(() => {
        if (typeof document !== 'undefined') {
            const match = document.cookie.match(/chaito_currency=([^;]+)/)
            if (match && match[1]) {
                setDisplayCurrency(match[1])
            }
        }
    }, [isOpen])

    const isUsdt = displayCurrency.toLowerCase() === "usdt"

    // ✅ 2. Conversion Helper (Visual Only)
    const getDisplayAmount = (amountMajor: number | null) => {
        if (amountMajor == null) return 0
        return isUsdt ? amountMajor / EXCHANGE_RATE : amountMajor
    }

    // 🔍 LOG INICIAL
    useEffect(() => {
        if (isOpen) {
            console.log("[🔍 SHIPPING DEBUG] Component Mounted/Open", {
                cartId: cart.id,
                currency: displayCurrency,
                currentMode: mode
            })
        }
    }, [isOpen, cart.id, displayCurrency, mode])

    // --- EFECTO DE CÁLCULO DE DELIVERY ---
    useEffect(() => {
        if (!isOpen) return
        if (mode !== "delivery") return

        let cancelled = false
        const t0 = Date.now()
        setError(null)
        setLoading(true)

        const run = async () => {
            console.log("[🔍 SHIPPING DEBUG] Starting Delivery Calculation...")
            try {
                const reco = await recommendDelivery(cart.id)
                if (!cancelled) setDeliveryReco(reco)

                const recoOptionId = (reco as any)?.shipping_option_id ?? (reco as any)?.optionId ?? null
                const optionId: string | null = recoOptionId || deliveryOptionFromStore?.id || null

                console.log("[🔍 SHIPPING DEBUG] Delivery Recommendation:", { reco, selectedOptionId: optionId })

                if (!cancelled) setDeliveryOptionId(optionId)

                if (!optionId) {
                    console.warn("[🔍 SHIPPING DEBUG] No delivery option ID found!")
                    return
                }

                const q = await calculateShippingOptionQuote({
                    cartId: cart.id,
                    optionId,
                    data: {
                        cart_id: cart.id,
                        source: "delivery_recommendation",
                        ...(reco?.stock_location_id ? { stock_location_id: reco.stock_location_id } : {}),
                        ...(reco?.distance_km != null ? { distance_km: reco.distance_km } : {}),
                    },
                })

                const minor = extractQuoteNumber(q)
                if (minor == null) throw new Error("No se pudo interpretar el quote del envío.")

                const major = toMajor(minor, cart.currency_code)

                if (!cancelled) {
                    setDeliveryQuoteMinor(minor)
                    setDeliveryQuoteMajor(major)
                }

                console.log("[🔍 SHIPPING DEBUG] Quote Calculated:", { minor, major, ms: Date.now() - t0 })
            } catch (e: any) {
                console.error("[🔍 SHIPPING DEBUG] Delivery Calculation Failed:", e)
                if (!cancelled) setError(e?.message || "No se pudo calcular el precio del envío.")
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        run()
        return () => { cancelled = true }
    }, [isOpen, mode, cart.id, cart.currency_code, deliveryOptionFromStore?.id])

    // --- EFECTO DE CARGA DE PICKUP ---
    useEffect(() => {
        if (!isOpen) return
        if (mode !== "pickup") return

        let cancelled = false
        setError(null)
        setLoading(true)
        console.log("[🔍 SHIPPING DEBUG] Loading Pickup Locations...")

        listPickupLocations(cart.id)
            .then((locs: PickupLocation[]) => {
                if (cancelled) return
                console.log("[🔍 SHIPPING DEBUG] Pickup Locations Loaded:", locs?.length)
                setPickupLocations(locs || [])
                setSelectedPickup((prev) => prev || (locs?.[0] ?? null))
            })
            .catch((e: any) => {
                if (cancelled) return
                console.error("[🔍 SHIPPING DEBUG] Pickup Load Failed:", e)
                setError(e?.message || "No se pudieron cargar los puntos de recojo.")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => { cancelled = true }
    }, [isOpen, mode, cart.id])

    useEffect(() => {
        setError(null)
    }, [mode, isOpen])

    // 🔥 HANDLER PRINCIPAL DE CONFIRMACIÓN 🔥
    const handleConfirm = async () => {
        console.log("\n==================================================")
        console.log("[🔍 SHIPPING DEBUG] handleConfirm CLICKED")
        console.log("==================================================")

        const t0 = Date.now()
        try {
            setSaving(true)
            setError(null)

            const firstItem = cart.items?.[0] as any
            const sellerId =
                firstItem?.product?.seller_id ||
                firstItem?.product?.seller?.id ||
                firstItem?.seller_id ||
                null

            const optionId = mode === "delivery" ? deliveryOptionId : selectedPickup?.shipping_option_id

            console.log("[🔍 SHIPPING DEBUG] Option Selection:", { mode, optionId, sellerId })

            if (!optionId) {
                setError("Selecciona una opción válida de envío.")
                return
            }

            const payloadData: any = { cart_id: cart.id }

            if (mode === "delivery") {
                payloadData.source = "delivery_recommendation"
                if (deliveryReco?.distance_km != null) payloadData.distance_km = deliveryReco.distance_km
                if (deliveryReco?.stock_location_id) payloadData.stock_location_id = deliveryReco.stock_location_id
            } else {
                // ✅ Pickup Data Flags
                payloadData.mode = "pickup"
                payloadData.pickup = true
                payloadData.source = "pickup_selection"
                if (selectedPickup?.stock_location_id) payloadData.stock_location_id = selectedPickup.stock_location_id
            }

            let amountMajor: number | null = null

            if (mode === "delivery") {
                if (deliveryQuoteMajor == null || deliveryQuoteMinor == null) {
                    setError("Primero se debe calcular el precio del envío.")
                    return
                }
                amountMajor = deliveryQuoteMajor
            } else {
                // ✅ 3. FORCE PICKUP FREE
                // We ignore the calculator and set 0 explicitly.
                amountMajor = 0
            }

            // [DEBUG-PICKUP] LOG CRÍTICO DEL PAYLOAD
            console.log("[🔍 SHIPPING DEBUG] 🔥 PAYLOAD TO BACKEND (force/route.ts):", {
                cartId: cart.id,
                shippingMethodId: optionId,
                amountMinor: amountMajor, // ESTE ES EL NÚMERO CLAVE
                force: true,
                data: payloadData
            })

            const res = await setShippingMethod({
                cartId: cart.id,
                shippingMethodId: optionId!,
                sellerId,
                data: payloadData,
                amountMinor: amountMajor,
                force: true,
            })

            console.log("[🔍 SHIPPING DEBUG] Backend Response:", res)

            if (!res.ok) {
                console.error("[🔍 SHIPPING DEBUG] Failed to set shipping:", res.error)
                setError(res.error?.message || "Error al establecer el método de envío.")
                return
            }

            console.log("[🔍 SHIPPING DEBUG] Success! Redirecting to payment...")
            router.push(pathname + "?step=payment", { scroll: false })
        } catch (e: any) {
            console.error("[🔍 SHIPPING DEBUG] Exception:", e)
            setError(e?.message || "Ocurrió un error")
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = () => router.replace(pathname + "?step=delivery")

    const isEditEnabled = !isOpen && !!cart?.shipping_methods?.length

    if (!isOpen) {
        return (
            <div className="border p-4 rounded-sm bg-ui-bg-interactive">
                <div className="flex flex-row items-center justify-between mb-6">
                    <Heading level="h2" className="flex flex-row text-3xl-regular gap-x-2 items-center">
                        {(cart.shipping_methods?.length ?? 0) > 0 && <CheckCircleSolid />}
                        Envío
                    </Heading>
                    {isEditEnabled && (
                        <Text>
                            <Button onClick={handleEdit} variant="tonal">
                                Editar
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
                                    // ✅ Pass Override to Row
                                    currency_code={displayCurrency}
                                />
                            ))}
                        </div>
                    ) : (
                        <Text className="text-ui-fg-subtle">
                            Aún no se ha seleccionado un método de envío.
                        </Text>
                    )}
                </div>
            </div>
        )
    }

    const deliveryEnabled = mode === "delivery" ? !!deliveryOptionId : true

    return (
        <div className="border p-4 rounded-sm bg-ui-bg-interactive">
            <div className="flex flex-row items-center justify-between mb-6">
                <Heading level="h2" className="flex flex-row text-3xl-regular gap-x-2 items-center">
                    Envío
                </Heading>
            </div>

            <div className="flex gap-2 mb-4">
                <Button
                    variant={mode === "delivery" ? "filled" : "tonal"}
                    onClick={() => setMode("delivery")}
                    type="button"
                >
                    Enviar a mi dirección
                </Button>
                <Button
                    variant={mode === "pickup" ? "filled" : "tonal"}
                    onClick={() => setMode("pickup")}
                    type="button"
                >
                    Recoger en almacén
                </Button>
            </div>

            {loading && (
                <Text className="text-md text-ui-fg-subtle mb-4">
                    {mode === "delivery" ? "Calculando precio de envío..." : "Cargando almacenes disponibles..."}
                </Text>
            )}

            {!loading && mode === "delivery" && (
                <div className="mb-4 border rounded-md p-4">
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">Enviar a tu dirección</Text>

                    {!deliveryOptionId ? (
                        <Text className="txt-medium text-ui-fg-subtle">
                            No hay opción de delivery disponible para este carrito.
                        </Text>
                    ) : (
                        <Text className="txt-medium text-ui-fg-subtle">
                            Envío{" "}
                            {convertToLocale({
                                // ✅ 4. Use calculated amount
                                amount: getDisplayAmount(deliveryQuoteMajor),
                                currency_code: displayCurrency,
                            })}
                        </Text>
                    )}
                </div>
            )}

            {!loading && mode === "pickup" && (
                <div className="mb-4 border rounded-md p-4">
                    <Text className="txt-medium-plus text-ui-fg-base mb-2">Elige dónde recoger</Text>

                    {pickupLocations.length === 0 ? (
                        <Text className="txt-medium text-ui-fg-subtle">
                            No hay almacenes habilitados para recojo en este momento.
                        </Text>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {pickupLocations.map((loc) => {
                                const selected = selectedPickup?.stock_location_id === loc.stock_location_id

                                return (
                                    <button
                                        key={loc.stock_location_id}
                                        type="button"
                                        className={[
                                            "w-full text-left border rounded-md p-3 transition-colors",
                                            selected ? "border-green-600 bg-green-50" : "border-ui-border-base hover:bg-neutral-50",
                                        ].join(" ")}
                                        onClick={() => setSelectedPickup(loc)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <Text className="txt-medium-plus font-semibold text-green-900">{loc.stock_location_name}</Text>
                                                <Text className="txt-small text-ui-fg-subtle">
                                                    {loc.distance_km != null ? `Aprox. ${loc.distance_km.toFixed(1)} km` : "Distancia no disponible"}
                                                </Text>
                                            </div>
                                            {selected && <CheckCircleSolid className="text-green-600" />}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
                <div className="flex flex-col mt-4">
                    {cart.shipping_methods?.map((method) => (
                        <CartShippingMethodRow
                            key={method.id}
                            method={method}
                            currency_code={displayCurrency} // ✅ Pass override
                        />
                    ))}
                </div>
            )}

            <ErrorMessage error={error} data-testid="delivery-option-error-message" />

            <Button
                onClick={handleConfirm}
                variant="tonal"
                disabled={saving || !deliveryEnabled}
                loading={saving}
                type="button"
            >
                Continuar al pago
            </Button>
        </div>
    )
}

export default CartShippingMethodsSection