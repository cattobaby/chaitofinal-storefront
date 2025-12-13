// app/api/store/support/[id]/messages/route.ts
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE =
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

/**
 * Proxy GET /store/support/:id/messages
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const upstream = await fetch(
        `${BACKEND_URL}/store/support/${params.id}/messages`,
        {
            method: "GET",
            headers: {
                "x-publishable-api-key": PUBLISHABLE,
                cookie: req.headers.get("cookie") || "",
            },
            credentials: "include",
        }
    )

    const body = await upstream.text()
    return new NextResponse(body, {
        status: upstream.status,
        headers: {
            "content-type": upstream.headers.get("content-type") || "application/json",
        },
    })
}

/**
 * Proxy POST /store/support/:id/messages
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const upstream = await fetch(
        `${BACKEND_URL}/store/support/${params.id}/messages`,
        {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-publishable-api-key": PUBLISHABLE,
                cookie: req.headers.get("cookie") || "",
            },
            body: await req.text(),
            credentials: "include",
        }
    )

    const body = await upstream.text()
    return new NextResponse(body, {
        status: upstream.status,
        headers: {
            "content-type": upstream.headers.get("content-type") || "application/json",
        },
    })
}
