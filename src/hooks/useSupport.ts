import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supportFetch } from "../lib/supportClient"

export function useSupportThreads(params: { status?: "open" | "closed"; limit?: number; offset?: number } = {}) {
    const { status = "open", limit = 50, offset = 0 } = params
    return useQuery({
        queryKey: ["support-threads", status, limit, offset],
        queryFn: () =>
            supportFetch("/store/support", {
                search: { status, limit, offset },
            }),
    })
}

export function useCreateThread() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: { order_id?: string; body: string; attachments?: { url: string; name?: string }[] }) =>
            supportFetch("/store/support", {
                method: "POST",
                body: payload,
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["support-threads"] })
        },
    })
}

export function useThreadMessages(threadId?: string) {
    return useQuery({
        enabled: !!threadId,
        queryKey: ["support-thread", threadId, "messages"],
        queryFn: () => supportFetch(`/store/support/${threadId}/messages`),
    })
}

export function useSendMessage(threadId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: { body: string; attachments?: { url: string; name?: string }[] }) =>
            supportFetch(`/store/support/${threadId}/messages`, {
                method: "POST",
                body: payload,
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["support-thread", threadId, "messages"] })
            qc.invalidateQueries({ queryKey: ["support-threads"] })
        },
    })
}
