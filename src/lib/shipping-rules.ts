// storefront/src/lib/shipping-rules.ts
import type { HttpTypes } from "@medusajs/types"

/**
 * Shipping option with optional rules, as returned from the store API.
 */
export type PricingShippingOptionWithRules =
    HttpTypes.StoreCartShippingOption & {
    rules?: unknown
}

/**
 * Check if a shipping option has the rule:
 *   attribute = "distance_pricing"
 *   value     = "true"
 */
export const isDistancePricingOption = (
    option: PricingShippingOptionWithRules
): boolean => {
    const rules = option.rules

    if (!Array.isArray(rules)) {
        return false
    }

    return rules.some((r) => {
        if (!r || typeof r !== "object") {
            return false
        }

        const { attribute, value } = r as {
            attribute?: string
            value?: string
        }

        return attribute === "distance_pricing" && value === "true"
    })
}
