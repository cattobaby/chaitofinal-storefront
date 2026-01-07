import { CartItemsHeader, CartItemsProducts } from "@/components/cells"
import { HttpTypes } from "@medusajs/types"

// ✅ 1. Update props to accept currencyCode
export const CartItems = ({
                              cart,
                              currencyCode
                          }: {
    cart: HttpTypes.StoreCart | null
    currencyCode: string
}) => {
    if (!cart) return null

    const groupedItems: any = groupItemsBySeller(cart)

    // ✅ 2. Determine display currency (Override > Cart > Default)
    const displayCurrency = currencyCode || (cart as any)?.currency_code || (cart as any)?.region?.currency_code || "bob"

    return Object.keys(groupedItems).map((key) => (
        <div key={key} className="mb-4">
            <CartItemsHeader seller={groupedItems[key]?.seller} />
            <CartItemsProducts
                delete_item={false}
                products={groupedItems[key].items || []}
                // ✅ 3. Pass the override currency
                currency_code={displayCurrency}
            />
        </div>
    ))
}

function groupItemsBySeller(cart: HttpTypes.StoreCart) {
    const groupedBySeller: any = {}

    cart.items?.forEach((item: any) => {
        const seller = item.product?.seller
        if (seller) {
            if (!groupedBySeller[seller.id]) {
                groupedBySeller[seller.id] = {
                    seller: seller,
                    items: [],
                }
            }
            groupedBySeller[seller.id].items.push(item)
        } else {
            if (!groupedBySeller["fleek"]) {
                groupedBySeller["fleek"] = {
                    seller: {
                        name: "Fleek",
                        id: "fleek",
                        photo: "/Logo.svg",
                        created_at: new Date(),
                    },
                    items: [],
                }
            }
            groupedBySeller["fleek"].items.push(item)
        }
    })

    return groupedBySeller
}