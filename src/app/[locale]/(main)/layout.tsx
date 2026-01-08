// /home/willman/WebstormProjects/new/new/storefront/src/app/[locale]/(main)/layout.tsx
import { Footer } from "@/components/organisms"
import { HeaderServer } from "@/components/organisms/Header/Header.server"
import { retrieveCustomer } from "@/lib/data/customer"
import { checkRegion } from "@/lib/helpers/check-region"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { FloatingChatWidget } from "@/components/molecules/FloatingChatWidget/FloatingChatWidget"
import { getAuthHeaders } from "@/lib/data/cookies"

export default async function RootLayout({
                                             children,
                                             params,
                                         }: Readonly<{
    children: React.ReactNode
    params: Promise<{ locale: string }>
}>) {
    const { locale } = await params

    // ✅ read cookies safely at the layout (server component)
    const cookieHeader = (await headers()).get("cookie")

    const user = await retrieveCustomer()
    const regionCheck = await checkRegion(locale)

    if (!regionCheck) {
        return redirect("/")
    }

    // Get Auth Token for the widget
    const authHeaders = (await getAuthHeaders()) as { authorization?: string } | null
    const token = authHeaders?.authorization?.split(" ")[1] || null

    return (
        <>
            <HeaderServer cookieHeader={cookieHeader} />
            {children}
            <Footer />
            {/* Inject Custom Chat Widget */}
            <FloatingChatWidget token={token} />
        </>
    )
}