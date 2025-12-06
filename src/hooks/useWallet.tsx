// storefront/src/hooks/useWallet.ts
"use client"

import { useEffect, useState } from "react"
import { getWallet, type WalletSummary } from "@/lib/data/wallet"

type UseWalletResult = {
    wallet: WalletSummary | null
    points: number
    loading: boolean
    error: Error | null
}

export function useWallet(): UseWalletResult {
    const [wallet, setWallet] = useState<WalletSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                setLoading(true)
                const w = await getWallet()
                if (!cancelled) {
                    setWallet(w)
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err as Error)
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        load()

        return () => {
            cancelled = true
        }
    }, [])

    return {
        wallet,
        points: wallet?.points ?? 0,
        loading,
        error,
    }
}
