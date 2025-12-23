import { UserNavigation } from "@/components/molecules"
import { retrieveCustomer } from "@/lib/data/customer"
import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ArrowLeftIcon } from "@/icons"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { retrieveOrderSet } from "@/lib/data/orders"
import { OrderDetailsSection } from "@/components/sections/OrderDetailsSection/OrderDetailsSection"
import { OrderTimeline, type OrderStatus } from "@/components/cells/OrderTimeline/OrderTimeline"
import { OrderTimelineLive } from "@/components/cells/OrderTimeline/OrderTimelineLive"

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

    // retrieveOrderSet puede devolverte:
    // - orderSet directo
    // - { order_set: orderSet }
    // - null/undefined si no existe o no tienes permiso
    const raw = await retrieveOrderSet(id).catch(() => null)
    const orderSet = (raw as any)?.order_set ?? raw

    // ✅ No revientes si no existe
    if (!orderSet) {
        return redirect("/user/orders")
    }

    const displayId = orderSet?.display_id ?? orderSet?.displayId ?? id
    const createdAt = orderSet?.created_at ?? orderSet?.createdAt ?? null

    const initialTimelineStatus = deriveStatusFromOrderSet(orderSet as any)

    const firstOrder = orderSet?.orders?.[0]
    const firstFulfillment = firstOrder?.fulfillments?.[0]
    const orderId = firstOrder?.id as string | undefined
    const fulfillmentId = firstFulfillment?.id as string | undefined

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

                    {/* ✅ SOLO 1 timeline */}
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
