"use client"
import { Card, NavigationItem } from "@/components/atoms"
import { Modal, ReviewForm } from "@/components/molecules"
import { isEmpty } from "lodash"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Order } from "@/lib/data/reviews"
import { navigation } from "./navigation"
import { OrderCard } from "./OrderCard"
import { HttpTypes } from "@medusajs/types"

export const ReviewsToWrite = ({ orders }: { orders: Array<Order> }) => {
    const [showForm, setShowForm] = useState<
        | (HttpTypes.StoreOrder & {
        seller: { id: string; name: string; reviews?: any[] }
        reviews: any[]
    })
        | null
    >(null)
    const pathname = usePathname()

    return (
        <>
            <div className="md:col-span-3 space-y-8">
                <h1 className="heading-md uppercase">Reseñas</h1>
                <div className="flex gap-4">
                    {navigation.map((item) => (
                        <NavigationItem
                            key={item.label}
                            href={item.href}
                            active={pathname === item.href}
                            className="px-0"
                        >
                            {item.label}
                        </NavigationItem>
                    ))}
                </div>
                {isEmpty(orders) ? (
                    <Card>
                        <div className="text-center py-6">
                            <h3 className="heading-lg text-primary uppercase">
                                No hay reseñas por escribir
                            </h3>
                            <p className="text-lg text-secondary mt-2">
                                Por ahora no tienes a quién reseñar.
                            </p>
                        </div>
                    </Card>
                ) : (
                    orders.map((order) => (
                        <OrderCard key={order.id} order={order} showForm={setShowForm} />
                    ))
                )}
            </div>
            {showForm && (
                <Modal heading="Escribir reseña" onClose={() => setShowForm(null)}>
                    <ReviewForm seller={showForm} handleClose={() => setShowForm(null)} />
                </Modal>
            )}
        </>
    )
}
