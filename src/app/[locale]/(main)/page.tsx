import { Hero, ProductListing } from "@/components/sections"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { listRegions } from "@/lib/data/regions"
import { toHreflang } from "@/lib/helpers/hreflang"
import { getCurrencyCodeFromCookieHeader } from "@/lib/server/currency"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") || "https"
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`

  // FIX: Explicitly type the object so TS accepts string keys
  let languages: Record<string, string> = {}

  try {
    const regions = await listRegions()
    // FIX: Force type assertion to string[] to avoid 'undefined' issues
    const locales = Array.from(new Set((regions || []).map((r) => r.countries?.map((c) => c.iso_2) || []).flat().filter(Boolean))) as string[]
    
    // FIX: Add type generic to reduce
    languages = locales.reduce<Record<string, string>>((acc, code) => {
      acc[toHreflang(code)] = `${baseUrl}/${code}`
      return acc
    }, {})
  } catch {
    languages = { [toHreflang(locale)]: `${baseUrl}/${locale}` }
  }

  return {
    title: "Chaito",
    description: "Tu Marketplace de confianza en Bolivia.",
    alternates: { canonical: `${baseUrl}/${locale}`, languages: { ...languages, "x-default": baseUrl } },
    openGraph: { title: "Chaito | Marketplace", description: "Tu Marketplace de confianza.", url: `${baseUrl}/${locale}`, siteName: "Chaito Marketplace", type: "website", images: [{ url: `${baseUrl}/B2C_Storefront_Open_Graph.png` }] }
  }
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const headersList = await headers()
  const cookieHeader = headersList.get("cookie")
  const currencyCode = getCurrencyCodeFromCookieHeader(cookieHeader)

  return (
    <main className="flex flex-col gap-6 bg-gradient-to-b from-green-50 via-neutral-50 to-neutral-50 pb-12">
      <Script id="ld-org" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "Chaito Marketplace", url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"}/${locale}`, logo: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"}/favicon.ico` }) }} />
      <div className="container mx-auto px-4 lg:px-8 mt-6">
        <Hero images={["/images/hero/image1.jpg", "/images/hero/image2.jpg", "/images/hero/image3.jpg"]} heading="" paragraph="" buttons={[]} />
      </div>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="rounded-xl p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold uppercase tracking-wide text-green-700">Recomendados</h2>
            <ProductListing showSidebar={false} locale={locale} currencyCode={currencyCode} />
          </div>
        </div>
      </div>
    </main>
  )
}