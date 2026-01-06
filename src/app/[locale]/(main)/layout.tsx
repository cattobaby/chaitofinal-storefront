// /home/willman/WebstormProjects/new/new/storefront/src/app/[locale]/(main)/layout.tsx
import { Footer } from "@/components/organisms"
import { HeaderServer } from "@/components/organisms/Header/Header.server"
import { retrieveCustomer } from "@/lib/data/customer"
import { checkRegion } from "@/lib/helpers/check-region"
import { Session } from "@talkjs/react"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export default async function RootLayout({
                                             children,
                                             params,
                                         }: Readonly<{
    children: React.ReactNode
    params: Promise<{ locale: string }>
}>) {
    const APP_ID = process.env.NEXT_PUBLIC_TALKJS_APP_ID
    const { locale } = await params

    // ✅ read cookies safely at the layout (server component)
    const cookieHeader = (await headers()).get("cookie")

    const user = await retrieveCustomer()
    const regionCheck = await checkRegion(locale)

    if (!regionCheck) {
        return redirect("/")
    }

    if (!APP_ID || !user)
        return (
            <>
                <HeaderServer cookieHeader={cookieHeader} />
                {children}
                <Footer />
            </>
        )

    return (
        <>
            <Session appId={APP_ID} userId={user.id}>
                <HeaderServer cookieHeader={cookieHeader} />
                {children}
                <Footer />
            </Session>
        </>
    )
}
