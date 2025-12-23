"use client"

import { Chip } from "@/components/atoms"
import useFilters from "@/hooks/useFilters"
import { CloseIcon } from "@/icons"

const filtersLabels: Record<string, string> = {
  category: "Categoría",
  brand: "Marca",
  product: "Producto",
  min_price: "Precio mín.",
  max_price: "Precio máx.",
  color: "Color",
  size: "Talla",
  query: "Búsqueda",
  condition: "Condición",
  rating: "Calificación",
  seller_rating: "Calificación",
  sale: "Oferta",
}

export const ActiveFilterElement = ({ filter }: { filter: string[] }) => {
  const key = filter?.[0] || ""
  const value = filter?.[1] || ""

  const { updateFilters } = useFilters(key)

  const activeFilters = value.split(",").map((v) => v.trim()).filter(Boolean)

  const removeFilterHandler = (val: string) => {
    updateFilters(val)
  }

  return (
    <div className="flex gap-2 items-center mb-4">
      <span className="label-md hidden md:inline-block">
        {(filtersLabels[key] || key)}:
      </span>

      {activeFilters.map((element, idx) => {
        const Element = () => (
          <span className="flex gap-2 items-center cursor-default whitespace-nowrap">
            {element}{" "}
            <span onClick={() => removeFilterHandler(element)}>
              <CloseIcon size={16} className="cursor-pointer" />
            </span>
          </span>
        )

        return <Chip key={`${key}-${element}-${idx}`} value={<Element />} />
      })}
    </div>
  )
}
