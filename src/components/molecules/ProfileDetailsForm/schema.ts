import { z } from "zod"

export const profileDetailsSchema = z.object({
  firstName: z.string().nonempty("El nombre es obligatorio"),
  lastName: z.string().nonempty("El apellido es obligatorio"),
  phone: z.string().nonempty("El teléfono es obligatorio"),
  email: z.string().nonempty("El correo es obligatorio"),
})

export type ProfileDetailsFormData = z.infer<typeof profileDetailsSchema>
