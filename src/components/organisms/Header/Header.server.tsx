// /home/willman/WebstormProjects/new/new/storefront/src/components/organisms/Header/Header.server.tsx
import { Header } from "./Header"
import { DEFAULT_CURRENCY, normalizeCurrency } from "@/lib/data/currency"
import { getCurrencyCodeFromCookieHeader } from "@/lib/server/currency"

type HeaderServerProps = {
    cookieHeader?: string | null
    initialCurrency?: string
}

export const HeaderServer = async ({
                                       cookieHeader,
                                       initialCurrency,
                                   }: HeaderServerProps = {}) => {
    const fromCookie = cookieHeader
        ? getCurrencyCodeFromCookieHeader(cookieHeader)
        : null

    const resolved = normalizeCurrency(fromCookie || initialCurrency || DEFAULT_CURRENCY)

    return <Header initialCurrency={resolved} />
}
