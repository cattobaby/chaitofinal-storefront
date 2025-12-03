"use client"

import { Input } from "@/components/atoms"
import { SearchIcon } from "@/icons"
import { useSearchParams, useRouter } from "next/navigation" // Changed redirect to useRouter
import { useState } from "react"

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
      <div className="relative w-full">
        <Input
          icon={<SearchIcon className="text-brand-700" />} // Purple icon inside the input
          placeholder="Buscar en Chaito..." // Localized placeholder
          value={search}
          changeValue={setSearch}
          // Force white background and dark text for the input itself
          className="w-full bg-white text-neutral-900 placeholder:text-neutral-400 border-none rounded-full py-2.5 shadow-sm"
        />
      </div>
      <input type="submit" className="hidden" />
    </form>
  )
}