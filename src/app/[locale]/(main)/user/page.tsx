// storefront/src/app/[locale]/(main)/user/page.tsx
import { LoginForm, UserNavigation } from "@/components/molecules"
import { retrieveCustomer } from "@/lib/data/customer"
import { getWallet } from "@/lib/data/wallet"

export default async function UserPage() {
    const user = await retrieveCustomer()

    if (!user) return <LoginForm />

    const wallet = await getWallet()

    return (
        <main className="container">
            <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
                <UserNavigation />
                <div className="md:col-span-3 space-y-4">
                    <div>
                        <h1 className="heading-xl uppercase">Welcome {user.first_name}</h1>
                        <p className="label-md">Your account is ready to go!</p>
                    </div>

                    {wallet && (
                        <div className="inline-flex items-baseline gap-2 rounded-md bg-primary/5 px-3 py-2">
                            <span className="label-md uppercase">Points</span>
                            <span className="heading-md">
                                {wallet.points.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
