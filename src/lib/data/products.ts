// /home/willman/WebstormProjects/new/new/storefront/src/lib/data/products.ts
"use server"

import { sdk } from "../config"
import { sortProducts } from "@/lib/helpers/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@/types/product"
import { getAuthHeaders } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"
import { SellerProps } from "@/types/seller"

export const listProducts = async ({
                                     pageParam = 1,
                                     queryParams,
                                     countryCode,
                                     regionId,
                                     category_id,
                                     collection_id,
                                     forceCache = false,
                                   }: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams &
    HttpTypes.StoreProductParams & {
    handle?: string[]
  }
  category_id?: string
  collection_id?: string
  countryCode?: string
  regionId?: string
  forceCache?: boolean
}): Promise<{
  response: {
    products: (HttpTypes.StoreProduct & { seller?: SellerProps })[]
    count: number
  }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
    // ✅ CRUCIAL: Identificar el canal de ventas público
    "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
  }

  const useCached = forceCache || (limit <= 8 && !category_id && !collection_id)

  return sdk.client
    .fetch<{
      products: (HttpTypes.StoreProduct & { seller?: SellerProps })[]
      count: number
    }>(`/store/products`, {
      method: "GET",
      query: {
        country_code: countryCode,
        category_id,
        collection_id,
        limit,
        offset,
        region_id: region?.id,
        // ✅ OPTIMIZADO: Eliminamos la carga profunda (*seller.products) para evitar Error 400
        fields: [
          "*title",
          "*handle",
          "*thumbnail",
          "*status",
          "*created_at",
          "*description",
          "*variants",
          "*variants.calculated_price",
          "*variants.prices",
          "+variants.inventory_quantity",
          "*variants.options",
          "*seller",                 // Info básica del vendedor
          "*seller.reviews",         // Reviews para calcular rating
          "*attribute_values",
          "*attribute_values.attribute"
        ].join(","),
        ...queryParams,
      },
      headers,
      next: useCached ? { revalidate: 60 } : undefined,
      cache: useCached ? "force-cache" : "no-cache",
    })
    .then(({ products: productsRaw, count }) => {
      // 1. Filtrar vendedores suspendidos
      const activeProducts = productsRaw.filter(
        (product) => !product.seller || product.seller.store_status !== "SUSPENDED"
      )

      const nextPage = count > offset + limit ? pageParam + 1 : null

      // 2. Mapear para asegurar estructura segura (Reviews array)
      const response = activeProducts.map((prod) => {
        if (prod.seller) {
          // @ts-ignore
          const reviews = prod.seller.reviews?.filter((item) => !!item) ?? [];
          return {
            ...prod,
            seller: {
              ...prod.seller,
              reviews
            }
          };
        }
        return prod;
      });

      return {
        response: {
          products: response,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
    .catch((err) => {
      console.error("Error fetching products:", err)
      return {
        response: {
          products: [],
          count: 0,
        },
        nextPage: 0,
        queryParams,
      }
    })
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
                                             page = 1,
                                             queryParams,
                                             sortBy = "created_at",
                                             countryCode,
                                             category_id,
                                             seller_id,
                                             collection_id,
                                           }: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
  category_id?: string
  seller_id?: string
  collection_id?: string
}): Promise<{
  response: {
    products: HttpTypes.StoreProduct[]
    count: number
  }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    category_id,
    collection_id,
    countryCode,
  })

  const filteredProducts = seller_id
    ? products.filter((product) => product.seller?.id === seller_id)
    : products

  const pricedProducts = filteredProducts.filter((prod) =>
    prod.variants?.some((variant) => variant.calculated_price !== null)
  )

  const sortedProducts = sortProducts(pricedProducts, sortBy)

  const pageParam = (page - 1) * limit

  const nextPage = count > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}