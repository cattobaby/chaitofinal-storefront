import { Button } from "@/components/atoms/Button/Button"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { UserNavigation } from "@/components/molecules/UserNavigation/UserNavigation"

export default async function RequestSuccessPage({
                                                     params,
                                                 }: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    return (
        <main className="container">
            <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
                <UserNavigation />
                <div className="md:col-span-3 text-center">
                    {/* UPDATED: Added text-green-700 for success confirmation state */}
                    <h1 className="heading-md uppercase text-green-700">Devolución solicitada</h1>
                    <p className="label-md text-secondary w-96 mx-auto my-8">
                        Tu solicitud de devolución ha sido enviada. Una vez que el vendedor la confirme,
                        recibirás un correo de confirmación.
                    </p>
                    <LocalizedClientLink href={`/user/returns${id && `?return=${id}`}`}>
                        <Button className="label-md uppercase px-12 py-3">
                            Detalles de la devolución
                        </Button>
                    </LocalizedClientLink>
                </div>
            </div>
        </main>
    )
}