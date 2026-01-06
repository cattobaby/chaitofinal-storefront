// /home/willman/WebstormProjects/new/new/storefront/src/app/api/currency/route.ts
import { NextResponse } from "next/server"
import { normalizeCurrency } from "@/lib/data/currency"

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({} as any))
    const currencyRaw = body?.currency

    if (typeof currencyRaw !== "string") {
        return NextResponse.json({ error: "Invalid currency" }, { status: 400 })
    }

    const currency = normalizeCurrency(currencyRaw)

    const res = NextResponse.json({ ok: true, currency })

    res.cookies.set("chaito_currency", currency, {
        path: "/",
        sameSite: "lax",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 365,
    })

    return res
}
