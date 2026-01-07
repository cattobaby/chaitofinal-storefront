import { HttpTypes } from "@medusajs/types"

/**
 * Helper to find the correct unit price for a Cart Item based on the
 * selected display currency (e.g., USDT), ignoring the Cart's base currency (BOB).
 */
export const getCartItemPriceAmount = (
    item: HttpTypes.StoreCartLineItem,
    currencyCode: string
): number => {
    // 1. Normalize currency
    const targetCurrency = (currencyCode || "bob").toLowerCase()

    // 2. Access the variant prices (The "Truth" from DB)
    // Cast to 'any' because strict StoreProductVariant type might hide 'prices' depending on Medusa version
    const variant = item.variant as any
    const prices = variant?.prices || []

    // 3. Find the exact price match
    const match = prices.find(
        (p: any) => p.currency_code?.toLowerCase() === targetCurrency
    )

    if (match) {
        // Return the raw amount (e.g., 100 for USDT)
        return Number(match.amount)
    }

    // 4. Fallback: If we specifically want BOB, return the item's stored unit_price
    // (This handles cases where prices array might be empty but Medusa calculated a price)
    if (targetCurrency === "bob") {
        return item.unit_price
    }

    // 5. If no price found for this currency, return 0 (or handle as error)
    return 0
}