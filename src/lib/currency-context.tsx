// /home/willman/WebstormProjects/new/new/storefront/src/lib/currency-context.tsx
"use client"

import { createContext } from "react"
import { DEFAULT_CURRENCY, normalizeCurrency } from "@/lib/data/currency"

export const CurrencyContext = createContext<string>(DEFAULT_CURRENCY)

export function CurrencyProvider({
                                     currencyCode,
                                     children,
                                 }: {
    currencyCode: string
    children: React.ReactNode
}) {
    const resolved = normalizeCurrency(currencyCode || DEFAULT_CURRENCY)

    return (
        <CurrencyContext.Provider value={resolved}>
            {children}
        </CurrencyContext.Provider>
    )
}
