import { HomeProductsCarousel } from "@/components/organisms"
import { Product } from "@/types/product"

export const HomeProductSection = async ({
                                             heading,
                                             locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || "pl",
                                             products = [],
                                             home = false,
                                         }: {
    heading: string
    locale?: string
    products?: Product[]
    home?: boolean
}) => {
    return (
        <section className="py-8 w-full">
            {/* UPDATED: Added text-green-700 to headline */}
            <h2 className="mb-6 heading-lg font-bold tracking-tight uppercase text-green-700">
                {heading}
            </h2>
            <HomeProductsCarousel
                locale={locale}
                sellerProducts={products.slice(0, 4)}
                home={home}
            />
        </section>
    )
}