// /home/willman/WebstormProjects/new/new/storefront/src/components/sections/ProductListing/ProductListing.tsx

import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import { listProducts } from "@/lib/data/products"
import { DEFAULT_CURRENCY, normalizeCurrency } from "@/lib/data/currency"

type ProductListingProps = {
    category_id?: string
    collection_id?: string
    showSidebar?: boolean
    locale: string
    /**
     * ✅ Moneda global (inyectada desde layout/page server)
     */
    currencyCode?: string
}

export const ProductListing = async ({
                                         category_id,
                                         collection_id,
                                         showSidebar: _showSidebar = true, // (se deja por compat, pero no se usa aquí)
                                         locale,
                                         currencyCode,
                                     }: ProductListingProps) => {
    const resolvedCurrency = normalizeCurrency(currencyCode || DEFAULT_CURRENCY)

    const { response } = await listProducts({
        countryCode: locale,
        category_id,
        collection_id,
        queryParams: { limit: 20 },
    })

    if (!response.products.length) {
        return (
            <div className="py-10 text-center text-gray-500">
                No se encontraron productos.
            </div>
        )
    }

    return (
        <div className="w-full">
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-6">
                {response.products.map((product) => (
                    <li key={product.id}>
                        <ProductCard product={product} currencyCode={resolvedCurrency} />
                    </li>
                ))}
            </ul>
        </div>
    )
}
