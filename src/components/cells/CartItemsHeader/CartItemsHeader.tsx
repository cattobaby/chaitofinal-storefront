import { Divider } from "@/components/atoms"
import { SingleProductSeller } from "@/types/product"
import { format } from "date-fns"
import { SellerAvatar } from "../SellerAvatar/SellerAvatar"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

export const CartItemsHeader = ({ seller }: { seller: SingleProductSeller }) => {
  const joinedDate = (() => {
    if (!seller?.created_at) return null
    const d = new Date(seller.created_at as any)
    return isNaN(d.getTime()) ? null : d
  })()

  return (
    <LocalizedClientLink href={`/sellers/${seller.handle}`}>
      <div className="border rounded-sm p-4 flex gap-4 items-center">
        <SellerAvatar photo={seller.photo} size={32} alt={seller.name} />

        <div className="lg:flex gap-2">
          <p className="uppercase heading-xs">{seller.name}</p>

          {seller.id !== "fleek" && joinedDate && (
            <div className="flex items-center gap-2">
              <Divider square />
              <p className="label-md text-secondary">
                Se unió: {format(joinedDate, "yyyy-MM-dd")}
              </p>
            </div>
          )}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
