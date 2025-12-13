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
                        <h1 className="heading-xl uppercase">Bienvenido {user.first_name}</h1>
                        <p className="label-md">¡Tu cuenta está lista para usarse!</p>
                    </div>

                    {wallet && (
                        /* UPDATED: Changed from bg-primary/5 to bg-green-50 to highlight value/money */
                        <div className="inline-flex items-baseline gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-2">
                            {/* UPDATED: Added text-green-800 */}
                            <span className="label-md uppercase text-green-800">Puntos</span>
                            {/* UPDATED: Added text-green-700 */}
                            <span className="heading-md text-green-700">
                                {wallet.points.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}