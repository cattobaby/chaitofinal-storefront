import { z } from "zod"

export const addressSchema = z.object({
  addressId: z.string().optional(),
  addressName: z.string().nonempty("El nombre de la dirección es obligatorio"),
  firstName: z.string().nonempty("El nombre es obligatorio"),
  lastName: z.string().nonempty("El apellido es obligatorio"),
  address: z.string().nonempty("La dirección es obligatoria"),
  city: z.string().nonempty("La ciudad es obligatoria"),
  countryCode: z.string().nonempty("El país es obligatorio"),
  postalCode: z.string().nonempty("El código postal es obligatorio"),
  company: z.string().optional(),
  province: z.string().optional(),
  phone: z
    .string()
    .nonempty("El número de teléfono es obligatorio")
    .regex(/^\+?[0-9\s\-()]+$/, "Formato de teléfono inválido"),
  metadata: z.record(z.any()).optional(),
})

export type AddressFormData = z.infer<typeof addressSchema>
