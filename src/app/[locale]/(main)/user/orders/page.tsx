import { LoginForm } from "@/components/molecules"
import { UserNavigation } from "@/components/molecules"
import { retrieveCustomer } from "@/lib/data/customer"
import { OrdersPagination } from "@/components/sections"
import { isEmpty } from "lodash"
import { listOrders } from "@/lib/data/orders"
import { ParcelAccordion } from "@/components/molecules/ParcelAccordion/ParcelAccordion"
import type { OrderStatus } from "@/components/cells/OrderTimeline/OrderTimeline"

const LIMIT = 10
export const dynamic = "force-dynamic"

function deriveStatusFromOrders(orders: any[]): OrderStatus {
    const fulfillments = (orders ?? []).flatMap((o) => o?.fulfillments ?? [])
    if (!fulfillments.length) return "preparing"
    if (fulfillments.some((f: any) => Boolean(f?.delivered_at))) return "delivered"
    if (fulfillments.some((f: any) => Boolean(f?.shipped_at))) return "shipped"
    return "received"
}

export default async function UserPage({
                                           searchParams,
                                       }: {
    searchParams: Promise<{ page?: string }>
}) {
    const user = await retrieveCustomer()
    if (!user) return <LoginForm />

    const orders = await listOrders()
    const { page } = await searchParams

    const pages = Math.ceil((orders?.length || 0) / LIMIT)
    const currentPage = Number(page) || 1
    const offset = (currentPage - 1) * LIMIT

    // ✅ OG grouping (esto te funcionaba porque listOrders trae order_set expandido)
    const orderSetsGrouped = (orders ?? []).reduce((acc, order) => {
        const orderSetId = (order as any)?.order_set?.id
        if (!orderSetId) return acc
        if (!acc[orderSetId]) acc[orderSetId] = []
        acc[orderSetId].push(order)
        return acc
    }, {} as Record<string, any[]>)

    const orderSets = Object.entries(orderSetsGrouped).map(([orderSetId, os]) => {
        const firstOrder = os[0]
        const orderSet = (firstOrder as any)?.order_set

        return {
            id: orderSetId,
            orders: os,
            created_at: orderSet?.created_at ?? firstOrder?.created_at,
            display_id: orderSet?.display_id ?? firstOrder?.display_id ?? orderSetId,
            total: os.reduce((sum, o) => sum + (Number(o?.total) || 0), 0),
            currency_code: firstOrder?.currency_code ?? "bob",
            timelineStatus: deriveStatusFromOrders(os),
        }
    })

    const processedOrderSets = orderSets.slice(offset, offset + LIMIT)

    return (
        <main className="container">
            <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
                <UserNavigation />

                <div className="md:col-span-3 space-y-8">
                    <h1 className="heading-md uppercase">Pedidos</h1>

                    {isEmpty(orders) ? (
                        <div className="text-center">
                            <h3 className="heading-lg text-primary uppercase">Sin pedidos</h3>
                            <p className="text-lg text-secondary mt-2">
                                Aún no has realizado ningún pedido. Una vez que hagas uno, aparecerá aquí.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="w-full max-w-full space-y-4">
                                {processedOrderSets.map((orderSet) => (
                                    <ParcelAccordion
                                        key={orderSet.id}
                                        orderSetId={orderSet.id} // ✅ IMPORTANTÍSIMO (ordset_...)
                                        orderDisplayId={`#${orderSet.display_id}`}
                                        createdAt={orderSet.created_at}
                                        total={orderSet.total}
                                        orders={orderSet.orders || []}
                                        currency_code={orderSet.currency_code}
                                        timelineStatus={orderSet.timelineStatus}
                                        deliveryQrValue={null}
                                    />
                                ))}
                            </div>

                            <OrdersPagination pages={pages} />
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}
