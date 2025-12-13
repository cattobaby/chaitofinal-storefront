import { BlogPost } from '@/types/blog';
import { BlogCard } from '@/components/organisms';

export const blogPosts: BlogPost[] = [
    {
        id: 1,
        title: "Los accesorios más elegantes del verano",
        excerpt:
            "Descubre los accesorios más sofisticados de esta temporada que combinan elegancia atemporal con diseño moderno.",
        image: '/images/blog/post-1.jpg',
        category: 'ACCESORIOS',
        href: '#',
    },
    {
        id: 2,
        title: 'Las tendencias más populares de la temporada',
        excerpt:
            'Desde colores atrevidos hasta siluetas nostálgicas, explora los looks imprescindibles que definen la narrativa de moda de esta temporada.',
        image: '/images/blog/post-2.jpg',
        category: 'GUÍA DE ESTILO',
        href: '#',
    },
    {
        id: 3,
        title: 'Tendencias minimalistas en ropa de abrigo',
        excerpt:
            'Explora las últimas prendas de abrigo minimalistas que combinan funcionalidad con una estética limpia.',
        image: '/images/blog/post-3.jpg',
        category: 'TENDENCIAS',
        href: '#',
    },
];

export function BlogSection() {
    return (
        <section className='bg-tertiary container'>
            <div className='flex items-center justify-between mb-12'>
                <h2 className='heading-lg text-tertiary'>
                    MANTENTE AL DÍA
                </h2>
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-3'>
                {blogPosts.map((post, index) => (
                    <BlogCard
                        key={post.id}
                        index={index}
                        post={post}
                    />
                ))}
            </div>
        </section>
    );
}