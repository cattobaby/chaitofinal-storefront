// /home/willman/WebstormProjects/new/new/storefront/src/components/molecules/CurrencySelector/CurrencySelector.tsx
"use client"

import {
    Listbox,
    ListboxButton,
    ListboxOption,
    ListboxOptions,
    Transition,
} from "@headlessui/react"
import { Fragment, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Label } from "@medusajs/ui"
import { ArrowDownIcon } from "@/icons"

type CurrencyOption = {
    code: string
    label?: string
}

type CurrencySelectorProps = {
    initialCurrency?: string
    options?: CurrencyOption[]
    cookieName?: string
}

const DEFAULT_COOKIE = "chaito_currency"

function setCookie(name: string, value: string) {
    const maxAge = 60 * 60 * 24 * 365
    document.cookie = `${name}=${encodeURIComponent(
        value
    )}; path=/; max-age=${maxAge}; samesite=lax`
}

export default function CurrencySelector({
                                             initialCurrency,
                                             options,
                                             cookieName = DEFAULT_COOKIE,
                                         }: CurrencySelectorProps) {
    const router = useRouter()

    const opts = useMemo<CurrencyOption[]>(() => {
        return (
            options ?? [
                { code: "BOB", label: "Bolivianos" },
                { code: "USDT", label: "Tether" },
            ]
        )
    }, [options])

    const [current, setCurrent] = useState<CurrencyOption | undefined>(undefined)

    useEffect(() => {
        const normalized = (initialCurrency || "").toUpperCase()
        const found = opts.find((o) => o.code.toUpperCase() === normalized)
        setCurrent(found ?? opts[0])
    }, [initialCurrency, opts])

    const handleChange = async (next: CurrencyOption) => {
        const nextCode = next.code.toUpperCase()
        setCurrent(next)

        // ✅ Always set client cookie immediately
        setCookie(cookieName, nextCode)

        // ✅ Optional: also set via API route (future-proof)
        try {
            await fetch("/api/currency", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ currency: nextCode }),
            })
        } catch {
            // ignore
        }

        window.dispatchEvent(
            new CustomEvent("currency:change", { detail: nextCode })
        )

        router.refresh()
    }

    return (
        <div className="md:flex gap-2 items-center justify-end relative z-50">
            <Label className="label-md hidden md:block text-white/90">Moneda</Label>

            <Listbox value={current} onChange={handleChange}>
                <ListboxButton className="relative flex items-center gap-2 h-10 text-white hover:bg-brand-800 px-3 py-1 rounded-full transition-colors cursor-pointer focus:outline-none border-none">
          <span className="text-sm font-bold uppercase">
            {current?.code ?? "—"}
          </span>
                    <ArrowDownIcon color="white" size={14} />
                </ListboxButton>

                <div className="flex relative w-16">
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <ListboxOptions className="absolute right-0 z-[999] mt-2 w-[220px] overflow-auto bg-white text-neutral-900 rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none max-h-[400px] py-1">
                            {opts.map((o) => (
                                <ListboxOption
                                    key={o.code}
                                    value={o}
                                    className={({ active }) =>
                                        `cursor-pointer select-none relative py-3 px-4 flex items-center justify-between transition-colors border-b border-neutral-100 last:border-0 ${
                                            active ? "bg-brand-50 text-brand-900" : "text-neutral-900"
                                        }`
                                    }
                                >
                                    <span className="text-sm font-medium">{o.label ?? o.code}</span>
                                    <span className="text-[10px] text-neutral-500 uppercase">
                    {o.code}
                  </span>
                                </ListboxOption>
                            ))}
                        </ListboxOptions>
                    </Transition>
                </div>
            </Listbox>
        </div>
    )
}
