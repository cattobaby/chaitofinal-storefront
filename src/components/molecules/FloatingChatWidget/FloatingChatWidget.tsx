"use client"

import { useEffect, useRef, useState } from "react"
import { MessageIcon } from "@/icons"
import { createPortal } from "react-dom"

const API_BASE = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

type Props = {
    token: string | null
}

export const FloatingChatWidget = ({ token }: Props) => {
    const [mounted, setMounted] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    // Chat State
    const [activeThread, setActiveThread] = useState<any | null>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [isChatClosed, setIsChatClosed] = useState(false)

    // Input states
    const [initialMsg, setInitialMsg] = useState("")
    const [replyMsg, setReplyMsg] = useState("")
    const [orderId, setOrderId] = useState("")

    const scrollRef = useRef<HTMLDivElement>(null)

    // Usamos ref solo para el auto-scroll, no para notificaciones
    const lastMsgCountRef = useRef<number>(-1)

    useEffect(() => {
        setMounted(true)
    }, [])

    // --- Auto-scroll effect ---
    useEffect(() => {
        if (isOpen && scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
            }, 100)
        }
    }, [isOpen])

    // --- Polling Logic ---
    const checkActiveThread = async () => {
        try {
            const res = await fetch(`${API_BASE}/store/support?status=open&limit=1`, {
                headers: {
                    "Content-Type": "application/json",
                    "x-publishable-api-key": PK!,
                    "Authorization": token ? `Bearer ${token}` : ""
                },
                credentials: "include"
            })
            const data = await res.json()

            if (data.threads?.[0]) {
                const thread = data.threads[0]
                setActiveThread(thread)
                setIsChatClosed(false)

                if (!activeThread) {
                    loadMessages(thread.id)
                }
            } else {
                if (activeThread) {
                    setIsChatClosed(true)
                } else {
                    setActiveThread(null)
                    setIsChatClosed(false)
                }
            }
        } catch (e) {
            console.error("Error checking threads:", e)
        }
    }

    const loadMessages = async (threadId: string) => {
        try {
            const res = await fetch(`${API_BASE}/store/support/${threadId}/messages`, {
                headers: {
                    "Content-Type": "application/json",
                    "x-publishable-api-key": PK!,
                    "Authorization": token ? `Bearer ${token}` : ""
                },
                credentials: "include"
            })

            if (res.status === 404) {
                setIsChatClosed(true)
                return
            }

            const data = await res.json()
            const newMessages = data.messages || []

            // Actualizamos mensajes y ref
            lastMsgCountRef.current = newMessages.length
            setMessages(newMessages)

            // Auto-scroll logic simple
            if (isOpen && scrollRef.current) {
                const div = scrollRef.current
                const isAtBottom = div.scrollHeight - div.scrollTop <= div.clientHeight + 150
                if (isAtBottom) {
                    setTimeout(() => div.scrollTo({ top: div.scrollHeight, behavior: "smooth" }), 100)
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        checkActiveThread()

        const t = setInterval(() => {
            if (activeThread) {
                loadMessages(activeThread.id)
                checkActiveThread()
            } else {
                checkActiveThread()
            }
        }, 5000)

        return () => clearInterval(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, isOpen, activeThread?.id])

    // --- Handlers ---
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/store/support`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-publishable-api-key": PK!,
                    "Authorization": token ? `Bearer ${token}` : ""
                },
                credentials: "include",
                body: JSON.stringify({ body: initialMsg, order_id: orderId || undefined })
            })
            const data = await res.json()

            if (data.thread) {
                setActiveThread(data.thread)
                setInitialMsg("")
                setOrderId("")
                loadMessages(data.thread.id)
            } else if (data.is_existing) {
                setActiveThread(data.thread)
                loadMessages(data.thread.id)
            }
        } catch(e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault()
        if(!activeThread || !replyMsg.trim()) return
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/store/support/${activeThread.id}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-publishable-api-key": PK!,
                    "Authorization": token ? `Bearer ${token}` : ""
                },
                credentials: "include",
                body: JSON.stringify({ body: replyMsg })
            })

            if (res.ok) {
                setReplyMsg("")
                loadMessages(activeThread.id)
            } else {
                checkActiveThread()
            }
        } catch(e) { console.error(e) }
        finally { setLoading(false) }
    }

    if (!mounted) return null

    const node = (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2 pointer-events-auto font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[350px] h-[500px] bg-white border border-gray-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 mb-2">

                    {/* Header: Purple */}
                    <div className="bg-purple-600 text-white p-4 flex justify-between items-center shadow-sm">
                        <div>
                            <h3 className="font-bold text-sm">
                                {activeThread ? `Ticket #${activeThread.id.slice(-4)}` : "Centro de Ayuda"}
                            </h3>
                            {isChatClosed && <span className="text-[10px] bg-red-500/20 px-1 rounded ml-1">Cerrado</span>}
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">✕</button>
                    </div>

                    <div className="flex-1 bg-gray-50 overflow-y-auto p-4" ref={scrollRef}>
                        {!activeThread ? (
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="text-center mb-6">
                                    <p className="text-sm font-medium text-gray-900">Hola 👋</p>
                                    <p className="text-xs text-gray-500">¿En qué podemos ayudarte hoy?</p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">ID de Pedido</label>
                                    <input
                                        className="w-full p-2.5 mt-1 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                                        placeholder="ej. ord_..."
                                        value={orderId}
                                        onChange={e => setOrderId(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Tu Mensaje</label>
                                    <textarea
                                        className="w-full p-2.5 mt-1 border border-gray-200 rounded-lg text-sm min-h-[100px] focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Describe tu problema..."
                                        required
                                        value={initialMsg}
                                        onChange={e => setInitialMsg(e.target.value)}
                                    />
                                </div>
                                <button disabled={loading} className="w-full bg-purple-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors">
                                    {loading ? "Iniciando..." : "Iniciar Chat"}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-center text-[10px] text-gray-400 my-2">-- Inicio del chat --</p>
                                {messages.map((m) => {
                                    const isMe = m.author_type === 'customer'
                                    return (
                                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                                isMe
                                                    ? 'bg-purple-600 text-white rounded-br-sm'
                                                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                                            }`}>
                                                {m.body}
                                            </div>
                                        </div>
                                    )
                                })}
                                {messages.length === 0 && <p className="text-center text-xs text-gray-400">Solicitud enviada. Esperando respuesta del agente...</p>}

                                {isChatClosed && (
                                    <div className="flex justify-center mt-4">
                                        <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full">
                                            Conversación cerrada por un administrador
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {activeThread && !isChatClosed && (
                        <form onSubmit={handleReply} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                            <input
                                className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-1 focus:ring-purple-100 focus:bg-white transition-all outline-none"
                                placeholder="Escribe un mensaje..."
                                value={replyMsg}
                                onChange={e => setReplyMsg(e.target.value)}
                                disabled={loading}
                            />
                            <button disabled={!replyMsg.trim() || loading} className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100">
                                ➤
                            </button>
                        </form>
                    )}

                    {activeThread && isChatClosed && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                            <p className="text-sm text-gray-600 mb-2">Esta conversación ha sido cerrada.</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-xs text-purple-600 font-medium hover:underline"
                            >
                                Recarga la página para iniciar un nuevo chat
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* FAB Button: Purple (SIN BADGE) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
                {isOpen ? "✕" : <MessageIcon color="white" size={24} />}

                <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {isOpen ? "Cerrar" : "Ayuda"}
                </div>
            </button>
        </div>
    )

    return createPortal(node, document.body)
}