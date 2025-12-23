import { OrderParcels } from "@/components/organisms/OrderParcels/OrderParcels"
import { OrderTotals } from "@/components/organisms/OrderTotals/OrderTotals"
import { DispatchStatus } from "@/components/molecules/DispatchStatus/DispatchStatus"

export const OrderDetailsSection = ({ orderSet }: { orderSet: any }) => {
    const firstOrder = orderSet?.orders?.[0]
    const firstFulfillment = firstOrder?.fulfillments?.[0]

    const orderId = firstOrder?.id as string | undefined
    const fulfillmentId = firstFulfillment?.id as string | undefined

    return (
        <div>
            {orderId && fulfillmentId ? (
                <div className="mb-6 border bg-component-secondary px-4 py-4 rounded-sm">
                    <DispatchStatus
                        orderId={orderId}
                        fulfillmentId={fulfillmentId}
                        pollMs={3000}
                        showQrOnShipped
                    />
                </div>
            ) : null}

            <OrderParcels orders={orderSet.orders} />
            <OrderTotals orderSet={orderSet} />
        </div>
    )
}
