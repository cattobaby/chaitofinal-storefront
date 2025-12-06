// storefront/src/lib/data/wallet.ts

export type WalletSummary = {
    customer_id: string
    points: number
}

/**
 * Shared helper to fetch the wallet from our own Next API route.
 * - On the client, we can call `/api/wallet` directly.
 * - On the server, Node's fetch needs an absolute URL.
 */
export async function getWallet(): Promise<WalletSummary | null> {
    try {
        const isServer = typeof window === "undefined"

        // Use NEXT_PUBLIC_BASE_URL from your .env
        const origin =
            process.env.NEXT_PUBLIC_BASE_URL ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            "http://localhost:3000"

        const base = origin.replace(/\/$/, "")
        const url = isServer ? `${base}/api/wallet` : "/api/wallet"

        const res = await fetch(url, {
            method: "GET",
            credentials: "include", // browser sends cookies; no-op on server
            cache: "no-store",
        })

        if (!res.ok) {
            if (res.status !== 401) {
                console.error(
                    "[wallet] Failed to fetch /api/wallet",
                    res.status,
                    res.statusText
                )
            }
            return null
        }

        const json = (await res.json()) as { wallet?: WalletSummary }
        return json.wallet ?? null
    } catch (e) {
        console.error("[wallet] Error fetching /api/wallet", e)
        return null
    }
}
