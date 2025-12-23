// /home/willman/WebstormProjects/new/new/storefront/src/app/layout.tsx
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import "./globals.css"
import { Toaster } from "@medusajs/ui"

import { retrieveCart } from "@/lib/data/cart"
import { Providers } from "./providers"
import { FloatingMessageButton } from "@/components/molecules/FloatingMessageButton/FloatingMessageButton"

const montserrat = Montserrat({
    variable: "--font-montserrat",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
    title: {
        template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME || "Chaito - Marketplace"}`,
        default: process.env.NEXT_PUBLIC_SITE_NAME || "Chaito - Tu Marketplace de Confianza",
    },
    description:
        process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Chaito - Compra y venta segura en Bolivia",
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
    alternates: {
        languages: {
            "x-default": process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        },
    },
}

export default async function RootLayout({
                                             children,
                                             params,
                                         }: {
    children: React.ReactNode
    params?: { locale?: string }
}) {
    const cart = await retrieveCart()

    const ALGOLIA_APP = process.env.NEXT_PUBLIC_ALGOLIA_ID
    const htmlLang = params?.locale || "es"

    return (
        <html lang={htmlLang} className="">
        <head>
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
            <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

            <link rel="preconnect" href="https://i.imgur.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://i.imgur.com" />

            {ALGOLIA_APP && (
                <>
                    <link rel="preconnect" href="https://algolia.net" crossOrigin="anonymous" />
                    <link rel="preconnect" href="https://algolianet.com" crossOrigin="anonymous" />
                    <link rel="dns-prefetch" href="https://algolia.net" />
                    <link rel="dns-prefetch" href="https://algolianet.com" />
                </>
            )}

            {/* Image origins for faster LCP */}
            <link
                rel="preconnect"
                href="https://medusa-public-images.s3.eu-west-1.amazonaws.com"
                crossOrigin="anonymous"
            />
            <link rel="dns-prefetch" href="https://medusa-public-images.s3.eu-west-1.amazonaws.com" />

            <link
                rel="preconnect"
                href="https://mercur-connect.s3.eu-central-1.amazonaws.com"
                crossOrigin="anonymous"
            />
            <link rel="dns-prefetch" href="https://mercur-connect.s3.eu-central-1.amazonaws.com" />

            <link rel="preconnect" href="https://s3.eu-central-1.amazonaws.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://s3.eu-central-1.amazonaws.com" />

            <link rel="preconnect" href="https://api.mercurjs.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://api.mercurjs.com" />
        </head>

        <body className={`${montserrat.className} antialiased bg-primary text-secondary relative`}>
        <Providers cart={cart}>
            {children}

            {/* ✅ Global en toda la app */}
            <FloatingMessageButton />
        </Providers>

        <Toaster position="top-right" />
        </body>
        </html>
    )
}
