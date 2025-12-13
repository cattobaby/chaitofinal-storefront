import Image from "next/image"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { Text } from "@medusajs/ui"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { StarRating } from "@/components/atoms/StarRating/StarRating"

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

    // Calculate average rating
    const rating = product.reviews?.length
        ? product.reviews.reduce((acc, review) => acc + review.rating, 0) /
        product.reviews.length
        : 0

    return (
        <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="group flex flex-col h-full hover:shadow-lg transition-shadow rounded-lg overflow-hidden bg-white border border-transparent hover:border-neutral-100"
        >
            {/* Image Section */}
            <div className="relative w-full aspect-[4/5] bg-neutral-100 overflow-hidden">
                {product.thumbnail ? (
                    <Image
                        src={product.thumbnail}
                        alt={product.title}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 576px) 50vw, (max-width: 992px) 33vw, 20vw"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-neutral-300">
                        No Image
                    </div>
                )}

                {/* Optional: Discount Badge - Kept Red for urgency */}
                {cheapestPrice?.percentage_diff ? (
                    <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                        -{cheapestPrice.percentage_diff}%
                    </div>
                ) : null}
            </div>

            {/* Details Section */}
            <div className="flex flex-col p-2 gap-1">

                {/* Price */}
                <div className="flex items-baseline gap-1.5">
                    {/* UPDATED: Changed text-brand-900 to text-green-700 to make price stand out */}
                    <span className="text-base font-bold text-green-700">
             {cheapestPrice?.calculated_price}
           </span>
                    {cheapestPrice?.original_price !== cheapestPrice?.calculated_price && (
                        <span className="text-xs text-neutral-400 line-through decoration-red-500/50">
               {cheapestPrice?.original_price}
             </span>
                    )}
                </div>

                {/* Product Title */}
                <Text className="text-sm text-neutral-900 line-clamp-2 leading-tight min-h-[2.5em]">
                    {product.title}
                </Text>

                {/* Store Name & Rating Row */}
                <div className="flex flex-col gap-1 mt-1">

                    {/* Star Rating */}
                    <div className="flex items-center gap-1">
                        {/* FIXED PROPS HERE: rate & starSize */}
                        <StarRating rate={rating} starSize={12} />
                        <span className="text-[10px] text-neutral-400">
                    ({product.reviews?.length || 0})
                </span>
                    </div>

                    {/* Store Name (If available) */}
                    {product.store?.name && (
                        <span className="text-[10px] text-neutral-500 font-medium truncate hover:text-brand-700">
                    {product.store.name}
                </span>
                    )}
                </div>

                {/* Add to Cart Button */}
                <button className="mt-2 w-full py-1.5 bg-brand-100 text-brand-900 text-xs font-bold rounded hover:bg-brand-200 transition-colors opacity-0 group-hover:opacity-100">
                    Añadir al carrito
                </button>

            </div>
        </LocalizedClientLink>
    )
}