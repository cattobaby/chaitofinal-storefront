import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  Fragment,
} from "react"

import { HttpTypes } from "@medusajs/types"
import NativeSelect, { NativeSelectProps } from "@/components/molecules/NativeSelect/NativeSelect"
import clsx from "clsx"
import { Listbox, Transition } from "@headlessui/react"
import { clx } from "@medusajs/ui"
import { ChevronUpDown } from "@medusajs/icons"

type MinimalCountry = { iso_2?: string; display_name?: string }
type MinimalRegion = { countries?: MinimalCountry[] }

type Props = NativeSelectProps & {
  region?: HttpTypes.StoreRegion | MinimalRegion | null
}

type CountryOption = { value: string; label: string }

const CountrySelect = forwardRef<HTMLSelectElement, Props>(
  ({ placeholder = "País", region, defaultValue, ...props }, ref) => {
    const innerRef = useRef<HTMLSelectElement>(null)

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current
    )

    const [fallbackCountries, setFallbackCountries] = useState<
      { iso_2: string; display_name: string }[]
    >([])
    const [isLoadingFallback, setIsLoadingFallback] = useState(false)

    const hasProvidedCountries =
      Array.isArray(region?.countries) && (region?.countries?.length ?? 0) > 0

    const countryOptions: CountryOption[] = useMemo(() => {
      const source: MinimalCountry[] = hasProvidedCountries
        ? (region?.countries as MinimalCountry[])
        : fallbackCountries

      return (
        source
          ?.map((c) => ({
            value: (c?.iso_2 ?? "").trim(),
            label: (c?.display_name ?? "").trim(),
          }))
          ?.filter((c) => c.value && c.label) ?? []
      )
    }, [region?.countries, fallbackCountries, hasProvidedCountries])

    // Fallback fetch (client-side) if no countries were provided
    useEffect(() => {
      if (hasProvidedCountries) return
      let cancelled = false

      const fetchCountries = async () => {
        setIsLoadingFallback(true)

        const backendBase =
          (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL &&
            process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL.trim()) ||
          "http://localhost:9000"

        const backendUrl = `${backendBase.replace(/\/$/, "")}/store/regions?fields=id,name,*countries`

        const headers: Record<string, string> = {
          accept: "application/json",
          "content-type": "application/json",
        }

        if (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
          headers["x-publishable-api-key"] =
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string
        }

        const tryBackend = async () => {
          try {
            const res = await fetch(backendUrl, { headers, cache: "no-store" })
            if (!res.ok) return null

            const json = (await res.json()) as {
              regions?: { countries?: MinimalCountry[] }[]
            }

            const all =
              json?.regions
                ?.flatMap((r) => r?.countries ?? [])
                .map((c) => ({
                  iso_2: (c?.iso_2 ?? "").trim(),
                  display_name: (c?.display_name ?? "").trim(),
                }))
                .filter((c) => c.iso_2 && c.display_name) ?? []

            return all
          } catch {
            return null
          }
        }

        const trySameOrigin = async () => {
          try {
            const origin =
              typeof window !== "undefined" ? window.location.origin : ""
            const sameOriginUrl = new URL(
              "/store/regions?fields=id,name,*countries",
              origin
            ).toString()

            const res = await fetch(sameOriginUrl, {
              headers,
              cache: "no-store",
            })
            if (!res.ok) return null

            const json = (await res.json()) as {
              regions?: { countries?: MinimalCountry[] }[]
            }

            const all =
              json?.regions
                ?.flatMap((r) => r?.countries ?? [])
                .map((c) => ({
                  iso_2: (c?.iso_2 ?? "").trim(),
                  display_name: (c?.display_name ?? "").trim(),
                }))
                .filter((c) => c.iso_2 && c.display_name) ?? []

            return all
          } catch {
            return null
          }
        }

        const backendCountries = await tryBackend()
        const finalCountries =
          backendCountries && backendCountries.length > 0
            ? backendCountries
            : await trySameOrigin()

        if (!cancelled) {
          setFallbackCountries(finalCountries ?? [])
          setIsLoadingFallback(false)
        }
      }

      fetchCountries()
      return () => {
        cancelled = true
      }
    }, [hasProvidedCountries])

    const handleSelect = (value: string) => {
      props.onChange?.({
        target: {
          name: props.name,
          value,
        },
      } as any)
    }

    const selectedLabel =
      countryOptions.find((c) => c.value === props.value)?.label ||
      (isLoadingFallback ? "Cargando países..." : "Elige un país")

    return (
      <label className="label-md">
        <p className="mb-2">País</p>

        <Listbox onChange={handleSelect} value={props.value}>
          <div className="relative">
            <Listbox.Button
              className={clsx(
                "relative w-full flex justify-between items-center px-4 h-12 bg-component-secondary text-left cursor-default focus:outline-none border rounded-lg focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-gray-300 focus-visible:ring-offset-2 focus-visible:border-gray-300 text-base-regular"
              )}
              data-testid="country-select"
            >
              {({ open }) => (
                <>
                  <span className="block truncate">{selectedLabel}</span>
                  <ChevronUpDown
                    className={clx("transition-rotate duration-200", {
                      "transform rotate-180": open,
                    })}
                  />
                </>
              )}
            </Listbox.Button>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                className="absolute z-20 w-full overflow-auto text-small-regular bg-white border rounded-lg border-top-0 max-h-60 focus:outline-none sm:text-sm"
                data-testid="country-options"
              >
                {countryOptions.length === 0 ? (
                  <div className="px-6 py-4 text-ui-fg-subtle">
                    {isLoadingFallback ? "Cargando países…" : "No hay países disponibles"}
                  </div>
                ) : (
                  countryOptions.map(({ value, label }, index) => (
                    <Listbox.Option
                      key={`${value}-${index}`}
                      value={value}
                      className="cursor-default select-none relative pl-6 pr-10 hover:bg-gray-50 py-4 border-b"
                      data-testid="country-option"
                    >
                      {label}
                    </Listbox.Option>
                  ))
                )}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>

        {/* Hidden native select to keep RHF compatibility */}
        <div className="hidden">
          <NativeSelect
            ref={innerRef}
            placeholder={placeholder}
            defaultValue={defaultValue}
            className={clsx("hidden w-full h-12 items-center bg-component-secondary")}
            {...props}
          >
            {countryOptions.map(({ value, label }, index) => (
              <option key={index} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </label>
    )
  }
)

CountrySelect.displayName = "CountrySelect"
export default CountrySelect
