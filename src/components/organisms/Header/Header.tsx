import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import { CartDropdown } from "@/components/cells"
import { CategorySidebar } from "@/components/organisms/CategorySidebar/CategorySidebar"

import { HeartIcon } from "@/icons"
import { listCategories } from "@/lib/data/categories"
import { PARENT_CATEGORIES } from "@/const"
import { UserDropdown } from "@/components/cells/UserDropdown/UserDropdown"
import { retrieveCustomer } from "@/lib/data/customer"
import { getUserWishlists } from "@/lib/data/wishlist"
import { Wishlist } from "@/types/wishlist"
import { Badge } from "@/components/atoms"
import CountrySelector from "@/components/molecules/CountrySelector/CountrySelector"
import { listRegions } from "@/lib/data/regions"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { MessageButton } from "@/components/molecules/MessageButton/MessageButton"
import { NavbarSearch } from "@/components/molecules/NavbarSearch/NavbarSearch"

export const Header = async () => {
  const user = await retrieveCustomer()
  let wishlist: Wishlist[] = []

  if (user) {
    const response = await getUserWishlists()
    wishlist = response.wishlists
  }

  const regions = await listRegions()
  const wishlistCount = wishlist?.[0]?.products.length || 0

  const { categories, parentCategories } = (await listCategories({
    headingCategories: PARENT_CATEGORIES,
  })) as {
    categories: HttpTypes.StoreProductCategory[]
    parentCategories: HttpTypes.StoreProductCategory[]
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-brand-700 text-white shadow-md">
      <div className="container mx-auto px-4 lg:px-8 h-[88px] flex items-center gap-4 justify-between">

        {/* --- LEFT: Burger & Logos --- */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          <CategorySidebar
            parentCategories={parentCategories}
            childrenCategories={categories}
          />

          <LocalizedClientLink href="/" className="flex items-center gap-3">

            {/* 1. VERCEL LOGO (Fixed to match Chaito height) */}
            <Image
              src="/vercel.svg"
              width={40}
              height={40}
              alt="Vercel"
              // CHANGED: h-6 -> h-8 sm:h-10 (Matches Chaito exactly)
              className="object-contain h-10 sm:h-10 w-auto brightness-0 invert"
            />

            {/* 2. CHAITO LOGO */}
            <Image
              src="/Logo.svg"
              width={120}
              height={40}
              alt="Chaito"
              priority
              className="object-contain h-8 sm:h-10 w-auto brightness-0 invert"
            />
          </LocalizedClientLink>
        </div>

        {/* --- CENTER: Search Bar --- */}
        <div className="hidden lg:flex flex-1 justify-center px-8">
          <NavbarSearch />
        </div>

        {/* --- RIGHT: Stacked Links & Icons --- */}
        <div className="flex flex-col items-end justify-center gap-1 shrink-0 text-white">

          {/* Links Row */}
          <div className="hidden lg:flex gap-6 text-[10px] font-bold uppercase tracking-wide text-white/80">
            <LocalizedClientLink href="/careers" className="hover:text-white hover:underline">
              Trabaja con nosotros
            </LocalizedClientLink>
            <LocalizedClientLink href="/delivery-partner" className="hover:text-white hover:underline">
              Quiero ser repartidor
            </LocalizedClientLink>
            <LocalizedClientLink href="/sell" className="hover:text-white hover:underline">
              Vender en Chaito
            </LocalizedClientLink>
          </div>

          {/* Icons Row */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:block">
              <CountrySelector regions={regions} />
            </div>

            {user && <MessageButton />}

            <UserDropdown user={user} />

            {user && (
              <LocalizedClientLink href="/user/wishlist" className="relative hover:bg-brand-800 p-2 rounded-full transition-colors block">
                <HeartIcon color="white" size={24} />
                {Boolean(wishlistCount) && (
                  <Badge className="absolute -top-0.5 -right-0.5 w-4 h-4 p-0 bg-green-400 text-brand-900 border-none flex items-center justify-center text-[10px]">
                    {wishlistCount}
                  </Badge>
                )}
              </LocalizedClientLink>
            )}

            <div className="hover:bg-brand-800 p-2 rounded-full transition-colors">
              <CartDropdown />
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Search Row */}
      <div className="lg:hidden px-4 pb-3 w-full bg-brand-700">
        <NavbarSearch />
      </div>
    </header>
  )
}