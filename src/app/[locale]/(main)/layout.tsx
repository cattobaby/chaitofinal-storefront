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
  const cookieHeader = (await headers()).get("cookie")
  
  const user = await retrieveCustomer()
  const regionCheck = await checkRegion(locale)

  if (!regionCheck) {
    return redirect("/")
  }

  const authHeaders = (await getAuthHeaders())
  const token = authHeaders?.authorization?.split(" ")[1] || null

  return (
    <>
      <HeaderServer cookieHeader={cookieHeader} />
      {children}
      <Footer />
      <FloatingChatWidget token={token} />
    </>
  )
}