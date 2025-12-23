import { Cart } from '@/components/sections';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Carrito',
    description: 'Página de mi carrito',
};

export default function CartPage({}) {
    return (
        <main className='container grid grid-cols-12'>
            <Suspense fallback={<>Cargando...</>}>
                <Cart />
            </Suspense>
        </main>
    );
}
