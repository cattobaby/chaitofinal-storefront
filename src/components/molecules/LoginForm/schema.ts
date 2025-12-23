import { z } from "zod"

export const loginFormSchema = z.object({
  email: z.string().nonempty("Ingresa tu correo").email("Correo inválido"),
  password: z.string().nonempty("Ingresa tu contraseña"),
})

export type LoginFormData = z.infer<typeof loginFormSchema>
