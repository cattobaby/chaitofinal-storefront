import { LoginForm, UserNavigation } from "@/components/molecules"
import { retrieveCustomer } from "@/lib/data/customer"
import { OrdersPagination } from "@/components/sections"
import { isEmpty } from "lodash"
import { listOrders } from "@/lib/data/orders"
import { ParcelAccordion } from "@/components/molecules/ParcelAccordion/ParcelAccordion"

const LIMIT = 10
export const dynamic = "force-dynamic"

export default async function UserPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const user = await retrieveCustomer()
  if (!user) return <LoginForm />

  const orders = await listOrders()
  const { page } = await searchParams
  
  return (
    <main className="container">
       <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
          <UserNavigation />
          <div className="md:col-span-3 space-y-8">
             <h1 className="heading-md uppercase">Pedidos</h1>
             <p>Lista de pedidos</p>
          </div>
       </div>
    </main>
  )
}