"use client"

import { useEffect, useMemo, useState } from "react"
import { fetchStoreDispatchStatus } from "@/lib/data/dispatch"

function labelForStatus(s?: string | null) {
    switch (s) {
        case "broadcasted":
            return "Buscando repartidor"
        case "accepted":
            return "Repartidor asignado"
        case "awaiting_confirmation":
            return "Retirado, esperando confirmación"
        case "in_transit":
            return "En camino"
        case "delivered":
            return "Entregado"
        case "canceled":
        case "cancelled":
            return "Cancelado"
        default:
            return "Preparando"
    }
}

function isShippedLike(s?: string | null) {
    return (
        s === "broadcasted" ||
        s === "accepted" ||
        s === "awaiting_confirmation" ||
        s === "in_transit"
    )
}

function isTerminal(s?: string | null) {
    return s === "delivered" || s === "canceled" || s === "cancelled"
}

export function DispatchStatus({
                                   orderId,
                                   fulfillmentId,
                                   pollMs = 3000,
                                   showQrOnShipped = true,
                               }: {
    orderId: string
    fulfillmentId: string
    pollMs?: number
    showQrOnShipped?: boolean
}) {
    const [dispatch, setDispatch] = useState<any>(null)
    const [status, setStatus] = useState<string | null>(null)

    useEffect(() => {
        let alive = true
        let timer: any

        const tick = async () => {
            try {
                const res = await fetchStoreDispatchStatus(orderId, fulfillmentId)
                if (!alive) return

                const d = res?.dispatch ?? null
                const s = (res?.status ?? d?.status ?? null) as string | null

                setDispatch(d)
                setStatus(s)

                if (isTerminal(s) && timer) clearInterval(timer)
            } catch {
                // silencioso
            }
        }

        tick()
        timer = setInterval(tick, pollMs)

        return () => {
            alive = false
            if (timer) clearInterval(timer)
        }
    }, [orderId, fulfillmentId, pollMs])

    const label = useMemo(() => labelForStatus(status), [status])

    // ✅ soporta varias formas por si cambia backend
    const qrUrl =
        dispatch?.qr?.url ??
        dispatch?.qr_url ??
        dispatch?.qrUrl ??
        dispatch?.delivery_qr?.url ??
        null

    const qrToken =
        dispatch?.qr?.token ??
        dispatch?.qr_token ??
        dispatch?.qrToken ??
        dispatch?.delivery_qr?.token ??
        null

    // ✅ TU CASO: no hay qr, pero sí hay beacon → úsalo como “código”
    const qrValue =
        qrToken ||
        dispatch?.beacon ||
        dispatch?.delivery_code ||
        dispatch?.code ||
        null

    const shouldShowQr =
        Boolean(showQrOnShipped) &&
        isShippedLike(status) &&
        Boolean(qrUrl || qrValue)

    // si no hay una imagen real, generamos un QR a partir del valor (DEV OK)
    const generatedQrImg = qrValue
        ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
            String(qrValue)
        )}`
        : null

    return (
        <div className="space-y-4">
            <p className="label-md text-secondary">
                Estado de envío: <span className="text-primary">{label}</span>
            </p>

            {shouldShowQr ? (
                <div className="rounded-sm border bg-white/40 p-4">
                    <h3 className="heading-sm uppercase">Código de entrega</h3>
                    <p className="label-md text-secondary mt-2">
                        Muéstrale este QR/código al repartidor para confirmar la entrega.
                    </p>

                    <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start">
                        <div className="flex flex-col gap-2">
                            <img
                                src={qrUrl || generatedQrImg || ""}
                                alt="QR de entrega"
                                className="w-40 h-40 object-contain rounded-sm border bg-white"
                                referrerPolicy="no-referrer"
                            />
                            {qrUrl ? (
                                <div className="text-xs break-all">
                                    <span className="text-secondary">Link:</span>{" "}
                                    <span className="text-primary">{qrUrl}</span>
                                </div>
                            ) : null}
                        </div>

                        {qrValue ? (
                            <div className="text-sm break-all">
                                <span className="text-secondary">Código:</span>{" "}
                                <span className="text-primary font-semibold">{String(qrValue)}</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
