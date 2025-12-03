"use client"

import { Input } from "@/components/atoms"
import { SearchIcon } from "@/icons"
import { useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"
import { VisualSearch } from "../VisualSearch/VisualSearch" // Import the component

export const NavbarSearch = () => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [search, setSearch] = useState(searchParams.get("query") || "")

    const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (search) {
            router.push(`/categories?query=${search}`)
        } else {
            router.push(`/categories`)
        }
    }

    return (
        <form className="w-full max-w-[600px] relative" method="POST" onSubmit={submitHandler}>
            <div className="relative w-full flex items-center">
                <Input
                    icon={<SearchIcon className="text-brand-700" />}
                    placeholder="Buscar en Chaito..."
                    value={search}
                    changeValue={setSearch}
                    // Add padding-right (pr-10) to make room for the camera button
                    className="w-full bg-white text-neutral-900 placeholder:text-neutral-400 border-none rounded-full py-2.5 shadow-sm pr-12"
                />

                {/* Position the VisualSearch button absolutely on the right */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <VisualSearch />
                </div>
            </div>
            <input type="submit" className="hidden" />
        </form>
    )
}