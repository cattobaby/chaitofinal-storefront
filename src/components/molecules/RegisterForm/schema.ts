import { z } from "zod"

export const registerFormSchema = z.object({
    firstName: z.string().nonempty("Ingresa tu nombre"),
    lastName: z.string().nonempty("Ingresa tu apellido"),
    email: z.string().nonempty("Ingresa tu correo").email("Correo inválido"),
    password: z
        .string()
        .nonempty("Ingresa tu contraseña")
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .regex(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/, {
            message:
                "La contraseña debe incluir al menos una letra mayúscula y un carácter especial",
        }),
    phone: z
        .string()
        .min(6, "Ingresa tu número de teléfono")
        .regex(/^\+?\d+$/, { message: "El teléfono debe contener solo dígitos" }),
    // 👇 NEW: optional gender, but constrained to concrete values
    gender: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z
            .enum(["female", "male", "other", "prefer_not_to_say"])
            .optional()
    ),
})

export type RegisterFormData = z.infer<typeof registerFormSchema>
