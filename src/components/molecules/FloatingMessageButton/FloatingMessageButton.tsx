"use client"

import { Badge } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { MessageIcon } from "@/icons"
import { useUnreads } from "@talkjs/react"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"

export const FloatingMessageButton = () => {
    const unreads = useUnreads()
    const pathname = usePathname()

    // Para debugging: NO lo escondas por ruta (lo dejamos siempre visible).
    // Si luego quieres ocultarlo en /user/messages, lo activamos.
    const DEBUG_ALWAYS_SHOW = true

    const count = useMemo(() => unreads?.length ?? 0, [unreads])

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        console.log("[FloatingMessageButton] mounted ✅")
        setMounted(true)

        // logs útiles de layout/capas
        try {
            const body = document.body
            const bodyOverflow = getComputedStyle(body).overflow
            console.log("[FloatingMessageButton] pathname:", pathname)
            console.log("[FloatingMessageButton] document.body exists:", Boolean(body))
            console.log("[FloatingMessageButton] body overflow:", bodyOverflow)
        } catch (e) {
            console.log("[FloatingMessageButton] error reading body styles:", e)
        }

        return () => {
            console.log("[FloatingMessageButton] unmounted ❌")
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        console.log("[FloatingMessageButton] unreads updated:", unreads)
        console.log("[FloatingMessageButton] count:", count)
    }, [unreads, count])

    // Si quieres re-activar el hide en mensajes, cambia DEBUG_ALWAYS_SHOW a false
    if (!DEBUG_ALWAYS_SHOW && pathname?.includes("/user/messages")) {
        console.log("[FloatingMessageButton] hidden because on /user/messages")
        return null
    }

    if (!mounted) {
        console.log("[FloatingMessageButton] waiting for mount (no document yet)")
        return null
    }

    const node = (
        <div
            data-floating-message-button
            className="fixed bottom-6 right-6 z-[9999] group pointer-events-auto"
        >
            {/* Tooltip (hover) */}
            <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                Mensajes
            </div>

            <LocalizedClientLink
                href="/user/messages"
                aria-label="Abrir mensajes"
                className="relative flex h-12 w-12 items-center justify-center rounded-full bg-green-700 shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
                <MessageIcon color="white" size={22} />

                {count > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 border-white border-2 text-white text-[10px]">
                        {count}
                    </Badge>
                )}
            </LocalizedClientLink>
        </div>
    )

    // ✅ Portal: evita que algún wrapper rompa el "fixed"
    const portalTarget = document.body

    // Log extra: confirmar que el nodo existe en DOM
    setTimeout(() => {
        const el = document.querySelector("[data-floating-message-button]")
        console.log(
            "[FloatingMessageButton] DOM query data-floating-message-button:",
            Boolean(el),
            el
        )
    }, 0)

    return createPortal(node, portalTarget)
}
