"use client"

import { MessageIcon } from "@/icons"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const NOTIFICATION_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"

type Props = {
    token: string | null
}

export const FloatingMessageButton = ({ token }: Props) => {
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    // Chat Logic State
    const [activeThread, setActiveThread] = useState<any | null>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // ✨ RESTORED: Estado para saber si el chat fue cerrado
    const [isChatClosed, setIsChatClosed] = useState(false)

    // Notification State
    const [hasUnread, setHasUnread] = useState(false)
    const lastMsgCountRef = useRef<number>(-1)

    // Input State
    const [initialMsg, setInitialMsg] = useState("")
    const [replyMsg, setReplyMsg] = useState("")
    const [orderId, setOrderId] = useState("")

    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    // --- Sound Logic ---
    const playNotificationSound = () => {
        try {
            const audio = new Audio(NOTIFICATION_SOUND)
            audio.volume = 0.5
            audio.play().catch(e => console.warn("Audio autoplay blocked:", e))
        } catch (e) {
            console.error("Error playing sound", e)
        }
    }

    // --- Toggle Logic ---
    const handleToggle = () => {
        if (!isOpen) {
            setHasUnread(false)
        }
        setIsOpen(!isOpen)
    }

    // --- Auto-scroll ---
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
                // CASO 1: Hay un thread abierto
                const thread = data.threads[0]
                setActiveThread(thread)
                setIsChatClosed(false) // Aseguramos que no esté marcado como cerrado

                if (!activeThread) {
                    loadMessages(thread.id)
                }
            } else {
                // CASO 2: La API dice que NO hay threads abiertos
                if (activeThread) {
                    // ✨ Si YA teníamos uno cargado, significa que el admin lo acaba de cerrar
                    setIsChatClosed(true)
                } else {
                    // Si no teníamos nada, es un estado limpio
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

            // ✨ Si al intentar cargar mensajes da 404, es que el thread fue borrado/cerrado
            if (res.status === 404) {
                setIsChatClosed(true)
                return
            }

            const data = await res.json()
            const newMessages = data.messages || []

            // Check for new messages
            if (lastMsgCountRef.current !== -1 && newMessages.length > lastMsgCountRef.current) {
                const lastMsg = newMessages[newMessages.length - 1]

                if (lastMsg.author_type !== 'customer') {
                    const isHidden = document.hidden
                    if (!isOpen || isHidden) {
                        playNotificationSound()
                        if (!isOpen) setHasUnread(true)
                    }
                }
            }

            lastMsgCountRef.current = newMessages.length
            setMessages(newMessages)

            if (isOpen && scrollRef.current) {
                const div = scrollRef.current
                const isAtBottom = div.scrollHeight - div.scrollTop <= div.clientHeight + 150
                if (isAtBottom) {
                    setTimeout(() => div.scrollTo({ top: div.scrollHeight, behavior: "smooth" }), 100)
                }
            }
        } catch (e) {
            console.error("Error loading messages:", e)
        }
    }

    // --- Restart Logic ---
    const handleRestart = () => {
        // Limpiamos todo para mostrar el formulario de creación de nuevo
        setActiveThread(null)
        setIsChatClosed(false)
        setMessages([])
        setInitialMsg("")
        setOrderId("")
    }

    useEffect(() => {
        checkActiveThread()

        const t = setInterval(() => {
            if (activeThread) {
                // Si está cerrado, solo verificamos estado (por si lo reabren), no cargamos mensajes inútilmente
                if (!isChatClosed) loadMessages(activeThread.id)
                checkActiveThread()
            } else {
                checkActiveThread()
            }
        }, 5000)

        return () => clearInterval(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, isOpen, activeThread?.id, isChatClosed])


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
                loadMessages(data.thread.id)
                setInitialMsg("")
                setOrderId("")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeThread || !replyMsg.trim()) return
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
                // Si falla, probablemente se cerró
                checkActiveThread()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) return null

    const node = (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2 pointer-events-auto font-sans">

            {/* Chat Window */}
            {isOpen && (
                <div className="w-[350px] h-[500px] bg-white border border-gray-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 mb-2">

                    {/* Header (Green) */}
                    <div className="bg-green-700 text-white p-4 flex justify-between items-center shadow-sm">
                        <div>
                            <h3 className="font-bold text-sm">
                                {activeThread ? "Soporte Activo" : "Centro de Ayuda"}
                            </h3>
                            {activeThread && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-green-100">
                                        Ticket #{activeThread.id.slice(-4)}
                                    </span>
                                    {/* ✨ Badge de Cerrado en Header */}
                                    {isChatClosed && (
                                        <span className="text-[10px] bg-red-500/20 px-1.5 py-0.5 rounded text-white font-medium border border-white/20">
                                            Cerrado
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">✕</button>
                    </div>

                    <div className="flex-1 bg-gray-50 overflow-y-auto p-4" ref={scrollRef}>
                        {!activeThread ? (
                            /* --- Formulario de Creación --- */
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="text-center mb-6">
                                    <p className="text-sm font-medium text-gray-900">Hola 👋</p>
                                    <p className="text-xs text-gray-500">¿En qué podemos ayudarte hoy?</p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">ID de Pedido (Opcional)</label>
                                    <input
                                        className="w-full p-2.5 mt-1 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-700 focus:border-transparent outline-none transition-all"
                                        placeholder="ej. ord_..."
                                        value={orderId}
                                        onChange={e => setOrderId(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Tu Mensaje</label>
                                    <textarea
                                        className="w-full p-2.5 mt-1 border border-gray-200 rounded-lg text-sm min-h-[100px] focus:ring-2 focus:ring-green-700 focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Describe tu problema..."
                                        required
                                        value={initialMsg}
                                        onChange={e => setInitialMsg(e.target.value)}
                                    />
                                </div>
                                <button disabled={loading || !initialMsg.trim()} className="w-full bg-green-700 text-white py-3 rounded-lg text-sm font-bold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                    {loading ? "Iniciando..." : "Iniciar Chat"}
                                </button>
                            </form>
                        ) : (
                            /* --- Lista de Mensajes --- */
                            <div className="space-y-3">
                                <p className="text-center text-[10px] text-gray-400 my-2">-- Inicio del chat --</p>
                                {messages.map((m) => {
                                    const isMe = m.author_type === 'customer'
                                    return (
                                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                                isMe
                                                    ? 'bg-green-700 text-white rounded-br-sm'
                                                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                                            }`}>
                                                {m.body}
                                            </div>
                                        </div>
                                    )
                                })}
                                {messages.length === 0 && (
                                    <div className="flex h-full items-center justify-center">
                                        <p className="text-xs text-gray-400">Esperando respuesta del agente...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* --- Footer: Input O Botón de Reinicio --- */}
                    {activeThread && !isChatClosed && (
                        <form onSubmit={handleReply} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                            <input
                                className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-1 focus:ring-green-100 focus:bg-white transition-all outline-none"
                                placeholder="Escribe un mensaje..."
                                value={replyMsg}
                                onChange={e => setReplyMsg(e.target.value)}
                                disabled={loading}
                            />
                            <button disabled={!replyMsg.trim() || loading} className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100">
                                ➤
                            </button>
                        </form>
                    )}

                    {/* ✨ RESTORED: UI de Ticket Cerrado */}
                    {activeThread && isChatClosed && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center animate-in slide-in-from-bottom-2">
                            <p className="text-sm text-gray-600 mb-3 font-medium">Esta conversación ha sido cerrada.</p>
                            <button
                                onClick={handleRestart}
                                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                            >
                                Iniciar nueva consulta
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* FAB Button (Green) */}
            <button
                onClick={handleToggle}
                className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-green-700 shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Abrir chat de soporte"
            >
                {isOpen ? (
                    <span className="text-white text-xl font-bold">✕</span>
                ) : (
                    <>
                        <MessageIcon color="white" size={24} />
                    </>
                )}

                {/* Badge Logic */}
                {!isOpen && hasUnread && (
                    <span className="absolute top-0 right-0 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                    </span>
                )}
            </button>
        </div>
    )

    return createPortal(node, document.body)
}