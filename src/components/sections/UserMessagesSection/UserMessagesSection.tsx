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
    // Defined inside component to access 'token' prop
    async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
        const res = await fetch(`${API_BASE}${path}`, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(PK ? { "x-publishable-api-key": PK } : {}),
                // ✅ Inject Token if available
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

    const [draft, setDraft] = useState("")
    const [sending, setSending] = useState(false)
    const [sendErr, setSendErr] = useState<string | null>(null)

    // Crear hilo
    const [creating, setCreating] = useState(false)
    const [createErr, setCreateErr] = useState<string | null>(null)
    const [orderId, setOrderId] = useState<string>("")
    const [firstMsg, setFirstMsg] = useState<string>("")

    const scrollRef = useRef<HTMLDivElement>(null)

    // Cargar hilos del cliente
    const loadThreads = async () => {
        // If we don't have a token yet (hydration), wait or fail gracefully
        if (!token) return

        setLoadingThreads(true)
        setThreadsErr(null)
        try {
            const data = await fetchJSON<{ threads: SupportThread[]; count: number }>(
                `/store/support?status=open&limit=50&offset=0`
            )
            setThreads(data.threads || [])
            setThreadsCount(data.count || 0)
            if (!selectedId && data.threads?.[0]?.id) {
                setSelectedId(data.threads[0].id)
            }
        } catch (e: any) {
            setThreadsErr(e?.message || "No se pudieron cargar las conversaciones")
        } finally {
            setLoadingThreads(false)
        }
    }

    useEffect(() => {
        loadThreads()
        const t = setInterval(loadThreads, 5000)
        return () => clearInterval(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]) // ✅ React to token availability

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
        const t = setInterval(() => loadMessages(selectedId), 3000)
        return () => clearInterval(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, token])

    const sendMessage = async () => {
        if (!selectedId || !draft.trim() || !token) return
        setSending(true)
        setSendErr(null)
        try {
            await fetchJSON<{ message: SupportMessage }>(`/store/support/${selectedId}/messages`, {
                method: "POST",
                body: JSON.stringify({ body: draft.trim() }),
            })
            setDraft("")
            loadMessages(selectedId)
            loadThreads()
        } catch (e: any) {
            setSendErr(e?.message || "No se pudo enviar el mensaje")
        } finally {
            setSending(false)
        }
    }

    const createThread = async () => {
        if (!firstMsg.trim()) {
            setCreateErr("Escribe el primer mensaje.")
            return
        }
        if (!token) {
            setCreateErr("No estás autenticado.")
            return
        }
        setCreating(true)
        setCreateErr(null)
        try {
            const payload: any = {
                order_id: orderId || undefined,
                body: firstMsg.trim(),
            }
            const data = await fetchJSON<{ thread: SupportThread }>(`/store/support`, {
                method: "POST",
                body: JSON.stringify(payload),
            })
            setOrderId("")
            setFirstMsg("")
            setSelectedId(data.thread.id)
            loadThreads()
            loadMessages(data.thread.id)
        } catch (e: any) {
            setCreateErr(e?.message || "No se pudo crear la conversación")
        } finally {
            setCreating(false)
        }
    }

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
            <h2 className="text-2xl font-semibold tracking-tight">Mensajes</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
                {/* Lista de conversaciones */}
                <div className="rounded border p-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">Tus conversaciones</h3>
                        <span className="text-sm text-neutral-500">{threadsCount} abiertas</span>
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
                            <div className="text-sm text-neutral-500">Aún no tienes conversaciones.</div>
                        )}
                    </div>

                    {/* Crear nuevo chat */}
                    <div className="mt-4 border-t pt-3">
                        <h4 className="text-sm font-medium">Iniciar nueva conversación</h4>
                        <div className="mt-2 space-y-2">
                            <input
                                className="w-full rounded border px-3 py-2 text-sm"
                                placeholder="ID de pedido (opcional)"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                            />
                            <textarea
                                className="w-full rounded border px-3 py-2 text-sm"
                                placeholder="Escribe tu mensaje…"
                                value={firstMsg}
                                onChange={(e) => setFirstMsg(e.target.value)}
                                rows={3}
                            />
                            {createErr && <div className="text-xs text-red-600">{createErr}</div>}
                            <button
                                className="w-full rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                                disabled={creating || !firstMsg.trim()}
                                onClick={createThread}
                            >
                                {creating ? "Creando…" : "Crear conversación"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Conversación seleccionada */}
                <div className="flex h-[70vh] flex-col rounded border">
                    <div className="border-b px-4 py-3">
                        {selectedThread ? (
                            <>
                                <div className="text-sm font-medium">Conversación #{selectedThread.id}</div>
                                <div className="text-xs text-neutral-500">
                                    {selectedThread.order_id ? `Pedido: ${selectedThread.order_id}` : "Soporte general"}
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-neutral-500">Selecciona una conversación</div>
                        )}
                    </div>

                    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                        {!selectedId ? (
                            <div className="text-sm text-neutral-500">No hay conversación seleccionada.</div>
                        ) : loadingMsgs ? (
                            <div className="text-sm text-neutral-500">Cargando mensajes…</div>
                        ) : msgsErr ? (
                            <div className="text-sm text-red-600">{msgsErr}</div>
                        ) : messages.length ? (
                            messages.map((m) => (
                                <div key={m.id} className="rounded border px-3 py-2">
                                    <div className="text-xs text-neutral-500">
                                        {who(m)} {m.author_id ? `(${m.author_id})` : ""} • {formatDate(m.created_at)}
                                    </div>
                                    <div className="mt-1 whitespace-pre-wrap text-sm">{m.body}</div>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-neutral-500">Aún no hay mensajes.</div>
                        )}
                    </div>

                    {/* Envío de mensaje */}
                    <form
                        className="flex items-center gap-2 border-t p-3"
                        onSubmit={(e) => {
                            e.preventDefault()
                            sendMessage()
                        }}
                    >
                        <input
                            className="flex-1 rounded border px-3 py-2 text-sm"
                            placeholder={selectedId ? "Escribe un mensaje…" : "Selecciona una conversación…"}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            disabled={!selectedId || sending}
                        />
                        <button
                            type="submit"
                            className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                            disabled={!selectedId || sending || !draft.trim()}
                        >
                            {sending ? "Enviando…" : "Enviar"}
                        </button>
                        {sendErr && <div className="ml-2 text-xs text-red-600">{sendErr}</div>}
                    </form>
                </div>
            </div>
        </div>
    )
}