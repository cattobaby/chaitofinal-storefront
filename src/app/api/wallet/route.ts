// storefront/src/app/api/wallet/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(_req: NextRequest) {
    const baseUrl =
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
        process.env.MEDUSA_BACKEND_URL

    if (!baseUrl) {
        return NextResponse.json(
            { message: "MEDUSA_BACKEND_URL / NEXT_PUBLIC_MEDUSA_BACKEND_URL not set" },
            { status: 500 }
        )
    }

    const cookieHeader = cookies().toString()

    const upstream = await fetch(`${baseUrl}/store/wallet`, {
        method: "GET",
        headers: {
            cookie: cookieHeader,
        },
        cache: "no-store",
    })

    const body = await upstream.text()

    return new NextResponse(body, {
        status: upstream.status,
        headers: {
            "Content-Type":
                upstream.headers.get("Content-Type") ?? "application/json",
        },
    })
}
