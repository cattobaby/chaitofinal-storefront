// src/lib/supportClient.ts
const API_BASE = "/api" // ← usamos el proxy local

type Opts = {
    method?: "GET" | "POST"
    body?: unknown
    signal?: AbortSignal
    search?: Record<string, string | number | undefined>
}

export async function supportFetch(path: string, opts: Opts = {}) {
    // path esperado: "/store/support" o "/store/support/:id/messages"
    const url = new URL(`${API_BASE}${path}`, window.location.origin)
    if (opts.search) {
        for (const [k, v] of Object.entries(opts.search)) {
            if (v !== undefined) url.searchParams.set(k, String(v))
        }
    }

    const res = await fetch(url.toString(), {
        method: opts.method || "GET",
        credentials: "include", // necesario para que pase la cookie al proxy (mismo origen)
        headers: {
            "content-type": "application/json",
            // NO ponemos x-publishable-api-key aquí; el proxy ya la agrega
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: opts.signal,
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`HTTP ${res.status} ${res.statusText} – ${text}`)
    }
    return res.json()
}
