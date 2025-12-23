import { TabsContent, TabsList } from "@/components/molecules"
import { Suspense } from "react"
import { ProductsPagination } from "../ProductsPagination/ProductsPagination"

export const wishlistTabs = [
    { label: "Todo", link: "/wishlist" },
    { label: "Productos", link: "/wishlist/products" },
    { label: "Colecciones", link: "/wishlist/collections" },
]

export const WishlistTabs = async ({ tab }: { tab: string }) => {
    return (
        <div>
            <TabsList list={wishlistTabs} activeTab={tab} />
            <TabsContent value="all" activeTab={tab}>
                <Suspense fallback={<>Cargando...</>}>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 mt-8"></div>
                    <ProductsPagination pages={2} />
                </Suspense>
            </TabsContent>
            <TabsContent value="products" activeTab={tab}>
                <Suspense fallback={<>Cargando...</>}>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 mt-8"></div>
                    <ProductsPagination pages={2} />
                </Suspense>
            </TabsContent>
            <TabsContent value="collections" activeTab={tab}>
                <Suspense fallback={<>Cargando...</>}>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 mt-8"></div>
                    <ProductsPagination pages={2} />
                </Suspense>
            </TabsContent>
        </div>
    )
}
