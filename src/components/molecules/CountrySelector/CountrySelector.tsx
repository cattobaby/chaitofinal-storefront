"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"
import { Fragment, useEffect, useMemo, useState } from "react"
import ReactCountryFlag from "react-country-flag"

import { useParams, usePathname, useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import { updateRegionWithValidation } from "@/lib/data/cart"
import { Label } from "@medusajs/ui"
import { toast } from "@/lib/helpers/toast"
import { ArrowDownIcon } from "@/icons"

type CountryOption = {
  country: string
  region: string
  label: string
}

type CountrySelectProps = {
  regions: HttpTypes.StoreRegion[]
}

const CountrySelect = ({ regions }: CountrySelectProps) => {
  const [current, setCurrent] = useState<
    | { country: string | undefined; region: string; label: string | undefined }
    | undefined
  >(undefined)

  const { locale: countryCode } = useParams()
  const router = useRouter()
  const currentPath = usePathname().split(`/${countryCode}`)[1]

  const options = useMemo(() => {
    const opts =
      regions
        ?.map((r) => {
          return r.countries?.map((c) => ({
            country: c.iso_2,
            region: r.id,
            label: c.display_name,
          }))
        })
        .flat()
        .filter((o): o is CountryOption => !!o)
        .sort((a, b) => (a?.label ?? "").localeCompare(b?.label ?? "")) || []
    return opts
  }, [regions])

  useEffect(() => {
    if (countryCode) {
      const option = options?.find((o) => o?.country === countryCode)
      setCurrent(option)
    }
  }, [options, countryCode])

  const handleChange = async (option: CountryOption) => {
    try {
      const result = await updateRegionWithValidation(option.country, currentPath)
      if (result.removedItems.length > 0) {
        const itemsList = result.removedItems.join(", ")
        toast.info({
          title: "Carrito actualizado",
          description: `${itemsList} ${result.removedItems.length === 1 ? "no está disponible" : "no están disponibles"} en ${option.label} y ${result.removedItems.length === 1 ? "se eliminó" : "se eliminaron"} de tu carrito.`,
        })
      }
      router.push(result.newPath)
      router.refresh()
    } catch (error: any) {
      toast.error({
        title: "Error al cambiar de región",
        description: error?.message || "No se pudo actualizar la región. Inténtalo de nuevo.",
      })
    }
  }

  return (
    <div className="md:flex gap-2 items-center justify-end relative z-50">
      <Label className="label-md hidden md:block text-white/90">Envío a</Label>
      <div>
        <Listbox
          onChange={handleChange}
          defaultValue={
            countryCode
              ? options?.find((o) => o?.country === countryCode)
              : undefined
          }
        >
          <ListboxButton className="relative flex items-center gap-2 h-10 text-white hover:bg-brand-800 px-3 py-1 rounded-full transition-colors cursor-pointer focus:outline-none border-none">
            <div className="flex items-center gap-2">
              {current && (
                <>
                  {/* @ts-ignore */}
                  <ReactCountryFlag
                    alt={`Bandera de ${current.country?.toUpperCase()}`}
                    svg
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      objectFit: "cover"
                    }}
                    countryCode={current.country ?? ""}
                  />
                  <span className="text-sm font-bold uppercase">{current.country}</span>
                  <ArrowDownIcon color="white" size={14} />
                </>
              )}
            </div>
          </ListboxButton>

          <div className="flex relative w-16">
            <Transition
              as={Fragment}
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions className="absolute right-0 z-[999] mt-2 w-[240px] overflow-auto bg-white text-neutral-900 rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none max-h-[400px] py-1">
                {options?.map((o, index) => {
                  if (!o) return null;
                  return (
                    <ListboxOption
                      key={index}
                      value={o}
                      className={({ active }) =>
                        `cursor-pointer select-none relative py-3 px-4 flex items-center gap-3 transition-colors border-b border-neutral-100 last:border-0 ${
                          active ? "bg-brand-50 text-brand-900" : "text-neutral-900"
                        }`
                      }
                    >
                      {/* @ts-ignore */}
                      <ReactCountryFlag
                        svg
                        style={{
                          width: "16px",
                          height: "16px",
                        }}
                        countryCode={o.country}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{o.label}</span>
                        <span className="text-[10px] text-neutral-500 uppercase">{o.country}</span>
                      </div>
                    </ListboxOption>
                  )
                })}
              </ListboxOptions>
            </Transition>
          </div>
        </Listbox>
      </div>
    </div>
  )
}

export default CountrySelect