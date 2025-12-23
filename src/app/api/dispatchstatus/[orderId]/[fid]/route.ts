import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

async function getBearer() {
    const c = await cookies()
    const token = c.get("_medusa_jwt")?.value || ""
    if (!token) return ""
    return token.startsWith("Bearer ") ? token : `Bearer ${token}`
}

function looksLikeUrl(v: unknown) {
    if (typeof v !== "string") return false
    return v.startsWith("http://") || v.startsWith("https://") || v.startsWith("data:")
}

function getByPath(obj: any, path: (string | number)[]) {
    let cur = obj
    for (const p of path) {
        if (cur == null) return undefined
        cur = cur[p as any]
    }
    return cur
}

function pickFirstString(obj: any, paths: (string | number)[][]) {
    for (const path of paths) {
        const v = getByPath(obj, path)
        if (typeof v === "string" && v.trim()) return v
    }
    return null
}

function deepFindString(
    obj: any,
    predicate: (key: string, value: any, path: string) => boolean
) {
    const seen = new Set<any>()
    const stack: Array<{ value: any; path: string }> = [{ value: obj, path: "" }]

    while (stack.length) {
        const { value, path } = stack.pop()!

        if (value && typeof value === "object") {
            if (seen.has(value)) continue
            seen.add(value)

            for (const [k, v] of Object.entries(value)) {
                const p = path ? `${path}.${k}` : k

                if (predicate(k, v, p)) {
                    if (typeof v === "string" && v.trim()) return v
                    if (typeof v === "number") return String(v)
                }

                if (v && typeof v === "object") {
                    stack.push({ value: v, path: p })
                }
            }
        }
    }
    return null
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
    const auth = await getBearer()

    const url = new URL(
        `${backend}/store/orders/${orderId}/fulfillments/${fid}/dispatch`
    )
    url.searchParams.set("_ts", Date.now().toString())

    const resp = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Accept: "application/json",
            ...(pubKey ? { "x-publishable-api-key": pubKey } : {}),
            ...(auth ? { authorization: auth } : {}),
        },
        cache: "no-store",
    })

    const json = await resp.json().catch(() => ({}))
    const dispatch = json?.dispatch ?? null
    const status = dispatch?.status ?? null

    // 1) intentos “conocidos”
    const directQrUrl =
        pickFirstString(dispatch, [
            ["qr", "url"],
            ["delivery_qr", "url"],
            ["qr_url"],
            ["qrUrl"],
        ]) ?? null

    const directQrToken =
        pickFirstString(dispatch, [
            ["qr", "token"],
            ["delivery_qr", "token"],
            ["qr_token"],
            ["qrToken"],
        ]) ?? null

    // 2) beacon (muy probable)
    const beaconQrUrl =
        pickFirstString(dispatch, [
            ["beacon", "qr", "url"],
            ["beacon", "qr_url"],
            ["beacon", "qrUrl"],
            // a veces el beacon trae un link público que sirve como payload del QR
            ["beacon", "public_url"],
            ["beacon", "publicUrl"],
            ["beacon", "url"],
        ]) ?? null

    const beaconQrToken =
        pickFirstString(dispatch, [
            ["beacon", "qr", "token"],
            ["beacon", "token"],
            ["beacon", "otp"],
            ["beacon", "code"],
            ["beacon", "pin"],
            ["beacon", "verification_code"],
        ]) ?? null

    // 3) deep scan (por si viene con otro nombre)
    const scanQrUrl =
        deepFindString(dispatch, (k, v) => {
            const kk = k.toLowerCase()
            return kk.includes("qr") && looksLikeUrl(v)
        }) ?? null

    const scanToken =
        deepFindString(dispatch, (k, v) => {
            const kk = k.toLowerCase()
            return (
                (kk.includes("token") ||
                    kk.includes("otp") ||
                    kk.includes("pin") ||
                    (kk.includes("code") && kk !== "country_code")) &&
                (typeof v === "string" || typeof v === "number")
            )
        }) ?? null

    const qrUrl = directQrUrl || beaconQrUrl || scanQrUrl
    const qrToken = directQrToken || beaconQrToken || scanToken

    // qrValue: lo que le mostrarías al repartidor si solo puedes mostrar “una cosa”
    const qrValue = qrToken || qrUrl || null

    return NextResponse.json(
        {
            status,
            qrUrl,
            qrToken,
            qrValue,
            dispatch,
            // debug liviano (no rompe prod)
            dispatchKeys: dispatch ? Object.keys(dispatch) : [],
            beaconKeys: dispatch?.beacon ? Object.keys(dispatch.beacon) : [],
        },
        { status: resp.status, headers: { "Cache-Control": "no-store" } }
    )
}
