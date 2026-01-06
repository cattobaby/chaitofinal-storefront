// /home/willman/WebstormProjects/new/new/storefront/src/components/organisms/ProductCard/ProductCard.tsx
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import type { Product as LocalProduct } from "@/types/product"
import type { SellerProps } from "@/types/seller"
import { StarRating } from "@/components/atoms/StarRating/StarRating"
import { StarIcon } from "@/icons"

type DisplayProduct =
    | (HttpTypes.StoreProduct & {
    seller?: SellerProps
    store?: { name: string }
    reviews?: { rating: number }[]
    created_at?: string
})
    | LocalProduct

type ApiProduct =
    | (HttpTypes.StoreProduct & {
    seller?: SellerProps
    store?: { name: string }
    reviews?: { rating: number }[]
    created_at?: string
})
    | undefined

export type ProductCardProps = {
    /**
     * Puede ser "ligero" (Product) o completo (StoreProduct)
     */
    product: DisplayProduct
    /**
     * Producto completo (StoreProduct) para calcular precio correctamente
     * cuando `product` viene "ligero".
     */
    api_product?: ApiProduct
    /**
     * Cookie global (BOB/USDT/...)
     */
    currencyCode?: string
}

function getSafeHandle(p: any): string {
    return typeof p?.handle === "string" ? p.handle : ""
}

function getSafeTitle(p: any): string {
    return typeof p?.title === "string" ? p.title : ""
}

function getSafeThumb(p: any): string | null {
    return typeof p?.thumbnail === "string" ? p.thumbnail : null
}

function getSafeCreatedAt(p: any): string | null {
    // LocalProduct has created_at, StoreProduct often has created_at too
    return typeof p?.created_at === "string" ? p.created_at : null
}

export const ProductCard = ({ product, api_product, currencyCode }: ProductCardProps) => {
    // ✅ Source for pricing: prefer api_product if available (it has variants/prices)
    const pricedSource: any = api_product ?? product

    const hasVariants =
        Array.isArray(pricedSource?.variants) && pricedSource.variants.length > 0

    const { cheapestPrice } = hasVariants
        ? getProductPrice({
            product: pricedSource,
            variantId: pricedSource.variants?.[0]?.id,
            currencyCode,
        })
        : { cheapestPrice: null as any }

    // UI data can come from "light" product or api_product
    const handle = getSafeHandle(product) || getSafeHandle(api_product)
    const title = getSafeTitle(product) || getSafeTitle(api_product)
    const thumbnail = getSafeThumb(product) || getSafeThumb(api_product)

    const reviews: any[] =
        ((product as any)?.reviews as any[]) ??
        ((api_product as any)?.reviews as any[]) ??
        []

    const rating =
        reviews?.length > 0
            ? reviews.reduce((acc, r) => acc + (Number(r?.rating) || 0), 0) / reviews.length
            : 0

    const createdAtRaw =
        getSafeCreatedAt(product) || getSafeCreatedAt(api_product) || null

    const createdAt = createdAtRaw ? new Date(createdAtRaw) : null
    const isNew =
        !!createdAt && !Number.isNaN(createdAt.getTime())
            ? Date.now() - createdAt.getTime() < 1000 * 60 * 60 * 24 * 14 // 14 days
            : false

    const hasDiscount = Boolean(cheapestPrice?.percentage_diff)
    const badgeLabel = isNew ? "NUEVO" : hasDiscount ? "OFERTA" : null

    const ratingLabel = rating > 0 ? rating.toFixed(1) : null

    const storeName =
        (product as any)?.store?.name ||
        (api_product as any)?.store?.name ||
        (product as any)?.seller?.store_name ||
        (api_product as any)?.seller?.store_name ||
        (product as any)?.seller?.name ||
        (api_product as any)?.seller?.name ||
        null

    if (!handle) return null

    return (
        <LocalizedClientLink
            href={`/products/${handle}`}
            className="
        group relative flex flex-col h-full overflow-hidden rounded-xl
        transition-all duration-300
        hover:-translate-y-0.5 hover:shadow-xl
        ring-1 ring-black/5

        /* Gradient border on hover */
        before:content-[''] before:absolute before:inset-0 before:rounded-xl
        before:bg-gradient-to-br before:from-brand-500 before:via-brand-300 before:to-green-300
        before:opacity-0 hover:before:opacity-100 before:transition-opacity before:pointer-events-none

        /* Inner glass layer */
        after:content-[''] after:absolute after:inset-[1px] after:rounded-[11px]
        after:bg-white/80 after:backdrop-blur-sm after:pointer-events-none
      "
        >
            {/* IMAGE */}
            <div className="relative z-10 w-full aspect-[4/5] bg-neutral-100 overflow-hidden">
                {thumbnail ? (
                    <Image
                        src={thumbnail}
                        alt={title}
                        fill
                        className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 576px) 50vw, (max-width: 992px) 33vw, 20vw"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-neutral-300">
                        Sin Imagen
                    </div>
                )}

                {/* Soft overlay depth */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Shine effect */}
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div
                        className="
              absolute -inset-y-10 -inset-x-24 rotate-12
              bg-gradient-to-r from-transparent via-white/25 to-transparent
              translate-x-[-220%] group-hover:translate-x-[220%]
              transition-transform duration-700
            "
                    />
                </div>

                {/* Top chips row */}
                <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
                    {/* Badge (NEW / OFERTA) */}
                    {badgeLabel ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-black/70 text-white backdrop-blur">
              {badgeLabel}
            </span>
                    ) : (
                        <span />
                    )}

                    {/* Rating chip */}
                    {ratingLabel ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-white/85 text-neutral-900 ring-1 ring-black/10 backdrop-blur">
              <StarIcon size={12} color="currentColor" />
                            {ratingLabel}
            </span>
                    ) : null}
                </div>

                {/* Price chip */}
                {cheapestPrice?.calculated_price ? (
                    <div className="absolute bottom-2 right-2">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-white/85 text-neutral-900 ring-1 ring-black/10 backdrop-blur">
              {cheapestPrice.calculated_price}
            </span>
                    </div>
                ) : null}

                {/* Discount badge */}
                {hasDiscount ? (
                    <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        -{cheapestPrice?.percentage_diff}%
                    </div>
                ) : null}
            </div>

            {/* DETAILS */}
            <div className="relative z-10 flex flex-col p-3 gap-1">
                {/* Price row */}
                <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold text-green-700">
            {cheapestPrice?.calculated_price ?? "—"}
          </span>

                    {cheapestPrice?.original_price &&
                        cheapestPrice?.original_price !== cheapestPrice?.calculated_price && (
                            <span className="text-xs text-neutral-400 line-through decoration-red-500/50">
                {cheapestPrice.original_price}
              </span>
                        )}
                </div>

                {/* Title */}
                <Text className="text-sm text-neutral-900 line-clamp-2 leading-tight min-h-[2.5em]">
                    {title}
                </Text>

                {/* Rating + store */}
                <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1">
                        <StarRating rate={rating} starSize={12} />
                        <span className="text-[10px] text-neutral-400">({reviews.length || 0})</span>
                    </div>

                    {storeName && (
                        <span className="text-[10px] text-neutral-500 font-medium truncate hover:text-brand-700">
              {storeName}
            </span>
                    )}
                </div>

                {/* Button (visual CTA) */}
                <button
                    className="
            mt-3 w-full py-2 rounded-md
            bg-brand-700 text-white text-xs font-bold
            shadow-sm
            hover:bg-green-700
            transition-colors
          "
                >
                    Añadir al carrito
                </button>
            </div>
        </LocalizedClientLink>
    )
}
