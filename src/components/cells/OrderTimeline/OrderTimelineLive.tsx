"use client"

import { useEffect, useMemo, useState } from "react"
import { OrderTimeline, type OrderStatus } from "@/components/cells/OrderTimeline/OrderTimeline"
import { fetchStoreDispatchStatus } from "@/lib/data/dispatch"

function mapDispatchToTimelineStatus(args: {
    initial: OrderStatus
    dispatchStatus?: string | null
}): OrderStatus {
    const { initial, dispatchStatus } = args

    if (!dispatchStatus) return initial

    if (dispatchStatus === "delivered") return "delivered"

    // todo lo que sea “ya salió / en camino”
    if (
        dispatchStatus === "broadcasted" ||
        dispatchStatus === "accepted" ||
        dispatchStatus === "awaiting_confirmation" ||
        dispatchStatus === "in_transit"
    ) {
        return "shipped"
    }

    // si existe dispatch pero todavía no se movió, lo dejamos como preparing
    return "preparing"
}

export function OrderTimelineLive({
                                      initialStatus,
                                      orderId,
                                      fulfillmentId,
                                      pollMs = 3000,
                                  }: {
    initialStatus: OrderStatus
    orderId: string
    fulfillmentId: string
    pollMs?: number
}) {
    const [status, setStatus] = useState<OrderStatus>(initialStatus)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let alive = true
        let timer: any

        const tick = async () => {
            try {
                const res = await fetchStoreDispatchStatus(orderId, fulfillmentId)
                if (!alive) return

                const dispatchStatus = res?.dispatch?.status ?? null
                const next = mapDispatchToTimelineStatus({ initial: initialStatus, dispatchStatus })

                setStatus(next)
                setError(null)

                if (dispatchStatus === "delivered") {
                    if (timer) clearInterval(timer)
                }
            } catch (e: any) {
                if (!alive) return
                setError(e?.message || "No se pudo actualizar el estado")
            }
        }

        tick()
        timer = setInterval(tick, pollMs)

        return () => {
            alive = false
            if (timer) clearInterval(timer)
        }
    }, [orderId, fulfillmentId, pollMs, initialStatus])

    return (
        <div className="mb-6">
            <OrderTimeline currentStatus={status} />
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>
    )
}
