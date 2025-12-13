import { Carousel } from "@/components/cells"
import { CategoryCard } from "@/components/organisms"
import { listCategories } from "@/lib/data/categories" // 1. Import the real fetching function
import { HttpTypes } from "@medusajs/types"

export const HomeCategories = async ({ heading }: { heading: string }) => {

    // 2. Fetch the categories from the backend
    // 'parent_category_id: null' ensures we only get top-level categories (Men, Women, Electronics), not sub-sub-categories
    const { categories } = await listCategories({
        limit: 15,
        // @ts-ignore -- query params sometimes vary by SDK version, but this filter usually helps avoid nested mess
        parent_category_id: "null",
    })

    // 3. If no categories exist yet, hide the section to avoid empty white space
    if (!categories || categories.length === 0) {
        return null
    }

    return (
        <section className="bg-white py-8 w-full">
            <div className="container mx-auto px-4">
                {/* UPDATED: Changed text-brand-700 to text-green-700 to differentiate section headers */}
                <h2 className="text-xl md:text-2xl font-bold text-green-700 uppercase mb-6">
                    {heading}
                </h2>

                {/* 4. Render the Real Categories */}
                <Carousel
                    items={categories.map((category) => (
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