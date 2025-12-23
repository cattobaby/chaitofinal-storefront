"use client"
import { SelectField } from "@/components/molecules"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"

const selectOptions = [
    { label: "Más nuevos", value: "created_at" },
    { label: "Precio: de menor a mayor", value: "price_asc" },
    { label: "Precio: de mayor a menor", value: "price_desc" },
]

export const ProductListingHeader = ({ total }: { total: number }) => {
    const router = useRouter()
    const pathname = usePathname()

    const selectOptionHandler = (value: string) => {
        router.push(`${pathname}?sortBy=${value}`)
    }

    return (
        <div className="flex justify-between w-full items-center">
            <div>{total} anuncios</div>
            {/* <div className='hidden md:flex gap-2 items-center'>
        Sort by:{' '}
        <SelectField
          className='min-w-[200px]'
          options={selectOptions}
          selectOption={selectOptionHandler}
        />
      </div> */}
        </div>
    )
}
