import { LoginForm } from "@/components/molecules/LoginForm/LoginForm"
import { UserNavigation } from "@/components/molecules/UserNavigation/UserNavigation"
import { UserMessagesSection } from "@/components/sections/UserMessagesSection/UserMessagesSection"
import { retrieveCustomer } from "@/lib/data/customer"
import { getAuthHeaders } from "@/lib/data/cookies"

export default async function MessagesPage() {
    const user = await retrieveCustomer()

    if (!user) return <LoginForm />

    // ✅ FIX: Type assertion to satisfy TypeScript union check
    const authHeaders = (await getAuthHeaders()) as { authorization?: string } | null

    // Now safely extract the token
    const token = authHeaders?.authorization?.split(" ")[1] || null

    return (
        <main className="container">
            <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
                <UserNavigation />
                <div className="md:col-span-3 space-y-8">
                    <UserMessagesSection token={token} />
                </div>
            </div>
        </main>
    )
}