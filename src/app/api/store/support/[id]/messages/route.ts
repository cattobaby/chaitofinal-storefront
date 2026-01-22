import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const upstream = await fetch(`${BACKEND_URL}/store/support/${params.id}/messages`, {
        method: "GET",
        headers: { "x-publishable-api-key": PUBLISHABLE, cookie: req.headers.get("cookie") || "" },
        credentials: "include",
    })
    const body = await upstream.text()
    return new NextResponse(body, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "application/json" } })
}

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const upstream = await fetch(`${BACKEND_URL}/store/support/${params.id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-publishable-api-key": PUBLISHABLE, cookie: req.headers.get("cookie") || "" },
        body: await req.text(),
        credentials: "include",
    })
    const body = await upstream.text()
    return new NextResponse(body, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "application/json" } })
}