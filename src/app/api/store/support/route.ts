// app/api/store/support/route.ts
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE =
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

/**
 * Proxy GET /store/support
 */
export async function GET(req: NextRequest) {
    const url = new URL(`${BACKEND_URL}/store/support`)
    for (const [k, v] of req.nextUrl.searchParams) url.searchParams.set(k, v)

    const upstream = await fetch(url.toString(), {
        method: "GET",
        // reenviamos cookie de 3000 a 9000
        headers: {
            "x-publishable-api-key": PUBLISHABLE,
            cookie: req.headers.get("cookie") || "",
        },
        credentials: "include",
    })

    const body = await upstream.text()
    return new NextResponse(body, {
        status: upstream.status,
        headers: {
            "content-type": upstream.headers.get("content-type") || "application/json",
        },
    })
}

/**
 * Proxy POST /store/support
 */
export async function POST(req: NextRequest) {
    const target = `${BACKEND_URL}/store/support`

    const upstream = await fetch(target, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-publishable-api-key": PUBLISHABLE,
            cookie: req.headers.get("cookie") || "",
        },
        body: await req.text(),
        credentials: "include",
    })

    const body = await upstream.text()
    return new NextResponse(body, {
        status: upstream.status,
        headers: {
            "content-type": upstream.headers.get("content-type") || "application/json",
        },
    })
}
