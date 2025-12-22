/* /home/willman/WebstormProjects/new/new/storefront/src/components/sections/CartShippingMethodsSection/CartShippingMethodsSection.tsx */

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

function pickDeliveryOption(options: StoreCardShippingMethod[] | null) {
    const list = options || []
    const shipping = list.filter((o) => o?.service_zone?.fulfillment_set?.type === "shipping")
    return shipping[0] || null
}

function extractQuoteMinor(q: any): number | null {
    // soporta varias formas (según wrapper / SDK / endpoint)
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

const CartShippingMethodsSection: React.FC<ShippingProps> = ({ cart, availableShippingMethods }) => {
    const debug_id = useMemo(() => mkDebugId("ship_ui"), [])
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const isOpen = searchParams.get("step") === "delivery"

    const deliveryOptionFromStore = useMemo(() => pickDeliveryOption(availableShippingMethods), [availableShippingMethods])

    const [mode, setMode] = useState<"delivery" | "pickup">("delivery")

    const [deliveryQuoteMinor, setDeliveryQuoteMinor] = useState<number | null>(null)
    const [deliveryOptionId, setDeliveryOptionId] = useState<string | null>(null)
    const [deliveryReco, setDeliveryReco] = useState<DeliveryRecommendation | null>(null)

    const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([])
    const [selectedPickup, setSelectedPickup] = useState<PickupLocation | null>(null)

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        console.log("[storefront][ui][CartShippingMethodsSection] mount/update", {
            debug_id,
            cartId: cart?.id,
            isOpen,
            mode,
            availableShippingMethodsCount: availableShippingMethods?.length ?? 0,
            deliveryOptionFromStoreId: deliveryOptionFromStore?.id ?? null,
            deliveryOptionId,
            selectedPickupId: selectedPickup?.stock_location_id ?? null,
        })
    }, [
        debug_id,
        cart?.id,
        isOpen,
        mode,
        availableShippingMethods?.length,
        deliveryOptionFromStore?.id,
        deliveryOptionId,
        selectedPickup?.stock_location_id,
    ])

    useEffect(() => {
        if (!isOpen) return
        if (mode !== "delivery") return

        let cancelled = false
        const t0 = Date.now()
        setError(null)
        setLoading(true)

        const run = async () => {
            try {
                console.log("[storefront][ui][CartShippingMethodsSection] delivery:fetch start", {
                    debug_id,
                    cartId: cart.id,
                    storeOptionId: deliveryOptionFromStore?.id ?? null,
                })

                const reco = await recommendDelivery(cart.id)
                if (!cancelled) setDeliveryReco(reco)

                const recoOptionId = (reco as any)?.shipping_option_id ?? (reco as any)?.optionId ?? null
                const optionId: string | null = recoOptionId || deliveryOptionFromStore?.id || null
                if (!cancelled) setDeliveryOptionId(optionId)

                console.log("[storefront][ui][CartShippingMethodsSection] delivery:recommend result", {
                    debug_id,
                    ms: Date.now() - t0,
                    hasReco: !!reco,
                    recoOptionId,
                    optionId,
                    stock_location_id: reco?.stock_location_id ?? null,
                    distance_km: reco?.distance_km ?? null,
                    provider_id: (reco as any)?.provider_id ?? null,
                })

                if (!optionId) {
                    console.warn("[storefront][ui][CartShippingMethodsSection] delivery:no optionId", {
                        debug_id,
                        reason: "No shipping option found (recommend + store list empty).",
                    })
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

                const minor = extractQuoteMinor(q)
                if (minor == null) {
                    throw new Error("No se pudo interpretar el quote del envío (faltan campos amount/calculated_amount).")
                }

                if (!cancelled) setDeliveryQuoteMinor(minor)

                console.log("[storefront][ui][CartShippingMethodsSection] delivery:calculate ok", {
                    debug_id,
                    ms: Date.now() - t0,
                    optionId,
                    finalMinor: minor,
                    currency_code: q?.currency_code ?? cart.currency_code,
                })
            } catch (e: any) {
                console.error("[storefront][ui][CartShippingMethodsSection] delivery:fetch err", {
                    debug_id,
                    ms: Date.now() - t0,
                    message: e?.message,
                    stack: e?.stack,
                })
                if (!cancelled && deliveryQuoteMinor == null) {
                    setError(e?.message || "No se pudo calcular el precio del envío.")
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        run()
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, mode, cart.id, cart.currency_code, deliveryOptionFromStore?.id, debug_id])

    useEffect(() => {
        if (!isOpen) return
        if (mode !== "pickup") return

        let cancelled = false
        const t0 = Date.now()
        setError(null)
        setLoading(true)

        console.log("[storefront][ui][CartShippingMethodsSection] pickup locations:fetch start", {
            debug_id,
            cartId: cart.id,
        })

        listPickupLocations(cart.id)
            .then((locs: PickupLocation[]) => {
                if (cancelled) return
                setPickupLocations(locs || [])
                setSelectedPickup((prev) => prev || (locs?.[0] ?? null))

                console.log("[storefront][ui][CartShippingMethodsSection] pickup locations:fetch ok", {
                    debug_id,
                    ms: Date.now() - t0,
                    count: locs?.length ?? 0,
                    first: locs?.[0] ?? null,
                })
            })
            .catch((e: any) => {
                if (cancelled) return
                console.error("[storefront][ui][CartShippingMethodsSection] pickup locations:fetch err", {
                    debug_id,
                    ms: Date.now() - t0,
                    message: e?.message,
                })
                setError(e?.message || "No se pudieron cargar los puntos de recojo.")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [isOpen, mode, cart.id, debug_id])

    useEffect(() => {
        setError(null)
    }, [mode, isOpen])

    const handleConfirm = async () => {
        const t0 = Date.now()
        try {
            setSaving(true)
            setError(null)

            const firstItem = cart.items?.[0] as any
            const sellerId = firstItem?.product?.seller_id || firstItem?.product?.seller?.id || firstItem?.seller_id || null

            const optionId = mode === "delivery" ? deliveryOptionId : selectedPickup?.shipping_option_id

            console.log("[storefront][ui][CartShippingMethodsSection] confirm:start", {
                debug_id,
                mode,
                cartId: cart.id,
                sellerId,
                optionId,
            })

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
                payloadData.mode = "pickup"
                payloadData.source = "pickup_selection"
                if (selectedPickup?.stock_location_id) payloadData.stock_location_id = selectedPickup.stock_location_id
            }

            // --- CLAVE: amountMinor para permitir FORCE fallback desde cart.ts ---
            let amountMinor: number | null = null

            if (mode === "delivery") {
                amountMinor = deliveryQuoteMinor ?? null
                if (amountMinor == null) {
                    setError("Primero se debe calcular el precio del envío (deliveryQuoteMinor es null).")
                    return
                }
            } else {
                // Para pickup calculamos quote al confirmar (si aún no lo tienes en state)
                const q = await calculateShippingOptionQuote({
                    cartId: cart.id,
                    optionId,
                    data: {
                        ...payloadData,
                    },
                })

                const minor = extractQuoteMinor(q)
                if (minor == null) {
                    setError("No se pudo interpretar el quote de pickup (faltan campos amount/calculated_amount).")
                    return
                }
                amountMinor = minor
            }

            console.log("[storefront][ui][CartShippingMethodsSection] confirm:amount", {
                debug_id,
                mode,
                optionId,
                amountMinor,
            })

            const res = await setShippingMethod({
                cartId: cart.id,
                shippingMethodId: optionId!,
                sellerId,
                data: payloadData,
                amountMinor, // <--- NUEVO
            })

            if (!res.ok) {
                setError(res.error?.message || "Error al establecer el método de envío.")
                return
            }

            router.push(pathname + "?step=payment", { scroll: false })
        } catch (e: any) {
            console.error("[storefront][ui][CartShippingMethodsSection] confirm:err", {
                debug_id,
                ms: Date.now() - t0,
                message: e?.message,
                stack: e?.stack,
            })
            setError(e?.message || "Ocurrió un error")
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
                                <CartShippingMethodRow key={method.id} method={method} currency_code={cart.currency_code} />
                            ))}
                        </div>
                    ) : (
                        <Text className="text-ui-fg-subtle">Aún no se ha seleccionado un método de envío.</Text>
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
                <Button variant={mode === "delivery" ? "filled" : "tonal"} onClick={() => setMode("delivery")} type="button">
                    Enviar a mi dirección
                </Button>
                <Button variant={mode === "pickup" ? "filled" : "tonal"} onClick={() => setMode("pickup")} type="button">
                    Recoger en warehouse
                </Button>
            </div>

            {loading && (
                <Text className="text-md text-ui-fg-subtle mb-4">
                    {mode === "delivery" ? "Calculando precio de envío..." : "Cargando warehouses disponibles..."}
                </Text>
            )}

            {!loading && mode === "delivery" && (
                <div className="mb-4 border rounded-md p-4">
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">Enviar a tu dirección</Text>

                    {!deliveryOptionId ? (
                        <Text className="txt-medium text-ui-fg-subtle">No hay opción de delivery disponible para este carrito.</Text>
                    ) : (
                        <Text className="txt-medium text-ui-fg-subtle">
                            Envío{" "}
                            {convertToLocale({
                                amount: toMajor(deliveryQuoteMinor ?? 0, cart.currency_code),
                                currency_code: cart.currency_code,
                            })}
                        </Text>
                    )}
                </div>
            )}

            {!loading && mode === "pickup" && (
                <div className="mb-4 border rounded-md p-4">
                    <Text className="txt-medium-plus text-ui-fg-base mb-2">Elige dónde recoger</Text>

                    {pickupLocations.length === 0 ? (
                        <Text className="txt-medium text-ui-fg-subtle">No hay warehouses habilitados para recojo en este momento.</Text>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {pickupLocations.map((loc) => {
                                const selected = selectedPickup?.stock_location_id === loc.stock_location_id

                                return (
                                    <button
                                        key={loc.stock_location_id}
                                        type="button"
                                        className={[
                                            "w-full text-left border rounded-md p-3",
                                            selected ? "border-ui-fg-base" : "border-ui-border-base",
                                        ].join(" ")}
                                        onClick={() => setSelectedPickup(loc)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <Text className="txt-medium-plus">{loc.stock_location_name}</Text>
                                                <Text className="txt-small text-ui-fg-subtle">
                                                    {loc.distance_km != null ? `Aprox. ${loc.distance_km.toFixed(1)} km` : "Distancia no disponible"}
                                                </Text>
                                            </div>
                                            <Text className="txt-small text-ui-fg-subtle">{selected ? "Seleccionado" : ""}</Text>
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
                        <CartShippingMethodRow key={method.id} method={method} currency_code={cart.currency_code} />
                    ))}
                </div>
            )}

            <ErrorMessage error={error} data-testid="delivery-option-error-message" />

            <Button onClick={handleConfirm} variant="tonal" disabled={saving || !deliveryEnabled} loading={saving} type="button">
                Continuar al pago
            </Button>
        </div>
    )
}

export default CartShippingMethodsSection
