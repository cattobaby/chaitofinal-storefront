import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/atoms"
import AddressSelect from "@/components/cells/AddressSelect/AddressSelect"
import CountrySelect from "@/components/cells/CountrySelect/CountrySelect"
import { usePathname } from "next/navigation"
import GpsLocationPicker from "./GpsLocationPicker"

const ShippingAddress = ({
                             customer,
                             cart,
                             checked,
                             onChange,
                         }: {
    customer: HttpTypes.StoreCustomer | null
    cart: HttpTypes.StoreCart | null
    checked: boolean
    onChange: () => void
}) => {
    const pathname = usePathname()
    const locale = pathname.split("/")[1]

    const [formData, setFormData] = useState<Record<string, any>>(() => {
        const metadata =
            (cart?.shipping_address?.metadata as Record<string, any> | undefined) ?? {}

        const gpsLat =
            metadata?.gps_latitude != null ? String(metadata.gps_latitude) : ""
        const gpsLng =
            metadata?.gps_longitude != null ? String(metadata.gps_longitude) : ""

        return {
            "shipping_address.first_name": cart?.shipping_address?.first_name || "",
            "shipping_address.last_name": cart?.shipping_address?.last_name || "",
            "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
            "shipping_address.company": cart?.shipping_address?.company || "",
            "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
            "shipping_address.city": cart?.shipping_address?.city || "",
            "shipping_address.country_code":
                cart?.shipping_address?.country_code || locale,
            "shipping_address.province": cart?.shipping_address?.province || "",
            "shipping_address.phone": cart?.shipping_address?.phone || "",
            "shipping_address.metadata.gps_latitude": gpsLat,
            "shipping_address.metadata.gps_longitude": gpsLng,
            email: cart?.email || "",
        }
    })

    // check if customer has saved addresses that are in the current region
    const addressesInRegion = useMemo(
        () =>
            customer?.addresses.filter(
                (a) => a.country_code && a.country_code === locale
            ),
        [customer?.addresses, locale]
    )

    const setFormAddress = (
        address?: HttpTypes.StoreCartAddress,
        email?: string
    ) => {
        if (address) {
            const metadata =
                (address.metadata as Record<string, any> | undefined) ?? {}

            const gpsLat =
                metadata?.gps_latitude != null ? String(metadata.gps_latitude) : ""
            const gpsLng =
                metadata?.gps_longitude != null ? String(metadata.gps_longitude) : ""

            setFormData((prevState: Record<string, any>) => ({
                ...prevState,
                "shipping_address.first_name": address.first_name || "",
                "shipping_address.last_name": address.last_name || "",
                "shipping_address.address_1": address.address_1 || "",
                "shipping_address.company": address.company || "",
                "shipping_address.postal_code": address.postal_code || "",
                "shipping_address.city": address.city || "",
                "shipping_address.country_code": address.country_code || locale,
                "shipping_address.province": address.province || "",
                "shipping_address.phone": address.phone || "",
                "shipping_address.metadata.gps_latitude": gpsLat,
                "shipping_address.metadata.gps_longitude": gpsLng,
            }))
        }

        if (email) {
            setFormData((prevState: Record<string, any>) => ({
                ...prevState,
                email,
            }))
        }
    }

    useEffect(() => {
        if (cart && cart.shipping_address) {
            setFormAddress(cart.shipping_address, cart.email || undefined)
        }

        if (cart && !cart.email && customer?.email) {
            setFormAddress(undefined, customer.email)
        }
    }, [cart, customer?.email])

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLInputElement | HTMLSelectElement
        >
    ) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }))
    }

    const gpsLatRaw = formData["shipping_address.metadata.gps_latitude"]
    const gpsLngRaw = formData["shipping_address.metadata.gps_longitude"]

    const parsedGpsLat =
        typeof gpsLatRaw === "string" &&
        gpsLatRaw.trim() !== "" &&
        !isNaN(Number(gpsLatRaw))
            ? Number(gpsLatRaw)
            : undefined

    const parsedGpsLng =
        typeof gpsLngRaw === "string" &&
        gpsLngRaw.trim() !== "" &&
        !isNaN(Number(gpsLngRaw))
            ? Number(gpsLngRaw)
            : undefined

    return (
        <>
            {customer && (addressesInRegion?.length || 0) > 0 && (
                <Container className="mb-6 flex flex-col gap-y-4 p-0">
                    <p className="text-small-regular">
                        {`Hola ${customer.first_name}, ¿quieres usar una de tus direcciones guardadas?`}
                    </p>
                    <div className="grid grid-cols-1 gap-x-4 lg:grid-cols-2">
                        <AddressSelect
                            addresses={addressesInRegion || []}
                            addressInput={
                                mapKeys(formData, (_, key) =>
                                    key.replace("shipping_address.", "")
                                ) as HttpTypes.StoreCartAddress
                            }
                            onSelect={setFormAddress}
                        />
                    </div>
                </Container>
            )}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Input
                    label="Nombre"
                    name="shipping_address.first_name"
                    autoComplete="given-name"
                    value={formData["shipping_address.first_name"]}
                    onChange={handleChange}
                    required
                    data-testid="shipping-first-name-input"
                />
                <Input
                    label="Apellido"
                    name="shipping_address.last_name"
                    autoComplete="family-name"
                    value={formData["shipping_address.last_name"]}
                    onChange={handleChange}
                    required
                    data-testid="shipping-last-name-input"
                />
                <Input
                    label="Dirección"
                    name="shipping_address.address_1"
                    autoComplete="address-line1"
                    value={formData["shipping_address.address_1"]}
                    onChange={handleChange}
                    required
                    data-testid="shipping-address-input"
                />
                <Input
                    label="Empresa"
                    name="shipping_address.company"
                    value={formData["shipping_address.company"]}
                    onChange={handleChange}
                    autoComplete="organization"
                    data-testid="shipping-company-input"
                />
                <Input
                    label="Código postal"
                    name="shipping_address.postal_code"
                    autoComplete="postal-code"
                    value={formData["shipping_address.postal_code"]}
                    onChange={handleChange}
                    required
                    data-testid="shipping-postal-code-input"
                />
                <Input
                    label="Ciudad"
                    name="shipping_address.city"
                    autoComplete="address-level2"
                    value={formData["shipping_address.city"]}
                    onChange={handleChange}
                    required
                    data-testid="shipping-city-input"
                />
                <CountrySelect
                    name="shipping_address.country_code"
                    autoComplete="country"
                    region={cart?.region}
                    value={formData["shipping_address.country_code"]}
                    onChange={handleChange}
                    required
                    data-testid="shipping-country-select"
                />
                <Input
                    label="Departamento / Provincia"
                    name="shipping_address.province"
                    autoComplete="address-level1"
                    value={formData["shipping_address.province"]}
                    onChange={handleChange}
                    data-testid="shipping-province-input"
                />
            </div>
            <div className="my-4 grid grid-cols-2 gap-4">
                <Input
                    label="Email"
                    name="email"
                    type="email"
                    title="Ingresa un correo válido."
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    data-testid="shipping-email-input"
                />
                <Input
                    label="Teléfono"
                    name="shipping_address.phone"
                    autoComplete="tel"
                    value={formData["shipping_address.phone"]}
                    onChange={handleChange}
                    data-testid="shipping-phone-input"
                />
            </div>

            {/* GPS inputs + map */}
            <div className="my-4 grid grid-cols-2 gap-4">
                <Input
                    label="Latitud (opcional)"
                    name="shipping_address.metadata.gps_latitude"
                    autoComplete="off"
                    placeholder="p. ej. -17.7609"
                    value={formData["shipping_address.metadata.gps_latitude"] ?? ""}
                    onChange={handleChange}
                />
                <Input
                    label="Longitud (opcional)"
                    name="shipping_address.metadata.gps_longitude"
                    autoComplete="off"
                    placeholder="p. ej. -63.1681"
                    value={formData["shipping_address.metadata.gps_longitude"] ?? ""}
                    onChange={handleChange}
                />
            </div>

            <GpsLocationPicker
                latitude={parsedGpsLat}
                longitude={parsedGpsLng}
                onChange={({ latitude, longitude }) => {
                    setFormData((prev) => ({
                        ...prev,
                        "shipping_address.metadata.gps_latitude": String(latitude),
                        "shipping_address.metadata.gps_longitude": String(longitude),
                    }))
                }}
            />
        </>
    )
}

export default ShippingAddress
