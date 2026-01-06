// /home/willman/WebstormProjects/new/new/storefront/src/components/organisms/ProductDetails/ProductDetails.tsx

import {
    ProductDetailsFooter,
    ProductDetailsHeader,
    ProductDetailsSeller,
    ProductDetailsShipping,
    ProductPageDetails,
    ProductAdditionalAttributes,
} from "@/components/cells"

import { retrieveCustomer } from "@/lib/data/customer"
import { getUserWishlists } from "@/lib/data/wishlist"
import { AdditionalAttributeProps } from "@/types/product"
import { SellerProps } from "@/types/seller"
import { Wishlist } from "@/types/wishlist"
import { HttpTypes } from "@medusajs/types"
import { DEFAULT_CURRENCY, normalizeCurrency } from "@/lib/data/currency"

export const ProductDetails = async ({
                                         product,
                                         locale,
                                         currencyCode,
                                     }: {
    product: HttpTypes.StoreProduct & {
        seller?: SellerProps
        attribute_values?: AdditionalAttributeProps[]
    }
    locale: string
    /**
     * ✅ Inyéctalo desde server (layout/page) para que sea global
     */
    currencyCode?: string
}) => {
    const user = await retrieveCustomer()

    let wishlist: Wishlist[] = []
    if (user) {
        const response = await getUserWishlists()
        wishlist = response.wishlists
    }

    const resolvedCurrency = normalizeCurrency(currencyCode || DEFAULT_CURRENCY)

    return (
        <div>
            <ProductDetailsHeader
                product={product}
                locale={locale}
                user={user}
                wishlist={wishlist}
                currencyCode={resolvedCurrency}
            />
            <ProductPageDetails details={product?.description || ""} />
            <ProductAdditionalAttributes attributes={product?.attribute_values || []} />
            <ProductDetailsShipping />
            <ProductDetailsSeller seller={product?.seller} />
            <ProductDetailsFooter tags={product?.tags || []} posted={product?.created_at} />
        </div>
    )
}
