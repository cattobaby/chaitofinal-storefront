import { UserNavigation } from "@/components/molecules"
import { retrieveCustomer } from "@/lib/data/customer"
import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ArrowLeftIcon } from "@/icons"
import { redirect } from "next/navigation"
import { format } from "date-fns"
// ✅ Importamos retrieveOrder para el fetch profundo
import { retrieveOrderSet, retrieveOrder } from "@/lib/data/orders"
import { OrderDetailsSection } from "@/components/sections/OrderDetailsSection/OrderDetailsSection"
import { OrderTimeline, type OrderStatus } from "@/components/cells/OrderTimeline/OrderTimeline"
import { OrderTimelineLive } from "@/components/cells/OrderTimeline/OrderTimelineLive"
import { OrderConfirmedQr } from "@/components/molecules/OrderConfirmedQr/OrderConfirmedQr"

export const dynamic = "force-dynamic"

function deriveStatusFromOrderSet(orderSet: any): OrderStatus {
    const orders = (orderSet?.orders ?? []) as any[]
    const fulfillments = orders.flatMap((o) => (o?.fulfillments ?? []) as any[])

    if (!fulfillments.length) return "preparing"
    if (fulfillments.some((f) => Boolean(f?.delivered_at))) return "delivered"
    if (fulfillments.some((f) => Boolean(f?.shipped_at))) return "shipped"
    return "received"
}

export default async function UserPage({
                                           params,
                                       }: {
    params: Promise<{ locale: string; id: string }>
}) {
    const { id } = await params

    const user = await retrieveCustomer()
    if (!user) return redirect("/user")

    // 1. Obtener el conjunto de órdenes (OrderSet)
    const raw = await retrieveOrderSet(id).catch(() => null)
    const orderSet = (raw as any)?.order_set ?? raw

    if (!orderSet) {
        return redirect("/user/orders")
    }

    const displayId = orderSet?.display_id ?? orderSet?.displayId ?? id
    const createdAt = orderSet?.created_at ?? orderSet?.createdAt ?? null

    const initialTimelineStatus = deriveStatusFromOrderSet(orderSet as any)

    // 2. Obtener la primera orden.
    const firstOrderRaw = orderSet?.orders?.[0]

    // ✅ LÓGICA DE REFUERZO:
    // Usamos retrieveOrder(id) para asegurarnos de traer metadata profunda.
    let fullOrder = firstOrderRaw
    if (firstOrderRaw?.id) {
        const fresh = await retrieveOrder(firstOrderRaw.id)
        if (fresh) fullOrder = fresh
    }

    const firstFulfillment = fullOrder?.fulfillments?.[0]
    const orderId = fullOrder?.id as string | undefined
    const fulfillmentId = firstFulfillment?.id as string | undefined

    // =================================================================================
    // 🐛 DEBUGGING INTENSIVO: INICIO
    // =================================================================================

    // A) Metadata del Fulfillment (Fuente de verdad del Courier)
    const ffMeta = (firstFulfillment?.metadata as any) ?? {}
    const ffDispatch = ffMeta.dispatch ?? {}

    // B) Metadata de la Orden (Fallback y Subscriber)
    const orderMeta = (fullOrder?.metadata as any) ?? {}
    const orderDispatch = orderMeta.dispatch ?? {}

    console.log("\n================ [🔍 STOREFRONT DEBUG] INICIO ================")
    console.log(`🆔 Orden: ${displayId} (${orderId})`)

    // Imprimir raw objects para ver si son { value: "..." }
    console.log("📦 Order Metadata Dispatch:", JSON.stringify(orderDispatch, null, 2))
    console.log("🚚 Fulfillment Metadata Dispatch:", JSON.stringify(ffDispatch, null, 2))

    // ¿Es Pickup o Delivery?
    const isPickupMode =
        ffDispatch.mode === "pickup" ||
        orderDispatch.mode === "pickup" ||
        !!ffDispatch?.beacon?.handover_token

    console.log(`🤔 Modo detectado: ${isPickupMode ? "PICKUP" : "DELIVERY"}`)

    let finalCode: any // 'any' intencional para atrapar objetos
    let finalQrToken: string | undefined

    if (isPickupMode) {
        // PICKUP: Prioridad Handover
        finalCode =
            ffDispatch.beacon?.handover_code ||
            orderDispatch.beacon?.handover_code ||
            "PENDIENTE"

        finalQrToken =
            ffDispatch.beacon?.handover_token ||
            orderDispatch.beacon?.handover_token ||
            (typeof finalCode === 'string' ? finalCode : "TOKEN_INVALIDO")
    } else {
        // DELIVERY: Prioridad Delivery Code
        // Aquí está el sospechoso: ¿alguno de estos es un objeto?
        const candidates = {
            ff_beacon: ffDispatch.beacon?.delivery_code,
            ff_root: ffDispatch.delivery_code,
            ord_dispatch: orderDispatch.delivery_code,
            ord_root: orderMeta.delivery_code
        }
        console.log("🕵️ Candidatos de Delivery Code:", JSON.stringify(candidates, null, 2))

        finalCode =
            candidates.ff_beacon ||
            candidates.ff_root ||
            candidates.ord_dispatch ||
            candidates.ord_root

        finalQrToken =
            ffDispatch.qr?.token ||
            orderDispatch.qr?.token ||
            (typeof finalCode === 'string' ? finalCode : "TOKEN_PENDIENTE")
    }

    // 🛡️ CORRECCIÓN Y DIAGNÓSTICO FINAL
    let safeCodeString = ""
    let debugObjectType = typeof finalCode

    if (typeof finalCode === 'object' && finalCode !== null) {
        console.warn("⚠️ [ALERTA] 'finalCode' es un OBJETO. Estructura:", finalCode)
        // Intento de extracción segura
        if (finalCode.value) safeCodeString = String(finalCode.value)
        else if (finalCode.code) safeCodeString = String(finalCode.code)
        else safeCodeString = JSON.stringify(finalCode) // Peor caso: mostramos el JSON feo pero visible
    } else {
        safeCodeString = String(finalCode || "")
    }

    console.log(`✅ Código Final Procesado (String): "${safeCodeString}"`)
    console.log("================ [🔍 STOREFRONT DEBUG] FIN ================\n")

    // =================================================================================
    // 🐛 DEBUGGING INTENSIVO: FIN
    // =================================================================================

    // Ocultar QR si ya fue entregado
    const isDelivered = initialTimelineStatus === "delivered" || !!firstFulfillment?.delivered_at

    return (
        <main className="container">
            <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
                <UserNavigation />

                <div className="md:col-span-3">
                    <LocalizedClientLink href="/user/orders">
                        <Button
                            variant="tonal"
                            className="label-md text-action-on-secondary uppercase flex items-center gap-2"
                        >
                            <ArrowLeftIcon className="size-4" />
                            Todos los pedidos
                        </Button>
                    </LocalizedClientLink>

                    <div className="sm:flex items-center justify-between">
                        <h1 className="heading-md uppercase my-8">Pedido #{displayId}</h1>

                        <p className="label-md text-secondary">
                            Fecha del pedido:{" "}
                            <span className="text-primary">
                {createdAt ? format(createdAt || "", "yyyy-MM-dd") : "—"}
              </span>
                        </p>
                    </div>

                    {/* ✅ Renderizado con Bloque de Debug Visual */}
                    {!isDelivered && safeCodeString && (
                        <div className="mb-8 flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-full max-w-md">
                                <OrderConfirmedQr
                                    code={safeCodeString}
                                    token={finalQrToken || safeCodeString}
                                    title={isPickupMode ? "Código de Retiro (Pickup)" : "Código de Entrega"}
                                />
                            </div>

                            {/* 🚧 BLOQUE DEBUG EN PANTALLA (Solo desarrollo) 🚧 */}
                            <div className="w-full max-w-md mt-4 p-4 bg-gray-100 border border-gray-300 rounded text-xs font-mono overflow-auto">
                                <p className="font-bold text-red-600 mb-2">🐛 DEBUGGING DATA:</p>
                                <p><strong>Type:</strong> {debugObjectType}</p>
                                <p><strong>Raw Value:</strong> {typeof finalCode === 'object' ? JSON.stringify(finalCode) : finalCode}</p>
                                <p><strong>Extracted String:</strong> {safeCodeString}</p>
                                <p className="mt-2"><strong>Metadata Source:</strong></p>
                                <pre>{JSON.stringify({
                                    dispatch: orderDispatch,
                                    fulfillment_beacon: ffDispatch?.beacon
                                }, null, 2)}</pre>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    {orderId && fulfillmentId ? (
                        <OrderTimelineLive
                            initialStatus={initialTimelineStatus}
                            orderId={orderId}
                            fulfillmentId={fulfillmentId}
                        />
                    ) : (
                        <OrderTimeline currentStatus={initialTimelineStatus} />
                    )}

                    <OrderDetailsSection orderSet={orderSet} />
                </div>
            </div>
        </main>
    )
}