import { z } from "zod"

export const registerFormSchema = z.object({
    firstName: z.string().nonempty("Please enter first name"),
    lastName: z.string().nonempty("Please enter last name"),
    email: z.string().nonempty("Please enter email").email("Invalid email"),
    password: z
        .string()
        .nonempty("Please enter password")
        .min(8, "Password must be at least 8 characters long")
        .regex(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/, {
            message:
                "Password must contain at least one uppercase letter and one special character",
        }),
    phone: z
        .string()
        .min(6, "Please enter phone number")
        .regex(/^\+?\d+$/, { message: "Mobile phone must contain digits only" }),
    // 👇 NEW: optional gender, but constrained to concrete values
    gender: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z
            .enum(["female", "male", "other", "prefer_not_to_say"])
            .optional()
    ),
})

export type RegisterFormData = z.infer<typeof registerFormSchema>
