import { ProductDetails, ProductGallery } from "@/components/organisms"
import { listProducts } from "@/lib/data/products"
import { HomeProductSection } from "../HomeProductSection/HomeProductSection"
import NotFound from "@/app/not-found"

export const ProductDetailsPage = async ({
                                             handle,
                                             locale,
                                             currencyCode,
                                         }: {
    handle: string
    locale: string
    currencyCode: string
}) => {
    const prod = await listProducts({
        countryCode: locale,
        queryParams: { handle: [handle], limit: 1 },
        forceCache: true,
    }).then(({ response }) => response.products[0])

    if (!prod) return null

    if (prod.seller?.store_status === "SUSPENDED") {
        return NotFound()
    }

    return (
        <>
            <div className="flex flex-col md:flex-row lg:gap-12">
                <div className="md:w-1/2 md:px-2">
                    <ProductGallery images={prod?.images || []} />
                </div>
                <div className="md:w-1/2 md:px-2">
                    <ProductDetails
                        product={prod}
                        locale={locale}
                        currencyCode={currencyCode} // ✅ Pass it down
                    />
                </div>
            </div>
            <div className="my-8">
                <HomeProductSection
                    heading="Más de este vendedor"
                    products={prod.seller?.products}
                    locale={locale}
                />
            </div>
        </>
    )
}