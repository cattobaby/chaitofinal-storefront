// path: storefront/src/components/sections/UserMessagesSection/UserMessagesSection.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"

// ---------- Config de API (evita /bo/ + 404) ----------
const API_BASE =
    process.env.NEXT_PUBLIC_STORE_API ??
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ??
    "http://localhost:9000"
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

// ---- Tipos que reflejan el backend ----
type SupportThread = {
    id: string
    order_id?: string | null
    customer_id?: string | null
    courier_id?: string | null
    seller_id?: string | null
    status: "open" | "closed"
    last_message_at?: string | null
    metadata?: Record<string, unknown> | null
}

type SupportMessage = {
    id: string
    thread_id: string
    author_type: "admin" | "customer" | "courier" | "seller"
    author_id: string | null
    body: string
    attachments?: Array<{ url: string; name?: string }> | null
    created_at?: string
}

function formatDate(iso?: string | null) {
    if (!iso) return ""
    try {
        return new Date(iso).toLocaleString()
    } catch {
        return String(iso)
    }
}

// ✅ Accept token as prop
export const UserMessagesSection = ({ token }: { token: string | null }) => {

    // ---- Helper fetch (CORS + cookies + PK + Bearer Token) ----
    async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
        const res = await fetch(`${API_BASE}${path}`, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(PK ? { "x-publishable-api-key": PK } : {}),
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                ...(init?.headers || {}),
            },
            ...init,
        })
        if (!res.ok) {
            let msg = `Error ${res.status}`
            try {
                const data = await res.json()
                msg = (data as any)?.message || msg
            } catch {
                // noop
            }
            throw new Error(msg)
        }
        return res.json() as Promise<T>
    }

    // Estado básico
    const [threads, setThreads] = useState<SupportThread[]>([])
    const [threadsCount, setThreadsCount] = useState(0)
    const [loadingThreads, setLoadingThreads] = useState(true)
    const [threadsErr, setThreadsErr] = useState<string | null>(null)

    const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

    const [messages, setMessages] = useState<SupportMessage[]>([])
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [msgsErr, setMsgsErr] = useState<string | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)

    // Cargar hilos del cliente (ONLY CLOSED)
    const loadThreads = async () => {
        if (!token) return

        setLoadingThreads(true)
        setThreadsErr(null)
        try {
            // ✅ Only fetch closed threads for history
            const data = await fetchJSON<{ threads: SupportThread[]; count: number }>(
                `/store/support?status=closed&limit=50&offset=0`
            )
            setThreads(data.threads || [])
            setThreadsCount(data.count || 0)
            if (!selectedId && data.threads?.[0]?.id) {
                setSelectedId(data.threads[0].id)
            }
        } catch (e: any) {
            setThreadsErr(e?.message || "No se pudieron cargar las conversaciones pasadas")
        } finally {
            setLoadingThreads(false)
        }
    }

    useEffect(() => {
        loadThreads()
        // No polling needed for closed history
    }, [token])

    const loadMessages = async (id: string) => {
        if (!id || !token) return
        setLoadingMsgs(true)
        setMsgsErr(null)
        try {
            const data = await fetchJSON<{ thread_id: string; messages: SupportMessage[] }>(
                `/store/support/${id}/messages`
            )
            setMessages(data.messages || [])
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
            }, 0)
        } catch (e: any) {
            setMsgsErr(e?.message || "No se pudieron cargar los mensajes")
        } finally {
            setLoadingMsgs(false)
        }
    }

    useEffect(() => {
        if (!selectedId) return
        loadMessages(selectedId)
    }, [selectedId, token])

    const selectedThread = useMemo(
        () => threads.find((t) => t.id === selectedId),
        [threads, selectedId]
    )

    const who = (m: SupportMessage) => {
        switch (m.author_type) {
            case "customer":
                return "Tú"
            case "admin":
                return "Soporte"
            case "courier":
                return "Repartidor"
            case "seller":
                return "Vendedor"
            default:
                return "Desconocido"
        }
    }

    return (
        <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight">Historial de Mensajes</h2>
            <p className="text-sm text-neutral-500 mb-4">Aquí puedes ver tus conversaciones pasadas. Para nuevas consultas, usa el chat en la esquina inferior.</p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
                {/* Lista de conversaciones */}
                <div className="rounded border p-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">Conversaciones Cerradas</h3>
                        <span className="text-sm text-neutral-500">{threadsCount}</span>
                    </div>

                    <div className="mt-3">
                        {loadingThreads ? (
                            <div className="text-sm text-neutral-500">Cargando…</div>
                        ) : threadsErr ? (
                            <div className="text-sm text-red-600">{threadsErr}</div>
                        ) : threads.length ? (
                            <ul className="space-y-2">
                                {threads.map((t) => (
                                    <li key={t.id}>
                                        <button
                                            className={`w-full rounded px-3 py-2 text-left transition ${
                                                selectedId === t.id ? "bg-neutral-100" : "hover:bg-neutral-50"
                                            }`}
                                            onClick={() => setSelectedId(t.id)}
                                        >
                                            <div className="text-sm font-medium">#{t.id}</div>
                                            <div className="text-xs text-neutral-500">
                                                {t.order_id
                                                    ? `Pedido: ${t.order_id}`
                                                    : t.courier_id
                                                        ? `Repartidor: ${t.courier_id}`
                                                        : t.seller_id
                                                            ? `Vendedor: ${t.seller_id}`
                                                            : "General"}
                                            </div>
                                            <div className="text-xs text-neutral-400">
                                                {t.last_message_at ? `Último: ${formatDate(t.last_message_at)}` : ""}
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-sm text-neutral-500">No tienes conversaciones cerradas.</div>
                        )}
                    </div>
                </div>

                {/* Conversación seleccionada (READ ONLY) */}
                <div className="flex h-[70vh] flex-col rounded border bg-neutral-50">
                    <div className="border-b px-4 py-3 bg-white">
                        {selectedThread ? (
                            <>
                                <div className="text-sm font-medium">Conversación #{selectedThread.id}</div>
                                <div className="text-xs text-neutral-500">Estado: Cerrado</div>
                            </>
                        ) : (
                            <div className="text-sm text-neutral-500">Selecciona una conversación</div>
                        )}
                    </div>

                    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                        {!selectedId ? (
                            <div className="text-sm text-neutral-500">No hay conversación seleccionada.</div>
                        ) : loadingMsgs ? (
                            <div className="text-sm text-neutral-500">Cargando historial…</div>
                        ) : msgsErr ? (
                            <div className="text-sm text-red-600">{msgsErr}</div>
                        ) : messages.length ? (
                            messages.map((m) => (
                                <div key={m.id} className="rounded border px-3 py-2 bg-white">
                                    <div className="text-xs text-neutral-500">
                                        {who(m)} {m.author_id ? `(${m.author_id})` : ""} • {formatDate(m.created_at)}
                                    </div>
                                    <div className="mt-1 whitespace-pre-wrap text-sm">{m.body}</div>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-neutral-500">No hay mensajes.</div>
                        )}
                    </div>

                    <div className="p-3 border-t bg-gray-100 text-center text-xs text-gray-500">
                        Esta conversación está cerrada. No se pueden enviar más mensajes.
                    </div>
                </div>
            </div>
        </div>
    )
}