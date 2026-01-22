import { ProductCard } from "../ProductCard/ProductCard"
import { HttpTypes } from "@medusajs/types"

export const ProductsList = ({
  products,
  currencyCode,
}: {
  products: HttpTypes.StoreProduct[]
  currencyCode?: string
}) => {
  return (
    <>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          // @ts-ignore
          product={product}
          currencyCode={currencyCode}
        />
      ))}
    </>
  )
}