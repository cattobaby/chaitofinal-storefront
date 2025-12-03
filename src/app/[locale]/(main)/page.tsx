import {
  Hero,
  ProductListing, // We import the main product grid component
} from "@/components/sections"

import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { listRegions } from "@/lib/data/regions"
import { toHreflang } from "@/lib/helpers/hreflang"

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

  // Build alternates based on available regions (locales)
  let languages: Record<string, string> = {}
  try {
    const regions = await listRegions()
    const locales = Array.from(
      new Set(
        (regions || [])
          .map((r) => r.countries?.map((c) => c.iso_2) || [])
          .flat()
          .filter(Boolean)
      )
    ) as string[]

    languages = locales.reduce<Record<string, string>>((acc, code) => {
      const hrefLang = toHreflang(code)
      acc[hrefLang] = `${baseUrl}/${code}`
      return acc
    }, {})
  } catch {
    languages = { [toHreflang(locale)]: `${baseUrl}/${locale}` }
  }

  const title = "Chaito"
  const description = "Tu Marketplace de confianza en Bolivia."
  const ogImage = "/B2C_Storefront_Open_Graph.png"
  const canonical = `${baseUrl}/${locale}`

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: { ...languages, "x-default": baseUrl },
    },
    openGraph: {
      title: `${title} | Marketplace`,
      description,
      url: canonical,
      siteName: "Chaito Marketplace",
      type: "website",
      images: [
        {
          url: ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`,
          width: 1200,
          height: 630,
          alt: "Chaito Marketplace",
        },
      ],
    },
  }
}

export default async function Home({
                                     params,
                                   }: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") || "https"
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`
  const siteName = "Chaito Marketplace"

  return (
    <main className="flex flex-col gap-6 bg-neutral-50 pb-12">
      <link
        rel="preload"
        as="image"
        href="/images/hero/image1.jpg"
        imageSrcSet="/images/hero/image1.jpg 700w"
        imageSizes="(min-width: 1024px) 50vw, 100vw"
      />
      <Script
        id="ld-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: siteName,
            url: `${baseUrl}/${locale}`,
            logo: `${baseUrl}/favicon.ico`,
          }),
        }}
      />

      {/* 1. THIN BANNER (Contained & Padding) */}
      <div className="container mx-auto px-4 lg:px-8 mt-6">
        <Hero
          image="/images/hero/image1.jpg"
          heading="" // Empty heading for non-invasive look
          paragraph="" // Empty paragraph
          buttons={[]} // No buttons
        />
      </div>

      {/* 2. PRODUCT FEED (Dense Grid) */}
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold uppercase tracking-wide text-brand-700">
            Recomendados
          </h2>
          {/* Reuse the category listing component but for the homepage */}
          <ProductListing showSidebar={false} locale={locale} />
        </div>
      </div>
    </main>
  )
}