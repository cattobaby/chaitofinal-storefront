// storefront/src/components/cells/Navbar/Navbar.tsx
import { HttpTypes } from "@medusajs/types"
import { CategoryNavbar, NavbarSearch } from "@/components/molecules"
import { getWallet } from "@/lib/data/wallet"

export const Navbar = async ({
                                 categories,
                             }: {
    categories: HttpTypes.StoreProductCategory[]
}) => {
    const wallet = await getWallet()

    return (
        <div className="flex border py-4 px-6 items-center gap-6">
            {/* Left: categories */}
            <div className="hidden md:flex items-center">
                <CategoryNavbar categories={categories} />
            </div>

            {/* Right: search stretches, points to the right */}
            <div className="flex flex-1 items-center gap-6">
                <div className="flex-1">
                    <NavbarSearch />
                </div>

                {wallet && (
                    <div className="hidden sm:flex items-baseline gap-1">
                        <span className="label-xs uppercase tracking-wide">Points</span>
                        <span className="label-md font-semibold">
              {wallet.points.toLocaleString()}
            </span>
                    </div>
                )}
            </div>
        </div>
    )
}
