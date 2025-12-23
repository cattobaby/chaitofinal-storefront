// storefront/src/components/sections/OrderTracking/OrderTracking.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { fetchStoreDispatch } from "@/lib/data/dispatch"
import { OrderTimeline } from "@/components/cells/OrderTimeline/OrderTimeline"

type OrderStatus = "received" | "preparing" | "shipped" | "delivered"

function mapToTimelineStatus(args: {
    hasFulfillment: boolean
    shippedAt?: string | null
    deliveredAt?: string | null
    dispatchStatus?: string | null
}): OrderStatus {
    const { hasFulfillment, shippedAt, deliveredAt, dispatchStatus } = args

    if (dispatchStatus === "delivered" || deliveredAt) return "delivered"

    if (
        shippedAt ||
        dispatchStatus === "accepted" ||
        dispatchStatus === "awaiting_confirmation" ||
        dispatchStatus === "in_transit" ||
        dispatchStatus === "broadcasted"
    ) {
        return "shipped"
    }

    if (hasFulfillment) return "preparing"
    return "received"
}

function extractDelivery(dispatch: any): { url: string | null; token: string | null; value: string | null } {
    if (!dispatch) return { url: null, token: null, value: null }

    // intentamos varias formas comunes
    const url =
        dispatch?.qr?.url ||
        dispatch?.qr_url ||
        dispatch?.qrUrl ||
        dispatch?.qr?.link ||
        dispatch?.metadata?.qr_url ||
        dispatch?.metadata?.qrUrl ||
        null

    const token =
        dispatch?.qr?.token ||
        dispatch?.qr_token ||
        dispatch?.qrToken ||
        dispatch?.delivery_token ||
        dispatch?.deliveryToken ||
        dispatch?.metadata?.qr_token ||
        dispatch?.metadata?.delivery_token ||
        null

    // a veces es un string directo (código)
    const value =
        (typeof dispatch?.qr === "string" ? dispatch.qr : null) ||
        dispatch?.code ||
        dispatch?.delivery_code ||
        dispatch?.deliveryCode ||
        dispatch?.metadata?.delivery_code ||
        null

    return {
        url: typeof url === "string" ? url : null,
        token: typeof token === "string" ? token : null,
        value: typeof value === "string" ? value : null,
    }
}

function looksLikeImageUrl(u: string) {
    return u.startsWith("data:image/") || /\.(png|jpg|jpeg|svg|webp)(\?.*)?$/i.test(u)
}

export function OrderTracking({
                                  orderSet,
                                  dispatchPath,
                              }: {
    orderSet: any
    dispatchPath: string
}) {
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const { hasFulfillment, shippedAt, deliveredAt } = useMemo(() => {
        const fulfillments =
            (orderSet?.orders || []).flatMap((o: any) => o?.fulfillments || []) || []

        const latest = fulfillments[0]
        return {
            hasFulfillment: fulfillments.length > 0,
            shippedAt: latest?.shipped_at ?? null,
            deliveredAt: latest?.delivered_at ?? null,
        }
    }, [orderSet])

    useEffect(() => {
        let alive = true
        let timer: any

        const tick = async () => {
            try {
                const res = await fetchStoreDispatch(dispatchPath)
                if (!alive) return
                setData(res)
                setError(null)

                const st = res?.dispatch?.status
                if (st === "delivered") {
                    if (timer) clearInterval(timer)
                }
            } catch (e: any) {
                if (!alive) return
                setError(e?.message || "Error cargando estado")
            }
        }

        tick()
        timer = setInterval(tick, 3000)

        return () => {
            alive = false
            if (timer) clearInterval(timer)
        }
    }, [dispatchPath])

    const dispatch = data?.dispatch ?? null
    const dispatchStatus = dispatch?.status ?? null

    const timelineStatus = useMemo(() => {
        return mapToTimelineStatus({
            hasFulfillment,
            shippedAt,
            deliveredAt,
            dispatchStatus,
        })
    }, [hasFulfillment, shippedAt, deliveredAt, dispatchStatus])

    const delivery = useMemo(() => extractDelivery(dispatch), [dispatch])

    const shouldShowDeliveryCode =
        timelineStatus === "shipped" && timelineStatus !== "delivered" && (delivery.url || delivery.token || delivery.value)

    return (
        <div className="mb-6">
            <OrderTimeline currentStatus={timelineStatus} />

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            {shouldShowDeliveryCode ? (
                <div className="mt-6 rounded-sm border bg-component-secondary p-4">
                    <h3 className="heading-sm uppercase">Código de entrega</h3>
                    <p className="label-md text-secondary mt-2">
                        Muéstrale este código/QR al repartidor para confirmar la entrega.
                    </p>

                    <div className="mt-4 space-y-3">
                        {delivery.url ? (
                            looksLikeImageUrl(delivery.url) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={delivery.url} alt="QR de entrega" className="max-w-[220px] border rounded-sm" />
                            ) : (
                                <div className="text-sm break-all">
                                    <span className="text-secondary">Link:</span>{" "}
                                    <span className="text-primary">{delivery.url}</span>
                                </div>
                            )
                        ) : null}

                        {delivery.value ? (
                            <div className="text-sm break-all">
                                <span className="text-secondary">Código:</span>{" "}
                                <span className="text-primary">{delivery.value}</span>
                            </div>
                        ) : null}

                        {delivery.token ? (
                            <div className="text-sm break-all">
                                <span className="text-secondary">Token:</span>{" "}
                                <span className="text-primary">{delivery.token}</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
