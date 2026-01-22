import { Carousel } from "@/components/cells"
import { CategoryCard } from "@/components/organisms"
import { listCategories } from "@/lib/data/categories"
import { HttpTypes } from "@medusajs/types"

export const HomeCategories = async ({ heading }: { heading: string }) => {
    // FIX: Removed 'limit' as it is not part of the expected type
    const { categories } = await listCategories({
        // @ts-ignore -- Forced param for filtering
        parent_category_id: "null",
    })

    // Slice manually
    const limitedCategories = (categories || []).slice(0, 15)

    if (!limitedCategories.length) {
        return null
    }

    return (
        <section className="bg-white py-8 w-full">
            <div className="container mx-auto px-4">
                <h2 className="text-xl md:text-2xl font-bold text-green-700 uppercase mb-6">
                    {heading}
                </h2>
                <Carousel
                    items={limitedCategories.map((category) => (
                        <CategoryCard
                            key={category.id}
                            category={{
                                name: category.name,
                                handle: category.handle
                            }}
                        />
                    ))}
                />
            </div>
        </section>
    )
}