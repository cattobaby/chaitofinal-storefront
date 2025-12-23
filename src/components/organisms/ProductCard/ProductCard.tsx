import Image from "next/image"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { Text } from "@medusajs/ui"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { StarRating } from "@/components/atoms/StarRating/StarRating"
import { StarIcon } from "@/icons"

type ProductCardProps = {
    product: HttpTypes.StoreProduct & {
        store?: { name: string }
        reviews?: { rating: number }[]
    }
}

export const ProductCard = ({ product }: ProductCardProps) => {
    const { cheapestPrice } = getProductPrice({
        product,
        variantId: product.variants?.[0]?.id,
    })

    // Average rating
    const rating = product.reviews?.length
        ? product.reviews.reduce((acc, review) => acc + review.rating, 0) /
        product.reviews.length
        : 0

    // "NEW" badge: try to infer from created_at if present (Medusa often provides it)
    const createdAtRaw = (product as any)?.created_at
    const createdAt = createdAtRaw ? new Date(createdAtRaw) : null
    const isNew =
        !!createdAt && Date.now() - createdAt.getTime() < 1000 * 60 * 60 * 24 * 14 // 14 days

    const hasDiscount = Boolean(cheapestPrice?.percentage_diff)
    const badgeLabel = isNew ? "NUEVO" : hasDiscount ? "OFERTA" : null

    // Friendly rating label (chip)
    const ratingLabel = rating > 0 ? rating.toFixed(1) : null

    return (
        <LocalizedClientLink
            href={`/products/${product.handle}`}
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
                {product.thumbnail ? (
                    <Image
                        src={product.thumbnail}
                        alt={product.title}
                        fill
                        className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 576px) 50vw, (max-width: 992px) 33vw, 20vw"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-neutral-300">
                        No Image
                    </div>
                )}

                {/* Soft overlay depth */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Shine effect */}
                <div
                    className="
            pointer-events-none absolute inset-0
            opacity-0 group-hover:opacity-100 transition-opacity duration-300
          "
                >
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

                {/* Discount badge (kept red for urgency) */}
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
            {cheapestPrice?.calculated_price}
          </span>

                    {cheapestPrice?.original_price !== cheapestPrice?.calculated_price && (
                        <span className="text-xs text-neutral-400 line-through decoration-red-500/50">
              {cheapestPrice?.original_price}
            </span>
                    )}
                </div>

                {/* Title */}
                <Text className="text-sm text-neutral-900 line-clamp-2 leading-tight min-h-[2.5em]">
                    {product.title}
                </Text>

                {/* Rating + store */}
                <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1">
                        <StarRating rate={rating} starSize={12} />
                        <span className="text-[10px] text-neutral-400">
              ({product.reviews?.length || 0})
            </span>
                    </div>

                    {product.store?.name && (
                        <span className="text-[10px] text-neutral-500 font-medium truncate hover:text-brand-700">
              {product.store.name}
            </span>
                    )}
                </div>

                {/* Button (always visible, morado/brand) */}
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
