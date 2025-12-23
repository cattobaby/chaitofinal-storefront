// OrderTimeline.tsx
import { cn } from "@/lib/utils"

export type OrderStatus = "received" | "preparing" | "shipped" | "delivered"

interface OrderTimelineProps {
    currentStatus: OrderStatus
}

const LABELS: Record<OrderStatus, string> = {
    received: "Recibido",
    preparing: "Preparando",
    shipped: "Enviado",
    delivered: "Entregado",
}

export const OrderTimeline = ({ currentStatus }: OrderTimelineProps) => {
    const statuses: OrderStatus[] = ["received", "preparing", "shipped", "delivered"]
    const currentIndex = Math.max(0, statuses.indexOf(currentStatus))
    const denom = Math.max(1, statuses.length - 1)
    const progressPct = `${(currentIndex / denom) * 100}%`

    return (
        <div className="w-full pt-6 pb-4">
            <div className="relative">
                {/* base line */}
                <div className="absolute left-0 right-0 top-3 h-0.5 bg-[#EEEEEE]" />

                {/* progress line */}
                <div
                    className="absolute left-0 top-3 h-0.5 bg-[#1B1B1B] transition-all duration-300"
                    style={{ width: progressPct }}
                />

                {/* points */}
                <div className="relative flex items-start justify-between">
                    {statuses.map((status, index) => {
                        const isActive = index <= currentIndex

                        return (
                            <div key={status} className="flex flex-col items-center">
                <span
                    className={cn(
                        "heading-xs uppercase whitespace-nowrap mb-2",
                        isActive ? "text-[#1B1B1B]" : "text-[#CCCCCC]"
                    )}
                >
                  {LABELS[status]}
                </span>

                                <div
                                    className={cn(
                                        "size-2.5 rounded-full transition-colors duration-300",
                                        isActive ? "bg-[#1B1B1B]" : "bg-[#EEEEEE]"
                                    )}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
