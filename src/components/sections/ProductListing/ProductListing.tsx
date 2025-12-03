import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import { listProducts } from "@/lib/data/products"
import { HttpTypes } from "@medusajs/types"

type ProductListingProps = {
  category_id?: string
  collection_id?: string
  showSidebar?: boolean
  locale: string
}

export const ProductListing = async ({
                                       category_id,
                                       collection_id,
                                       showSidebar = true,
                                       locale
                                     }: ProductListingProps) => {

  const { response } = await listProducts({
    countryCode: locale,
    category_id: category_id,
    // FIXED PROP NAME HERE: collectionId -> collection_id
    collection_id: collection_id,
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
      {/* 5 Column Grid */}
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-6">
        {response.products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  )
}