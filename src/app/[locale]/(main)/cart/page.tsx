import { Cart } from '@/components/sections';
import { Metadata } from 'next';
import { Suspense } from 'react';
// ✅ Import server helpers here
import { headers } from "next/headers"
import { getCurrencyCodeFromCookieHeader } from "@/lib/server/currency"

export const metadata: Metadata = {
    title: 'Carrito',
    description: 'Página de mi carrito',
};

export default async function CartPage() {
    // ✅ Read cookie on the server
    const headersList = await headers()
    const cookieHeader = headersList.get("cookie")
    const currencyCode = getCurrencyCodeFromCookieHeader(cookieHeader)

    return (
        <main className='container grid grid-cols-12'>
            <Suspense fallback={<>Cargando...</>}>
                {/* ✅ Pass the data down */}
                <Cart currencyCode={currencyCode} />
            </Suspense>
        </main>
    );
}