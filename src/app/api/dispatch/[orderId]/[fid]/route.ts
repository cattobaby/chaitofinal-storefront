import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

async function getBearerFromStorefrontCookies() {
    const c = await cookies()
    const token = c.get("_medusa_jwt")?.value
    if (!token) return ""
    return token.startsWith("Bearer ") ? token : `Bearer ${token}`
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ orderId: string; fid: string }> }
) {
    const { orderId, fid } = await params

    const backend =
        process.env.MEDUSA_BACKEND_URL ||
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
        "http://localhost:9000"

    const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    const auth = await getBearerFromStorefrontCookies()

    const url = new URL(
        `${backend}/store/orders/${orderId}/fulfillments/${fid}/dispatch`
    )
    url.searchParams.set("_ts", Date.now().toString())

    const res = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
        headers: {
            Accept: "application/json",
            ...(pubKey ? { "x-publishable-api-key": pubKey } : {}),
            ...(auth ? { authorization: auth } : {}),
        },
    })

    // Passthrough del body (normalmente JSON)
    const body = await res.text()

    return new NextResponse(body, {
        status: res.status,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
    })
}
