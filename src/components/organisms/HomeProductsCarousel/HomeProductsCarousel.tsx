import { Carousel } from "@/components/cells"
import { ProductCard } from "../ProductCard/ProductCard"
import { listProducts } from "@/lib/data/products"
import { Product } from "@/types/product"
import { HttpTypes } from "@medusajs/types"
import { DEFAULT_CURRENCY, normalizeCurrency } from "@/lib/data/currency"

export const HomeProductsCarousel = async ({
  locale,
  sellerProducts,
  home,
  currencyCode,
}: {
  locale: string
  sellerProducts: Product[]
  home: boolean
  currencyCode?: string
}) => {
  const resolvedCurrency = normalizeCurrency(currencyCode || DEFAULT_CURRENCY)
  const handles = home ? undefined : sellerProducts.map((p) => p.handle)

  const {
    response: { products },
  } = await listProducts({
    countryCode: locale,
    queryParams: {
      limit: home ? 4 : undefined,
      order: "created_at",
      handle: handles,
    },
    forceCache: !home,
  })

  if (!products.length) return null

  const ordered: HttpTypes.StoreProduct[] = handles?.length
    ? [...(products as HttpTypes.StoreProduct[])].sort(
        (a, b) => handles.indexOf(a.handle) - handles.indexOf(b.handle)
      )
    : (products as HttpTypes.StoreProduct[])

  return (
    <div className="flex justify-center w-full">
      <Carousel
        align="start"
        items={ordered.map((product) => (
          <ProductCard
            key={product.id}
            // @ts-ignore -- Forced cast to compatible type
            product={product as any}
            currencyCode={resolvedCurrency}
          />
        ))}
      />
    </div>
  )
}