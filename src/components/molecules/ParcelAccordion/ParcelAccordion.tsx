import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { format } from "date-fns"
import { convertToLocale } from "@/lib/helpers/money"
import { ParcelAccordionItems } from "./ParcelAccordionItems"
import type { OrderStatus } from "@/components/cells/OrderTimeline/OrderTimeline"

function statusLabel(s?: OrderStatus) {
    switch (s) {
        case "received":
            return "Recibido"
        case "preparing":
            return "Preparando"
        case "shipped":
            return "En camino"
        case "delivered":
            return "Entregado"
        default:
            return null
    }
}

export const ParcelAccordion = ({
                                    // ✅ NUEVO: id real del Order Set (ordset_...)
                                    orderSetId,

                                    // ✅ LEGACY: mantenlo para no romper llamadas viejas
                                    orderId,

                                    orderDisplayId,
                                    createdAt,
                                    total,
                                    currency_code = "bob",
                                    orders,
                                    defaultOpen,
                                    timelineStatus,
                                    deliveryQrValue,
                                }: {
    orderSetId?: string
    orderId?: string // legacy

    orderDisplayId: string
    createdAt: string | Date
    total: number
    currency_code?: string
    orders: any[]
    defaultOpen?: boolean

    timelineStatus?: OrderStatus
    deliveryQrValue?: string | null
}) => {
    const st = statusLabel(timelineStatus)

    // ✅ lo importante: para navegar al detalle SIEMPRE usa el Order Set id
    const idForLink = orderSetId || orderId || ""

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-5 text-secondary border bg-component-secondary py-6 px-4 rounded-sm w-full">
                <div className="sm:col-span-4 flex flex-col lg:flex-row lg:items-center justify-between lg:gap-4 sm:pr-10">
                    <h2 className="heading-sm truncate">PEDIDO {orderDisplayId}</h2>

                    <h2 className="label-md">
                        Fecha del pedido:{" "}
                        <span className="text-primary lg:block xl:inline-block">
              {format(typeof createdAt === "string" ? new Date(createdAt) : createdAt, "yyyy-MM-dd")}
            </span>
                    </h2>

                    <h2 className="label-md">
                        Total:{" "}
                        <span className="text-primary lg:block xl:inline-block">
              {convertToLocale({ amount: total, currency_code })}
            </span>
                    </h2>

                    {st ? (
                        <h2 className="label-md">
                            Estado:{" "}
                            <span className="text-primary lg:block xl:inline-block">{st}</span>
                        </h2>
                    ) : null}

                    {deliveryQrValue ? (
                        <h2 className="label-md">
                            Código/QR:{" "}
                            <span className="text-primary lg:block xl:inline-block break-all">
                {deliveryQrValue}
              </span>
                        </h2>
                    ) : null}
                </div>

                <div className="col-span-1 flex justify-end items-center gap-4">
                    {idForLink ? (
                        <LocalizedClientLink href={`/user/orders/${idForLink}`}>
                            <Button variant="tonal">
                                <span className="label-md text-primary">VER PEDIDO</span>
                            </Button>
                        </LocalizedClientLink>
                    ) : null}
                </div>
            </div>

            <div className="mb-4">
                <ul className="w-full">
                    {orders.map((order, index) => (
                        <ParcelAccordionItems
                            key={order.id}
                            order={order}
                            index={index + 1}
                            currency_code={currency_code}
                        />
                    ))}
                </ul>
            </div>
        </>
    )
}
