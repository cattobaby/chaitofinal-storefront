import { ProductDetailsPage } from "@/components/sections"
import { listProducts } from "@/lib/data/products"
import { generateProductMetadata } from "@/lib/helpers/seo"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { getCurrencyCodeFromCookieHeader } from "@/lib/server/currency"

export async function generateMetadata({
                                           params,
                                       }: {
    params: Promise<{ handle: string; locale: string }>
}): Promise<Metadata> {
    const { handle, locale } = await params

    const prod = await listProducts({
        countryCode: locale,
        queryParams: { handle: [handle], limit: 1 },
        forceCache: true,
    }).then(({ response }) => response.products[0])

    return generateProductMetadata(prod)
}

export default async function ProductPage({
                                              params,
                                          }: {
    params: Promise<{ handle: string; locale: string }>
}) {
    const { handle, locale } = await params

    // ✅ Read currency from cookie
    const headersList = await headers()
    const cookieHeader = headersList.get("cookie")
    const currencyCode = getCurrencyCodeFromCookieHeader(cookieHeader)

    return (
        <main className="container">
            <ProductDetailsPage
                handle={handle}
                locale={locale}
                currencyCode={currencyCode} // ✅ Pass it down
            />
        </main>
    )
}