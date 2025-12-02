"use server"

import { sdk } from "../config"
import medusaError from "@/lib/helpers/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listRegions = async () => {
    const next = {
        ...(await getCacheOptions("regions")),
        revalidate: 3600,
    }

    // ✅ request countries explicitly
    return sdk.client
        .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
            method: "GET",
            query: {
                // include id/name so you can render labels, and expand countries
                fields: "id,name,*countries",
            },
            next,
            cache: "force-cache",
        })
        .then(({ regions }) => {
            console.log("[regions.ts] listRegions → regions:", {
                count: regions?.length ?? 0,
                countriesTotal:
                    regions?.reduce((acc, r) => acc + (r.countries?.length ?? 0), 0) ?? 0,
            })
            return regions
        })
        .catch(medusaError)
}

export const retrieveRegion = async (id: string) => {
    const next = {
        ...(await getCacheOptions(["regions", id].join("-"))),
        revalidate: 3600,
    }

    // ✅ request countries explicitly for single region too
    return sdk.client
        .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
            method: "GET",
            query: {
                fields: "id,name,*countries",
            },
            next,
            cache: "force-cache",
        })
        .then(({ region }) => {
            console.log("[regions.ts] retrieveRegion → region:", {
                id: region?.id,
                countriesCount: region?.countries?.length ?? 0,
            })
            return region
        })
        .catch(medusaError)
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = async (countryCode: string) => {
    try {
        if (regionMap.has(countryCode)) {
            return regionMap.get(countryCode) || null
        }

        const regions = await listRegions()

        if (!regions) {
            console.warn("[regions.ts] getRegion → listRegions returned null/empty")
            return null
        }

        regions.forEach((region) => {
            region.countries?.forEach((c) => {
                if (c?.iso_2) {
                    regionMap.set(c.iso_2, region)
                }
            })
        })

        const region =
            countryCode && regionMap.has(countryCode)
                ? regionMap.get(countryCode)
                : regionMap.get("us") // fallback

        console.log("[regions.ts] getRegion → selected region:", {
            countryCode,
            regionId: region?.id,
            countriesCount: region?.countries?.length ?? 0,
        })

        return region ?? null
    } catch (e: any) {
        console.error("[regions.ts] getRegion → error:", e?.message || e)
        return null
    }
}
