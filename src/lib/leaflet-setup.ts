// Carga segura de Leaflet solo en cliente (evita "window is not defined" en SSR)

import type * as LeafletNS from "leaflet"

let LCache: typeof LeafletNS | null = null

export async function loadLeaflet(): Promise<typeof LeafletNS | null> {
    if (typeof window === "undefined") return null
    if (!LCache) {
        const mod = await import("leaflet")
        LCache = (mod.default ?? mod) as unknown as typeof LeafletNS
    }
    return LCache
}

export async function getLocationMarkerIcon() {
    const L = await loadLeaflet()
    if (!L) return null
    return L.divIcon({
        className: "location-marker-icon",
        iconSize: [24, 34],
        iconAnchor: [12, 34],
    })
}
