import NotFound from "@/app/not-found"
import { Breadcrumbs } from "@/components/atoms"
import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { AlgoliaProductsListing, ProductListing } from "@/components/sections"
import { getCollectionByHandle } from "@/lib/data/collections"
import isBot from "@/lib/helpers/isBot"
import { Suspense } from "react"
import { headers } from "next/headers"
import { getCurrencyCodeFromCookieHeader } from "@/lib/server/currency"

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY

const SingleCollectionsPage = async ({
                                         params,
                                     }: {
    params: Promise<{ handle: string; locale: string }>
}) => {
    const { handle, locale } = await params

    const headersList = await headers()
    const ua = headersList.get("user-agent") || ""
    const bot = isBot(ua)

    // ✅ currency from cookie header
    const cookieHeader = headersList.get("cookie")
    const currencyCode = getCurrencyCodeFromCookieHeader(cookieHeader)

    const collection = await getCollectionByHandle(handle)
    if (!collection) return <NotFound />

    const breadcrumbsItems = [
        {
            path: collection.handle,
            label: collection.title,
        },
    ]

    return (
        <main className="container">
            <div className="hidden md:block mb-2">
                <Breadcrumbs items={breadcrumbsItems} />
            </div>

            <h1 className="heading-xl uppercase">{collection.title}</h1>

            <Suspense fallback={<ProductListingSkeleton />}>
                {bot || !ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
                    <ProductListing
                        collection_id={collection.id}
                        showSidebar
                        locale={locale}
                        currencyCode={currencyCode}
                    />
                ) : (
                    <AlgoliaProductsListing
                        collection_id={collection.id}
                        locale={locale}
                        currency_code={currencyCode.toLowerCase()}
                    />
                )}
            </Suspense>
        </main>
    )
}

export default SingleCollectionsPage
