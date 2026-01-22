"use client"

import { HttpTypes } from "@medusajs/types"
import { Carousel } from "@/components/cells"
import { client } from "@/lib/client"
import { Configure, useHits } from "react-instantsearch"
import { InstantSearchNext } from "react-instantsearch-nextjs"
import { ProductCard } from "../ProductCard/ProductCard"
import { listProducts } from "@/lib/data/products"
import { useEffect, useState } from "react"
import { getProductPrice } from "@/lib/helpers/get-product-price"

export const AlgoliaProductsCarousel = ({
  locale,
  seller_handle,
  currency_code,
}: {
  locale: string
  seller_handle?: string
  currency_code: string
}) => {
  const filters = `${
    seller_handle
      ? `NOT seller:null AND seller.handle:${seller_handle} AND `
      : "NOT seller:null AND "
  }NOT seller.store_status:SUSPENDED AND supported_countries:${locale} AND variants.prices.currency_code:${currency_code}`

  return (
    <InstantSearchNext searchClient={client} indexName="products">
      <Configure hitsPerPage={4} filters={filters} />
      <ProductsListing locale={locale} />
    </InstantSearchNext>
  )
}

const ProductsListing = ({ locale }: { locale: string }) => {
  const [prod, setProd] = useState<HttpTypes.StoreProduct[] | null>(null)
  const { items } = useHits()

  useEffect(() => {
    listProducts({
      countryCode: locale,
      queryParams: {
        limit: 99999,
        fields:
          "*variants.calculated_price,*seller.reviews,-thumbnail,-images,-type,-tags,-variants.options,-options,-collection,-collection_id",
      },
    }).then(({ response }) => {
      setProd(response.products)
    })
  }, [])

  return (
    <>
      <div className="flex justify-between w-full items-center"></div>
      <div className="w-full ">
        {!items.length ? (
          <div className="text-center w-full my-10">
            <h2 className="uppercase text-primary heading-lg">sin resultados</h2>
            <p className="mt-4 text-lg">
              Lo sentimos, no encontramos resultados para tus criterios.
            </p>
          </div>
        ) : (
          <div className="w-full">
            <Carousel
              align="start"
              items={items.map((hit: any) => (
                <ProductCard
                  key={hit.objectID}
                  // @ts-ignore -- Forced cast for Algolia Hit compatibility
                  product={hit}
                  // @ts-ignore -- Forced cast for API product compatibility
                  api_product={prod?.find((p) => p.id === hit.objectID)}
                />
              ))}
            />
          </div>
        )}
      </div>
    </>
  )
}