import { LoginForm, UserNavigation } from "@/components/molecules"
import { ReviewsWritten } from "@/components/organisms"
import { retrieveCustomer } from "@/lib/data/customer"
import { listOrders } from "@/lib/data/orders"
import { getReviews } from "@/lib/data/reviews"

export default async function Page() {
    const user = await retrieveCustomer()

    if (!user) return <LoginForm />

    // FIX: Handle potential failures gracefully with defaults
    const orders = (await listOrders()) || []
    const reviewsRes = await getReviews()

    // FIX: Safely extract reviews based on the 'ok' status
    const reviews = reviewsRes.ok
        ? (reviewsRes.data?.reviews.filter(Boolean) ?? [])
        : []

    return (
        <main className="container">
            <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
                <UserNavigation />
                <ReviewsWritten
                    orders={orders.filter((order) => order.reviews && order.reviews.length > 0)}
                    reviews={reviews}
                    isError={!reviewsRes.ok}
                />
            </div>
        </main>
    )
}