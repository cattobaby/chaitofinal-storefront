import {
    CartItemsFooter,
    CartItemsHeader,
    CartItemsProducts,
} from "@/components/cells"
import { HttpTypes } from "@medusajs/types"
import { EmptyCart } from "./EmptyCart"

export const CartItems = ({
                              cart,
                              currencyCode,
                          }: {
    cart: HttpTypes.StoreCart | null
    currencyCode: string
}) => {
    if (!cart) return null

    const groupedItems: any = groupItemsBySeller(cart)

    if (!Object.keys(groupedItems).length) return <EmptyCart />

    // ✅ Determine which currency to use (Prefer Override > Cart > Default)
    const displayCurrency = currencyCode || cart.currency_code || "bob"

    return Object.keys(groupedItems).map((key) => (
        <div key={key} className="mb-4">
            <CartItemsHeader seller={groupedItems[key]?.seller} />

            <CartItemsProducts
                products={groupedItems[key].items || []}
                // ✅ Pass the override currency here
                currency_code={displayCurrency}
            />

            <CartItemsFooter
                // ✅ Pass the override currency here as well
                currency_code={displayCurrency}
                price={cart.shipping_subtotal}
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