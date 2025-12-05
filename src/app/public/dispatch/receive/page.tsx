"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") || "http://localhost:9000"

type State =
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok" }
    | { kind: "error"; message: string }

export default function PublicDispatchReceivePage() {
    const sp = useSearchParams()
    const [state, setState] = useState<State>({ kind: "idle" })

    const params = useMemo(() => {
        const o = sp.get("o") || ""
        const f = sp.get("f") || ""
        const t = sp.get("t") || ""
        return { o, f, t }
    }, [sp])

    useEffect(() => {
        if (!params.o || !params.f || !params.t) {
            setState({ kind: "error", message: "Enlace inválido. Faltan parámetros." })
            return
        }

        let aborted = false

        ;(async () => {
            setState({ kind: "loading" })
            try {
                const url = `${BACKEND_URL}/public/dispatch/receive?o=${encodeURIComponent(
                    params.o
                )}&f=${encodeURIComponent(params.f)}&t=${encodeURIComponent(params.t)}`
                const res = await fetch(url, { method: "GET", credentials: "include" })
                if (!res.ok) {
                    const text = await res.text().catch(() => "")
                    throw new Error(text || res.statusText)
                }
                if (!aborted) setState({ kind: "ok" })
            } catch (e) {
                if (!aborted) {
                    const msg = e instanceof Error ? e.message : "No se pudo confirmar la entrega."
                    setState({ kind: "error", message: msg })
                }
            }
        })()

        return () => {
            aborted = true
        }
    }, [params.o, params.f, params.t])

    return (
        <main className="container max-w-lg mx-auto py-10 px-4">
            {state.kind === "loading" && (
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold">Confirmando entrega…</h1>
                    <p className="text-sm text-neutral-500">
                        Un momento por favor.
                    </p>
                </div>
            )}

            {state.kind === "ok" && (
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold">¡Gracias!</h1>
                    <p className="text-sm text-neutral-600">
                        La recepción del paquete fue confirmada correctamente.
                    </p>
                </div>
            )}

            {state.kind === "error" && (
                <div className="text-center space-y-3">
                    <h1 className="text-2xl font-semibold">No se pudo confirmar</h1>
                    <p className="text-sm text-red-600">{state.message}</p>
                    <p className="text-xs text-neutral-500">
                        Si crees que esto es un error, reintenta desde el enlace del correo o
                        contacta a soporte.
                    </p>
                </div>
            )}
        </main>
    )
}
