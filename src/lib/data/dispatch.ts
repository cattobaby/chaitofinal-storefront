export async function fetchStoreDispatch(orderId: string, fulfillmentId: string) {
    const res = await fetch(
        `/api/dispatch/${orderId}/${fulfillmentId}?_ts=${Date.now()}`,
        {
            method: "GET",
            cache: "no-store",
            credentials: "include",
            headers: { Accept: "application/json" },
        }
    )

    const text = await res.text().catch(() => "")
    if (!res.ok) {
        throw new Error(text || `Dispatch fetch failed (${res.status})`)
    }

    try {
        return JSON.parse(text)
    } catch {
        return {}
    }
}

export async function fetchStoreDispatchStatus(orderId: string, fulfillmentId: string) {
    const res = await fetch(
        `/api/dispatchstatus/${orderId}/${fulfillmentId}?_ts=${Date.now()}`,
        {
            method: "GET",
            cache: "no-store",
            credentials: "include",
            headers: { Accept: "application/json" },
        }
    )

    const text = await res.text().catch(() => "")
    if (!res.ok) {
        throw new Error(text || `Dispatch status fetch failed (${res.status})`)
    }

    try {
        return JSON.parse(text)
    } catch {
        return {}
    }
}
