import React from "react"
import { Cash, CreditCard } from "@medusajs/icons"

/**
 * IMPORTANT:
 * - Keys used when rendering the payment picker are MODULE IDs (from /store/payment-providers),
 *   e.g. "stripe-connect", "bnb".
 * - Keys used when rendering existing sessions in a cart can be the "pp_*" internal ids.
 *   We include both so UI labels/icons work in both places.
 */
export const paymentInfoMap: Record<
    string,
    { title: string; icon: React.JSX.Element }
> = {
    // Module IDs (picker)
    "stripe-connect": {
        title: "Credit card",
        icon: <CreditCard />,
    },
    bnb: {
        title: "Banco Nacional de Bolivia (QR)",
        icon: <Cash />,
    },

    // Some projects still expose old provider ids; keep these for display of existing sessions
    "pp_card_stripe-connect": {
        title: "Credit card",
        icon: <CreditCard />,
    },
    pp_stripe_stripe: {
        title: "Credit card",
        icon: <CreditCard />,
    },
    "pp_stripe-ideal_stripe": {
        title: "iDeal",
        icon: <CreditCard />,
    },
    "pp_stripe-bancontact_stripe": {
        title: "Bancontact",
        icon: <CreditCard />,
    },
    pp_paypal_paypal: {
        title: "PayPal",
        icon: <CreditCard />,
    },
    pp_system_default: {
        title: "Manual Payment",
        icon: <Cash />,
    },

    // Internal session id for BNB (display only)
    pp_bnb_bnb: {
        title: "Banco Nacional de Bolivia (QR)",
        icon: <Cash />,
    },
}

/**
 * We consider any Stripe flavor as "Stripe" for card input.
 * Works with both module id ("stripe-connect") and session id ("pp_card_stripe-connect").
 */
export const isStripe = (providerId?: string) => {
    if (!providerId) return false
    return (
        providerId === "stripe-connect" ||
        providerId.startsWith("pp_card_stripe-connect")
    )
}

export const isPaypal = (providerId?: string) => {
    return !!providerId?.startsWith?.("pp_paypal")
}

/**
 * DO NOT treat BNB as "manual". Only the true manual/system provider is manual.
 */
export const isManual = (providerId?: string) => {
    if (!providerId) return false
    return providerId.startsWith("pp_system_default")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
    "krw",
    "jpy",
    "vnd",
    "clp",
    "pyg",
    "xaf",
    "xof",
    "bif",
    "djf",
    "gnf",
    "kmf",
    "mga",
    "rwf",
    "xpf",
    "htg",
    "vuv",
    "xag",
    "xdr",
    "xau",
]
